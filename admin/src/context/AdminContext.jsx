import { createContext, useContext, useState } from "react";

export const AdminContext = createContext(null);

const AdminContextProvider = ({ children }) => {
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  const [token, setToken] = useState(
    () => localStorage.getItem("adminToken") || ""
  );

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin")) || null;
    } catch {
      return null;
    }
  });

  const login = (receivedToken, user) => {
    localStorage.setItem("adminToken", receivedToken);
    localStorage.setItem("admin", JSON.stringify(user));

    setToken(receivedToken);
    setAdmin(user);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    setToken("");
    setAdmin(null);
  };

  return (
    <AdminContext.Provider
      value={{ backendUrl, token, admin, login, logout }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error(
      "useAdminContext must be used inside AdminContextProvider"
    );
  }

  return context;
};

export default AdminContextProvider;