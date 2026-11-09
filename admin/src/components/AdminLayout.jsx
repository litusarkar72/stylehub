
import { useState } from "react";
import { Menu, Crown } from "lucide-react";
import Sidebar from "./Sidebar";

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090909] text-white">

      {/* SIDEBAR */}
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      {/* MAIN CONTENT */}
      <div className="min-h-screen md:ml-64">

        {/* MOBILE NAVBAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.07] bg-[#111111]/95 px-4 py-3 backdrop-blur-xl md:hidden">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c6a15b]/30 bg-[#c6a15b]/10">
              <Crown size={21} className="text-[#d5b46a]" />
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">
                Salon Admin
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#c6a15b]">
                Management Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-xl border border-white/10 bg-[#1a1a1a] p-2.5 text-gray-300 transition hover:border-[#c6a15b]/40 hover:text-[#d5b46a]"
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-64px)] bg-[#090909] p-4 sm:p-6 lg:p-8 md:min-h-screen">
          {children}
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
