
import { io } from "socket.io-client";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const socket = io(API, {
  autoConnect: false,
  withCredentials: true,
});
