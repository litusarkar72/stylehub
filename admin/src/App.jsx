
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useContext } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Queue from "./pages/Queue";
import Register from "./pages/Register";
import SalonDetails from "./pages/SalonDetails";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import SalonHistory from "./pages/SalonHistory";
import ContactMessages from "./pages/ContactMessages";

import AdminLayout from "./components/AdminLayout";
import { AdminContext } from "./context/AdminContext";

const ProtectedRoute = ({ children }) => {
  const { token } = useContext(AdminContext);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected admin pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/queue"
          element={
            <ProtectedRoute>
              <Queue />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salon-details"
          element={
            <ProtectedRoute>
              <SalonDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salon-history"
          element={
            <ProtectedRoute>
              <SalonHistory />
            </ProtectedRoute>
          }
        />

        {/* Contact Messages - Protected */}
        <Route
          path="/contact-messages"
          element={
            <ProtectedRoute>
              <ContactMessages />
            </ProtectedRoute>
          }
        />

        {/* Default routes */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
