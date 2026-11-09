
import { Link } from "react-router-dom";
import { Scissors, Mail, Phone, ArrowUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <Scissors size={26} className="text-amber-400" />
            <span className="text-2xl font-bold">StyleHub</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-7 text-gray-400">
            A convenient way to explore salon services and manage
            your queue online.
          </p>
        </div>

        <div>
          <h3 className="font-bold">Quick Links</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
            <Link className="hover:text-amber-400" to="/">Home</Link>
            <Link className="hover:text-amber-400" to="/services">Services</Link>
            <Link className="hover:text-amber-400" to="/about">About Us</Link>
            <Link className="hover:text-amber-400" to="/gallery">Gallery</Link>
            <Link className="hover:text-amber-400" to="/contact">Contact</Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Customer Account</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">
            <Link className="hover:text-amber-400" to="/login">Login</Link>
            <Link className="hover:text-amber-400" to="/register">Register</Link>
            <Link className="hover:text-amber-400" to="/my-queue">My Queue</Link>
            <Link className="hover:text-amber-400" to="/queue-history">Queue History</Link>
            <Link className="hover:text-amber-400" to="/profile">My Profile</Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Get in Touch</h3>
          <div className="mt-4 space-y-4 text-sm text-gray-400">
            <a href="mailto:support@stylehub.com" className="flex items-center gap-3 hover:text-amber-400">
              <Mail size={18} />
              support@stylehub.com
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-3 hover:text-amber-400">
              <Phone size={18} />
              +91 98765 43210
            </a>
            <a href="#home" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300">
              Back to top <ArrowUp size={16} />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-5 text-sm text-gray-500 sm:px-8 md:flex-row">
          <p>© {new Date().getFullYear()} StyleHub. All rights reserved.</p>
          <p>Designed for a better salon experience.</p>
        </div>
      </div>
    </footer>
  );
}
