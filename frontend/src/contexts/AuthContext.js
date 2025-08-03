import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import api from "../services/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Initialize Authorization header if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  // Fetch user profile if token exists
  useQuery(["user", state.token], () => api.get("/api/auth/profile"), {
    enabled: !!state.token,
    retry: false,
    onSuccess: (data) => {
      console.log("User profile fetched:", data.data); // Debug log
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: data.data.user, token: state.token },
      });
    },
    onError: (error) => {
      console.error("Failed to fetch user profile:", error); // Debug log
      dispatch({ type: "LOGIN_FAILURE" });
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    },
  });

  useEffect(() => {
    if (!state.token) {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.token]);

  // Set loading to false after a timeout if no token exists
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!state.token && state.isLoading) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }, 2000); // 2 second timeout

    return () => clearTimeout(timer);
  }, [state.token, state.isLoading]);

  const login = async (credentials) => {
    try {
      dispatch({ type: "LOGIN_START" });

      const response = await api.post("/api/auth/login", credentials);
      console.log("Login response:", response.data); // Debug log

      const { user, token } = response.data.data;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      toast.success("Login successful!");
      return { success: true };
    } catch (error) {
      console.error("Login error:", error); // Debug log
      dispatch({ type: "LOGIN_FAILURE" });
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw new Error(message); // Throw error so the component can catch it
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "LOGIN_START" });

      const response = await api.post("/api/auth/register", userData);
      console.log("Registration response:", response.data); // Debug log

      const { user, token } = response.data.data;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      toast.success(
        "Registration successful! Please check your email for verification."
      );
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error); // Debug log
      dispatch({ type: "LOGIN_FAILURE" });
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw new Error(message); // Throw error so the component can catch it
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      dispatch({ type: "LOGOUT" });
      queryClient.clear();
      toast.success("Logged out successfully");
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/api/auth/profile", profileData);
      const updatedUser = response.data.data.user;

      dispatch({
        type: "UPDATE_USER",
        payload: updatedUser,
      });

      toast.success("Profile updated successfully!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update profile";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await api.post("/api/auth/change-password", passwordData);
      toast.success("Password changed successfully!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to change password";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await api.post("/api/auth/forgot-password", { email });
      toast.success("Password reset email sent!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to send reset email";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await api.post("/api/auth/reset-password", { token, password });
      toast.success("Password reset successfully!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to reset password";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      await api.post(`/api/auth/verify-email/${token}`);
      toast.success("Email verified successfully!");
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to verify email";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post("/api/auth/refresh-token");
      const { token } = response.data.data;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { success: true, token };
    } catch (error) {
      logout();
      return { success: false };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
