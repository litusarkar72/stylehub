
import {
  createContext,
  useContext,
  useState,
} from "react";
import axios from "axios";

const AppContext = createContext(null);

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export function AppProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("customerToken") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("customerUser")
      ) || null;
    } catch {
      return null;
    }
  });

  // Extract user from different possible API response structures.
  const extractUser = (data) =>
    data?.user ||
    data?.customer ||
    data?.data?.user ||
    data?.data?.customer ||
    null;

  // Store the latest user in React state and localStorage.
  const updateUser = (updatedUser) => {
    if (!updatedUser) return;

    setUser(updatedUser);

    localStorage.setItem(
      "customerUser",
      JSON.stringify(updatedUser)
    );
  };

  // Fetch the latest profile from MongoDB.
  const refreshUser = async (authToken = token) => {
    if (!authToken) {
      throw new Error("Please login again.");
    }

    const response = await axios.get(
      `${API}/api/user/profile`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        withCredentials: true,
      }
    );

    const latestUser = extractUser(response.data);

    if (!latestUser) {
      throw new Error("Unable to retrieve customer profile.");
    }

    updateUser(latestUser);

    return latestUser;
  };

  // Save token and restore the latest profile.
  const saveSession = async (data) => {
    const receivedToken =
      data?.token ||
      data?.accessToken ||
      data?.data?.token;

    if (!receivedToken) {
      throw new Error(
        "No authentication token was returned by the backend."
      );
    }

    localStorage.setItem("customerToken", receivedToken);
    setToken(receivedToken);

    // Always fetch the latest profile from the database.
    const latestUser = await refreshUser(receivedToken);

    return latestUser;
  };

  // CUSTOMER LOGIN
  const login = async (credentials) => {
    try {
      const response = await axios.post(
        `${API}/api/auth/login`,
        credentials,
        { withCredentials: true }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Login failed."
        );
      }

      await saveSession(response.data);

      return response.data;
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // CUSTOMER REGISTRATION
  const register = async (details) => {
    try {
      const response = await axios.post(
        `${API}/api/auth/register`,
        {
          name: details.name?.trim(),
          email: details.email?.trim().toLowerCase(),
          password: details.password,
          confirmPassword: details.confirmPassword,
          phone: details.phone || "",
        },
        { withCredentials: true }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Registration failed."
        );
      }

      const receivedToken =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.data?.token;

      if (receivedToken) {
        await saveSession(response.data);
      }

      return response.data;
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      throw error;
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");

    setToken("");
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    backendUrl: API,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppProvider"
    );
  }

  return context;
}
