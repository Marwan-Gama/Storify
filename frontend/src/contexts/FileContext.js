import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { fileService } from "../services/fileService";

const FileContext = createContext();

const initialState = {
  files: [],
  folders: [],
  currentFolder: null,
  loading: false,
  error: null,
  selectedFiles: [],
  searchQuery: "",
  sortBy: "name",
  sortOrder: "asc",
  viewMode: "grid",
};

const fileReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_FILES":
      return { ...state, files: action.payload, loading: false };
    case "SET_FOLDERS":
      return { ...state, folders: action.payload, loading: false };
    case "SET_CURRENT_FOLDER":
      return { ...state, currentFolder: action.payload };
    case "ADD_FILE":
      return { ...state, files: [...state.files, action.payload] };
    case "UPDATE_FILE":
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.payload.id ? action.payload : file
        ),
      };
    case "DELETE_FILE":
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.payload),
      };
    case "SET_SELECTED_FILES":
      return { ...state, selectedFiles: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_SORT":
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

export const FileProvider = ({ children }) => {
  const [state, dispatch] = useReducer(fileReducer, initialState);
  const { isAuthenticated } = useAuth();

  const loadFiles = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await fileService.getFiles(state.currentFolder?.id);
      dispatch({ type: "SET_FILES", payload: response.data });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, [state.currentFolder?.id]);

  // Load files when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadFiles();
    }
  }, [isAuthenticated, loadFiles]);

  const loadFolders = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await fileService.getFolders(state.currentFolder?.id);
      dispatch({ type: "SET_FOLDERS", payload: response.data });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  };

  const uploadFile = async (file, onProgress) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await fileService.uploadFile(
        file,
        state.currentFolder?.id,
        onProgress
      );
      dispatch({ type: "ADD_FILE", payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const createFolder = async (name) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const response = await fileService.createFolder(
        name,
        state.currentFolder?.id
      );
      dispatch({
        type: "SET_FOLDERS",
        payload: [...state.folders, response.data],
      });
      return response.data;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      dispatch({ type: "DELETE_FILE", payload: fileId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const updateFile = async (fileId, updates) => {
    try {
      const response = await fileService.updateFile(fileId, updates);
      dispatch({ type: "UPDATE_FILE", payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  };

  const setCurrentFolder = (folder) => {
    dispatch({ type: "SET_CURRENT_FOLDER", payload: folder });
  };

  const setSelectedFiles = (files) => {
    dispatch({ type: "SET_SELECTED_FILES", payload: files });
  };

  const setSearchQuery = (query) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  };

  const setSort = (sortBy, sortOrder) => {
    dispatch({ type: "SET_SORT", payload: { sortBy, sortOrder } });
  };

  const setViewMode = (mode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    ...state,
    loadFiles,
    loadFolders,
    uploadFile,
    createFolder,
    deleteFile,
    updateFile,
    setCurrentFolder,
    setSelectedFiles,
    setSearchQuery,
    setSort,
    setViewMode,
    clearError,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};
