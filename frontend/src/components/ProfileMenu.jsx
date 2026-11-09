
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Ticket,
  History,
  UserCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function ProfileMenu() {
  const { user, isAuthenticated, logout } = useAppContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-100"
      >
        <UserRound size={19} />
        Login
      </Link>
    );
  }

  const displayName = user?.name || "My Account";

  const menuItems = [
    {
      label: "My Queue",
      to: "/my-queue",
      icon: Ticket,
    },
    {
      label: "Queue History",
      to: "/queue-history",
      icon: History,
    },
    {
      label: "Profile Details",
      to: "/profile",
      icon: UserCircle,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white p-1.5 pr-3 hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
          <UserRound size={20} />
        </span>

        <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">
          {displayName}
        </span>

        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
        >
          <div className="border-b border-gray-100 px-4 py-4">
            <p className="truncate font-semibold text-gray-900">
              {displayName}
            </p>
            <p className="mt-1 truncate text-sm text-gray-500">
              {user?.email || "Customer account"}
            </p>
          </div>

          <div className="p-2">
            {menuItems.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Icon size={19} />
                {label}
              </Link>
            ))}

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
