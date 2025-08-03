import api from "./api";

export const fileService = {
  // Get files for current folder
  getFiles: async (folderId = null) => {
    const params = folderId ? { folderId } : {};
    return api.get("/files", { params });
  },

  // Get folders for current folder
  getFolders: async (folderId = null) => {
    const params = folderId ? { folderId } : {};
    return api.get("/folders", { params });
  },

  // Upload a file
  uploadFile: async (file, folderId = null, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) {
      formData.append("folderId", folderId);
    }

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
  },

  // Create a new folder
  createFolder: async (name, parentFolderId = null) => {
    return api.post("/folders", {
      name,
      parentFolderId,
    });
  },

  // Delete a file
  deleteFile: async (fileId) => {
    return api.delete(`/files/${fileId}`);
  },

  // Delete a folder
  deleteFolder: async (folderId) => {
    return api.delete(`/folders/${folderId}`);
  },

  // Update file metadata
  updateFile: async (fileId, updates) => {
    return api.put(`/files/${fileId}`, updates);
  },

  // Update folder metadata
  updateFolder: async (folderId, updates) => {
    return api.put(`/folders/${folderId}`, updates);
  },

  // Download a file
  downloadFile: async (fileId) => {
    return api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });
  },

  // Share a file
  shareFile: async (fileId, shareData) => {
    return api.post(`/files/${fileId}/share`, shareData);
  },

  // Get shared files
  getSharedFiles: async () => {
    return api.get("/files/shared");
  },

  // Get file details
  getFileDetails: async (fileId) => {
    return api.get(`/files/${fileId}`);
  },

  // Get folder details
  getFolderDetails: async (folderId) => {
    return api.get(`/folders/${folderId}`);
  },

  // Move file to folder
  moveFile: async (fileId, targetFolderId) => {
    return api.put(`/files/${fileId}/move`, {
      targetFolderId,
    });
  },

  // Move folder to another folder
  moveFolder: async (folderId, targetFolderId) => {
    return api.put(`/folders/${folderId}/move`, {
      targetFolderId,
    });
  },

  // Copy file to folder
  copyFile: async (fileId, targetFolderId) => {
    return api.post(`/files/${fileId}/copy`, {
      targetFolderId,
    });
  },

  // Copy folder to another folder
  copyFolder: async (folderId, targetFolderId) => {
    return api.post(`/folders/${folderId}/copy`, {
      targetFolderId,
    });
  },

  // Search files and folders
  search: async (query, filters = {}) => {
    return api.get("/search", {
      params: {
        q: query,
        ...filters,
      },
    });
  },

  // Get file preview URL
  getPreviewUrl: (fileId) => {
    return `${process.env.REACT_APP_API_URL}/files/${fileId}/preview`;
  },

  // Get file thumbnail URL
  getThumbnailUrl: (fileId) => {
    return `${process.env.REACT_APP_API_URL}/files/${fileId}/thumbnail`;
  },

  // Get storage usage
  getStorageUsage: async () => {
    return api.get("/storage/usage");
  },

  // Get file types statistics
  getFileTypeStats: async () => {
    return api.get("/files/stats/types");
  },

  // Get recent files
  getRecentFiles: async (limit = 10) => {
    return api.get("/files/recent", {
      params: { limit },
    });
  },

  // Get favorite files
  getFavoriteFiles: async () => {
    return api.get("/files/favorites");
  },

  // Toggle file favorite status
  toggleFavorite: async (fileId) => {
    return api.put(`/files/${fileId}/favorite`);
  },

  // Get trash items
  getTrashItems: async () => {
    return api.get("/trash");
  },

  // Restore item from trash
  restoreFromTrash: async (itemId, itemType) => {
    return api.put(`/trash/${itemId}/restore`, { itemType });
  },

  // Permanently delete from trash
  permanentlyDelete: async (itemId, itemType) => {
    return api.delete(`/trash/${itemId}`, { data: { itemType } });
  },

  // Empty trash
  emptyTrash: async () => {
    return api.delete("/trash");
  },
};

export default fileService;
