
import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";

import {
  LayoutDashboard,
  Users,
  Store,
  Scissors,
  Images,
  History,
  MessageSquare,
  LogOut,
  X,
  Crown,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { AdminContext } from "../context/AdminContext";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout } = useContext(AdminContext);
  const navigate = useNavigate();

  // Sidebar menu items
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Queue Management",
      path: "/queue",
      icon: Users,
    },
    {
      name: "Salon Details",
      path: "/salon-details",
      icon: Store,
    },
    {
      name: "Services",
      path: "/services",
      icon: Scissors,
    },
    {
      name: "Gallery Management",
      path: "/gallery",
      icon: Images,
    },
    {
      name: "Salon History",
      path: "/salon-history",
      icon: History,
    },
    {
      name: "Contact Messages",
      path: "/contact-messages",
      icon: MessageSquare,
    },
  ];

  // Close sidebar on mobile after navigation
  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }

      setIsOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-64 flex-col
          border-r border-white/[0.07]
          bg-[#111111] text-white
          shadow-2xl shadow-black/30
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Brand header */}
        <div className="border-b border-white/[0.07] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c6a15b]/30 bg-[#c6a15b]/10">
                <Crown
                  size={23}
                  className="text-[#d5b46a]"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-wide">
                  Salon Admin
                </h2>

                <div className="mt-1 flex items-center gap-1.5">
                  <Sparkles
                    size={11}
                    className="text-[#c6a15b]"
                  />

                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c6a15b]">
                    Management Portal
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white md:hidden"
              aria-label="Close sidebar"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
          <p className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleMenuClick}
                className={({ isActive }) => `
                  group relative flex items-center gap-3
                  rounded-xl px-4 py-3.5
                  text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "border border-[#c6a15b]/20 bg-[#c6a15b]/10 text-[#e1c47b]"
                      : "border border-transparent text-gray-400 hover:bg-white/[0.04] hover:text-white"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-[#d5b46a]" />
                    )}

                    <Icon
                      size={19}
                      className={`
                        shrink-0 transition-colors
                        ${
                          isActive
                            ? "text-[#d5b46a]"
                            : "text-gray-500 group-hover:text-[#c6a15b]"
                        }
                      `}
                    />

                    <span className="flex-1">
                      {item.name}
                    </span>

                    {isActive && (
                      <ChevronRight
                        size={16}
                        className="text-[#c6a15b]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom brand card */}
        <div className="mx-4 mb-4 rounded-xl border border-[#c6a15b]/15 bg-[#c6a15b]/5 p-4">
          <div className="flex items-center gap-2">
            <Sparkles
              size={16}
              className="text-[#c6a15b]"
            />

            <p className="text-xs font-semibold text-[#d5b46a]">
              Premium Experience
            </p>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
            Manage your salon, services, customers, and daily operations.
          </p>
        </div>

        {/* Logout */}
        <div className="border-t border-white/[0.07] p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="
              group flex w-full items-center gap-3
              rounded-xl border border-transparent
              px-4 py-3.5
              text-sm font-medium text-gray-400
              transition-all duration-200
              hover:border-red-500/20
              hover:bg-red-500/10
              hover:text-red-400
            "
          >
            <LogOut
              size={19}
              className="transition-transform group-hover:-translate-x-1"
            />

            <span>Logout</span>
          </button>

          <p className="mt-3 text-center text-[10px] text-gray-700">
            Salon Management Portal
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
