
import { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  Scissors,
  Menu,
  X,
  Ticket,
  History,
  UserRound,
  UserCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  Home,
  Settings,
} from "lucide-react";

import { useAppContext } from "../context/AppContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    user,
    isAuthenticated,
    logout,
    refreshUser,
  } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();

  // Refresh profile when authenticated user opens the app.
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser().catch((error) => {
        console.error("Unable to refresh profile:", error);
      });
    }
  }, [isAuthenticated]);

  // Reset image error when profile image changes.
  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  // Close dropdowns when route changes.
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const closeMenu = () => {
    setMenuOpen(false);
    setProfileOpen(false);
  };

  // LOGOUT
  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login", { replace: true });
  };

  // PROFILE AVATAR
  const ProfileAvatar = ({
    size = "h-10 w-10",
    iconSize = 20,
  }) => {
    return (
      <div
        className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-200 bg-gray-950 text-amber-400`}
      >
        {user?.profileImage && !imageError ? (
          <img
            src={user.profileImage}
            alt="Customer profile"
            className="h-full w-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <UserRound size={iconSize} />
        )}
      </div>
    );
  };

  // MAIN NAVIGATION LINKS
  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Services", to: "/services" },
    { label: "About", to: "/about" },
    { label: "Gallery", to: "/gallery" },
    { label: "Contact", to: "/contact" },
  ];

  // PROFILE MENU LINKS
  const profileItems = [
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

  // NAVIGATION STYLE
  const navLinkClass = ({ isActive }) =>
    `relative py-2 text-sm font-medium transition-all duration-300
    after:absolute after:bottom-0 after:left-0 after:h-[2px]
    after:bg-amber-600 after:transition-all after:duration-300
    ${
      isActive
        ? "text-amber-700 after:w-full"
        : "text-gray-600 after:w-0 hover:text-black hover:after:w-full"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">

      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">

        {/* LOGO */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex items-center gap-2.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-amber-400 transition duration-300 group-hover:rotate-[-8deg] group-hover:bg-amber-600 group-hover:text-white">
            <Scissors size={25} strokeWidth={2} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              Style<span className="text-amber-600">Hub</span>
            </h1>

            <p className="text-[9px] font-semibold uppercase tracking-[3px] text-gray-400">
              Beauty & Style
            </p>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden items-center gap-4 lg:flex">

          {isAuthenticated ? (
            <div className="relative">

              {/* PROFILE BUTTON */}
              <button
                type="button"
                onClick={() =>
                  setProfileOpen((previous) => !previous)
                }
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <ProfileAvatar
                  size="h-11 w-11"
                  iconSize={21}
                />

                <span className="max-w-28 truncate text-sm font-semibold text-gray-800">
                  {user?.name || "My Account"}
                </span>

                <ChevronDown
                  size={15}
                  className={`text-gray-500 transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* PROFILE DROPDOWN */}
              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
                  >

                    {/* CUSTOMER INFORMATION */}
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4">
                      <ProfileAvatar
                        size="h-12 w-12"
                        iconSize={22}
                      />

                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">
                          {user?.name || "My Account"}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {user?.email || "Customer account"}
                        </p>
                      </div>
                    </div>

                    {/* PROFILE LINKS */}
                    <div className="p-2">
                      {profileItems.map(
                        ({ label, to, icon: Icon }) => (
                          <NavLink
                            key={to}
                            to={to}
                            role="menuitem"
                            onClick={closeMenu}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                                isActive
                                  ? "bg-amber-50 font-semibold text-amber-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`
                            }
                          >
                            <Icon size={18} />
                            {label}
                          </NavLink>
                        )
                      )}

                      <div className="my-2 border-t border-gray-100" />

                      {/* LOGOUT */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-sm font-semibold text-gray-700 transition hover:text-amber-700"
              >
                Login
              </NavLink>

              <Link
                to="/register"
                className="flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-lg"
              >
                <Sparkles size={15} />
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="rounded-xl border border-gray-200 p-2.5 text-gray-800 transition hover:bg-amber-50 lg:hidden"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {/* MOBILE NAVIGATION */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 pb-6 pt-4 shadow-lg lg:hidden">

          {/* MAIN LINKS */}
          <div className="space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-amber-50 text-amber-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="my-4 border-t border-gray-100" />

          {isAuthenticated ? (
            <>
              {/* MOBILE CUSTOMER INFORMATION */}
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <ProfileAvatar
                  size="h-12 w-12"
                  iconSize={22}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {user?.name || "My Account"}
                  </p>

                  <p className="truncate text-xs text-gray-500">
                    {user?.email || "Customer account"}
                  </p>
                </div>
              </div>

              {/* MOBILE PROFILE LINKS */}
              <div className="space-y-1">
                {profileItems.map(
                  ({ label, to, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                          isActive
                            ? "bg-amber-50 font-semibold text-amber-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`
                      }
                    >
                      <Icon size={18} />
                      {label}
                    </NavLink>
                  )
                )}
              </div>

              {/* MOBILE LOGOUT */}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="flex-1 rounded-xl bg-black py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
