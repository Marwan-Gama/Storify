import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          const { token } = response.data.data;
          localStorage.setItem("token", token);
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          originalRequest.headers["Authorization"] = `Bearer ${token}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

// File upload helper
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/files/upload", formData, {
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
  const response = await api.get(`/files/${fileId}/download`, {
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
  return `${process.env.REACT_APP_API_URL}/files/${fileId}/preview`;
};

// Share file helper
export const shareFile = async (fileId, shareData) => {
  return api.post(`/files/${fileId}/share`, shareData);
};

// Create folder helper
export const createFolder = async (folderData) => {
  return api.post("/folders", folderData);
};

// Get folder contents helper
export const getFolderContents = async (folderId = null) => {
  const params = folderId ? { folderId } : {};
  return api.get("/folders", { params });
};

// Search files helper
export const searchFiles = async (query, filters = {}) => {
  return api.get("/files/search", {
    params: { q: query, ...filters },
  });
};

// Get storage stats helper
export const getStorageStats = async () => {
  return api.get("/files/storage-stats");
};

// Get shared files helper
export const getSharedFiles = async () => {
  return api.get("/shares");
};

// Get trash files helper
export const getTrashFiles = async () => {
  return api.get("/files/trash");
};

// Restore file from trash helper
export const restoreFile = async (fileId) => {
  return api.post(`/files/${fileId}/restore`);
};

// Permanently delete file helper
export const permanentlyDeleteFile = async (fileId) => {
  return api.delete(`/files/${fileId}/permanent`);
};

// Admin helpers
export const getUsers = async () => {
  return api.get("/admin/users");
};

export const updateUser = async (userId, userData) => {
  return api.put(`/admin/users/${userId}`, userData);
};

export const deleteUser = async (userId) => {
  return api.delete(`/admin/users/${userId}`);
};

export const getSystemStats = async () => {
  return api.get("/admin/stats");
};

export default api;
