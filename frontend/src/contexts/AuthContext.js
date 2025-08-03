import React, { createContext, useContext, useReducer, useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import api from "../services/api";

const AuthContext = createContext();

const initialState = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
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
    enabled: false, // Disabled automatic profile fetch to prevent rate limiting
    retry: 0, // No retries
    retryDelay: 1000,
    onSuccess: (response) => {
      // Handle different response structures
      let userData = null;
      if (response.data?.data?.user) {
        userData = response.data.data.user;
      } else if (
        response.data?.data &&
        typeof response.data.data === "object" &&
        response.data.data.id
      ) {
        // If the response is the user object directly
        userData = response.data.data;
      } else if (response.data?.user) {
        // If user is at the top level
        userData = response.data.user;
      } else {
        console.error(
          "User profile fetched - Unexpected response structure:",
          response
        );
        // Set loading to false even if profile fetch fails
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Store updated user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: userData, token: state.token },
      });
    },
    onError: (error) => {
      console.error("Failed to fetch user profile:", error);

      // Set loading to false when profile fetch fails
      dispatch({ type: "SET_LOADING", payload: false });

      // Only logout on 401 errors, not on network or other errors
      if (error.response?.status === 401) {
        console.log("Profile fetch failed with 401, logging out user");
        dispatch({ type: "LOGIN_FAILURE" });
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
      } else {
        // For other errors (network, server down, etc.), keep the user logged in
        console.warn(
          "Profile fetch failed, but keeping user logged in with token"
        );

        // Try to restore user data from localStorage as fallback
        const storedUser = localStorage.getItem("user");
        if (storedUser && state.token) {
          try {
            const userData = JSON.parse(storedUser);
            console.log("Restoring user data from localStorage:", userData);
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: { user: userData, token: state.token },
            });
          } catch (parseError) {
            console.error("Failed to parse stored user data:", parseError);
            // Keep the current state but ensure loading is false
            dispatch({ type: "SET_LOADING", payload: false });
          }
        } else {
          // Keep the current state but ensure loading is false
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    },
  });

  useEffect(() => {
    if (!state.token) {
      dispatch({ type: "SET_LOADING", payload: false });
    } else {
      // If token exists, restore user from localStorage and set loading to false
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: userData, token: state.token },
          });
        } catch (parseError) {
          console.error("Failed to parse stored user data:", parseError);
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, [state.token]);

  const login = async (credentials) => {
    try {
      dispatch({ type: "LOGIN_START" });

      const response = await api.post("/api/auth/login", credentials);
      console.log("Login response:", response.data); // Debug log

      const { user, token } = response.data.data;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Create a fallback user object in case profile fetch fails
      const fallbackUser = {
        id: user.id || "temp-id",
        name: user.name || credentials.email?.split("@")[0] || "User",
        email: user.email || credentials.email,
        role: user.role || "user",
        tier: user.tier || "free",
        isEmailVerified: user.isEmailVerified || false,
        isActive: user.isActive || true,
        storageUsed: user.storageUsed || 0,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
      };

      // Store user data in localStorage as fallback
      localStorage.setItem("user", JSON.stringify(fallbackUser));

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: fallbackUser, token },
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
      localStorage.removeItem("user");
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

  const refreshProfile = async () => {
    try {
      const response = await api.get("/api/auth/profile");

      // Handle different response structures
      let userData = null;
      if (response.data?.data?.user) {
        userData = response.data.data.user;
      } else if (
        response.data?.data &&
        typeof response.data.data === "object" &&
        response.data.data.id
      ) {
        userData = response.data.data;
      } else if (response.data?.user) {
        userData = response.data.user;
      } else {
        throw new Error("Unexpected response structure");
      }

      // Store updated user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      dispatch({
        type: "UPDATE_USER",
        payload: userData,
      });

      toast.success("Profile refreshed successfully!");
      return { success: true, user: userData };
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      toast.error("Failed to refresh profile. Please try again.");
      return { success: false, error: error.message };
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
    refreshProfile, // Add manual profile refresh
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
