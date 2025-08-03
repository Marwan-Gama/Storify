import axios from "axios";
import toast from "react-hot-toast";

// Request deduplication cache
const pendingRequests = new Map();

// Request queue for rate limiting
const requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Create a unique key for each request
const createRequestKey = (config) => {
  return `${config.method?.toUpperCase() || "GET"}:${
    config.url
  }:${JSON.stringify(config.params || {})}`;
};

// Process the request queue
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${delay}ms before next request`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const { config, resolve, reject } = requestQueue.shift();
    lastRequestTime = Date.now();

    try {
      const response = await axios(config);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }

  isProcessingQueue = false;
};

// Request interceptor for deduplication and queuing
const requestInterceptor = (config) => {
  const requestKey = createRequestKey(config);

  // Check if there's already a pending request with the same key
  if (pendingRequests.has(requestKey)) {
    console.log(`Request deduplicated: ${requestKey}`);
    return Promise.reject(new axios.Cancel("Request deduplicated"));
  }

  // Create a new promise for this request
  const requestPromise = new Promise((resolve, reject) => {
    pendingRequests.set(requestKey, { resolve, reject });
  });

  // Store the promise in the config for later use
  config.requestPromise = requestPromise;
  config.requestKey = requestKey;

  // Add to queue for rate limiting
  return new Promise((resolve, reject) => {
    requestQueue.push({ config, resolve, reject });
    processQueue();
  });
};

// Response interceptor for cleanup
const responseInterceptor = (response) => {
  const requestKey = response.config.requestKey;
  if (requestKey && pendingRequests.has(requestKey)) {
    const { resolve } = pendingRequests.get(requestKey);
    resolve(response);
    pendingRequests.delete(requestKey);
  }
  return response;
};

// Error interceptor for cleanup and retry logic
const errorInterceptor = async (error) => {
  const requestKey = error.config?.requestKey;

  // Clean up pending request
  if (requestKey && pendingRequests.has(requestKey)) {
    const { reject } = pendingRequests.get(requestKey);
    reject(error);
    pendingRequests.delete(requestKey);
  }

  // Handle 429 errors with longer delays
  if (error.response?.status === 429) {
    const retryCount = error.config?.retryCount || 0;
    const maxRetries = 2; // Reduced retries

    if (retryCount < maxRetries) {
      // Longer exponential backoff: 5s, 10s
      const delay = Math.pow(2, retryCount) * 5000;

      console.log(
        `Rate limited (429). Retrying in ${delay}ms... (attempt ${retryCount +
          1}/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      const retryConfig = {
        ...error.config,
        retryCount: retryCount + 1,
      };

      return axios(retryConfig);
    } else {
      console.log("Max retries reached for 429 error");
      toast.error("Too many requests. Please wait a moment and try again.");
    }
  }

  return Promise.reject(error);
};

const api = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 15000, // Increased timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptors
api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use(responseInterceptor, errorInterceptor);

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/api/auth/refresh-token`,
            { refreshToken }
          );

          const { token } = response.data.data;
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// File upload helper
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/api/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// File download helper
export const downloadFile = async (fileId, filename) => {
  const response = await api.get(`/api/files/${fileId}/download`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// File preview helper
export const getFilePreviewUrl = (fileId) => {
  return `${process.env.REACT_APP_API_URL ||
    "http://localhost:5001"}/api/files/${fileId}/preview`;
};

// Share file helper
export const shareFile = async (fileId, shareData) => {
  return api.post(`/api/files/${fileId}/share`, shareData);
};

// Create folder helper
export const createFolder = async (folderData) => {
  return api.post("/api/folders", folderData);
};

// Get folder contents helper
export const getFolderContents = async (folderId = null) => {
  const params = folderId ? { folderId } : {};
  return api.get("/api/folders", { params });
};

// Search files helper
export const searchFiles = async (query, filters = {}) => {
  return api.get("/api/files/search", {
    params: { q: query, ...filters },
  });
};

// Get storage stats helper
export const getStorageStats = async () => {
  return api.get("/api/files/storage-stats");
};

// Get shared files helper
export const getSharedFiles = async () => {
  return api.get("/api/shares");
};

// Get trash files helper
export const getTrashFiles = async () => {
  return api.get("/api/files/trash");
};

// Restore file from trash helper
export const restoreFile = async (fileId) => {
  return api.post(`/api/files/${fileId}/restore`);
};

// Permanently delete file helper
export const permanentlyDeleteFile = async (fileId) => {
  return api.delete(`/api/files/${fileId}/permanent`);
};

// Admin helpers
export const getUsers = async () => {
  return api.get("/api/admin/users");
};

export const updateUser = async (userId, userData) => {
  return api.put(`/api/admin/users/${userId}`, userData);
};

export const deleteUser = async (userId) => {
  return api.delete(`/api/admin/users/${userId}`);
};

export const getSystemStats = async () => {
  return api.get("/api/admin/stats");
};

export default api;
