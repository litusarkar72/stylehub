
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  MessageSquare,
  RefreshCw,
  Search,
  Eye,
  X,
  Mail,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  ArrowUpRight,
} from "lucide-react";

import { AdminContext } from "../context/AdminContext";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const ContactMessages = () => {
  const { token } = useContext(AdminContext);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);

  // =====================================
  // AUTHORIZATION HEADERS
  // =====================================

  const getHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      token: token,
    }),
    [token]
  );

  // =====================================
  // FETCH CUSTOMER MESSAGES
  // =====================================

  const fetchMessages = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setError(
          "Admin authentication token is missing. Please log in again."
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await axios.get(
          `${API}/api/contact/admin/messages`,
          {
            headers: getHeaders(),
            withCredentials: true,
          }
        );

        const data = response.data;

        setMessages(
          Array.isArray(data)
            ? data
            : data.messages || data.contacts || []
        );
      } catch (err) {
        console.error("Contact messages error:", err);

        if (err.response?.status === 401) {
          setError(
            "Your admin session is invalid or expired. Please log in again."
          );
        } else if (err.response?.status === 403) {
          setError(
            "You do not have permission to view contact messages."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load customer messages. Please try again."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, getHeaders]
  );

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    if (token) {
      fetchMessages();
    } else {
      setLoading(false);
      setError(
        "Admin authentication token is missing. Please log in again."
      );
    }
  }, [token, fetchMessages]);

  // =====================================
  // MARK MESSAGE AS READ
  // =====================================

  const markAsRead = async (message) => {
    if (!token) {
      setError("Please log in again to update this message.");
      return;
    }

    try {
      await axios.patch(
        `${API}/api/contact/admin/messages/${message._id}`,
        { status: "read" },
        {
          headers: getHeaders(),
          withCredentials: true,
        }
      );

      setMessages((previous) =>
        previous.map((item) =>
          item._id === message._id
            ? { ...item, status: "read" }
            : item
        )
      );

      setSelectedMessage((previous) =>
        previous?._id === message._id
          ? { ...previous, status: "read" }
          : previous
      );
    } catch (err) {
      console.error("Update message status error:", err);

      alert(
        err.response?.data?.message ||
          "Unable to update message status."
      );
    }
  };

  // =====================================
  // OPEN MESSAGE
  // =====================================

  const openMessage = (message) => {
    setSelectedMessage(message);

    if (message.status === "unread") {
      markAsRead(message);
    }
  };

  // =====================================
  // MESSAGE STATISTICS
  // =====================================

  const unreadCount = messages.filter(
    (item) => item.status === "unread"
  ).length;

  const readCount = messages.filter(
    (item) => item.status === "read"
  ).length;

  const repliedCount = messages.filter(
    (item) => item.status === "replied"
  ).length;

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        message.name?.toLowerCase().includes(searchText) ||
        message.email?.toLowerCase().includes(searchText) ||
        message.subject?.toLowerCase().includes(searchText) ||
        message.message?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        message.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [messages, search, statusFilter]);

  // =====================================
  // DATE FORMATTING
  // =====================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================
  // STATUS STYLING
  // =====================================

  const statusStyle = (status) => {
    switch (status) {
      case "unread":
        return "border-[#c6a15b]/30 bg-[#c6a15b]/10 text-[#e2c27e]";

      case "read":
        return "border-blue-400/30 bg-blue-400/10 text-blue-400";

      case "replied":
        return "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";

      default:
        return "border-white/10 bg-white/5 text-gray-400";
    }
  };

  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/20 bg-[#c6a15b]/10">
            <RefreshCw
              size={30}
              className="animate-spin text-[#d5b46a]"
            />
          </div>

          <p className="mt-4 text-sm font-medium text-gray-300">
            Loading customer messages...
          </p>

          <p className="mt-1 text-xs text-gray-600">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <div className="min-h-screen bg-[#090909] p-4 text-white md:p-7 lg:p-9">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-[#c6a15b]/20 bg-[#141414] p-6 shadow-2xl shadow-black/30 md:p-8">

          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-[#c6a15b]/10" />

          <div className="pointer-events-none absolute -bottom-20 right-40 h-52 w-52 rounded-full bg-[#c6a15b]/10 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">

            <div>
              <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#e2c27e]">
                <MessageSquare size={15} />
                Customer Support
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Contact Messages
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-400">
                Manage customer enquiries and keep track of every message.
              </p>
            </div>

            <button
              onClick={() => fetchMessages(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-[#c6a15b]/40 bg-[#c6a15b] px-5 py-3 text-sm font-bold text-black shadow-lg transition hover:bg-[#e2c27e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh Inbox"}
            </button>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <AlertCircle size={21} />

            <p className="flex-1 text-sm">{error}</p>

            <button
              onClick={() => {
                if (error.includes("log in again")) {
                  window.location.href = "/login";
                } else {
                  fetchMessages();
                }
              }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold transition hover:bg-red-500/20"
            >
              {error.includes("log in again") ? "Login" : "Retry"}
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Total Messages",
              value: messages.length,
              icon: Inbox,
            },
            {
              title: "Unread Messages",
              value: unreadCount,
              icon: Mail,
            },
            {
              title: "Read Messages",
              value: readCount,
              icon: Eye,
            },
            {
              title: "Replied Messages",
              value: repliedCount,
              icon: CheckCircle,
            },
          ].map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="group rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-[#c6a15b]/40"
              >
                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#c6a15b]/20 bg-[#c6a15b]/10">
                    <Icon size={22} className="text-[#d5b46a]" />
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-[#c6a15b] opacity-50 transition group-hover:opacity-100"
                  />
                </div>

                <p className="mt-5 text-sm text-gray-400">
                  {card.title}
                </p>

                <h2 className="mt-1 text-3xl font-bold text-white">
                  {card.value}
                </h2>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-1/3 rounded-full bg-[#c6a15b]" />
                </div>
              </div>
            );
          })}

        </div>

        {/* INBOX */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl shadow-black/20">

          {/* INBOX TOOLBAR */}

          <div className="border-b border-white/10 p-5 md:p-6">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="text-lg font-bold text-white">
                  Customer Inbox
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Review and manage incoming customer enquiries.
                </p>
              </div>

              <span className="rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2 text-xs font-semibold text-[#e2c27e]">
                {filteredMessages.length} Messages
              </span>

            </div>

            {/* SEARCH AND FILTER */}

            <div className="flex flex-col gap-3 md:flex-row">

              <div className="relative flex-1">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, email, subject..."
                  className="w-full rounded-xl border border-white/10 bg-[#090909] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-gray-300 outline-none focus:border-[#c6a15b]"
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>

            </div>
          </div>

          {/* MESSAGES */}

          {filteredMessages.length === 0 ? (
            <div className="px-5 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/20 bg-[#c6a15b]/10 text-[#d5b46a]">
                <MessageSquare size={30} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                No Messages Found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Customer messages will appear here when submitted.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px] text-left">

                <thead className="bg-[#1b1b1b] text-[11px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Customer
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Subject
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Date
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">

                  {filteredMessages.map((message) => (
                    <tr
                      key={message._id}
                      className={`transition hover:bg-white/[0.03] ${
                        message.status === "unread"
                          ? "bg-[#c6a15b]/[0.035]"
                          : ""
                      }`}
                    >

                      {/* CUSTOMER */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 font-bold uppercase text-[#e2c27e]">
                            {message.name?.charAt(0) || "C"}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              {message.name || "Unknown"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {message.email || "No email"}
                            </p>
                          </div>

                        </div>
                      </td>

                      {/* SUBJECT */}

                      <td className="px-6 py-5">
                        <p className="max-w-[200px] truncate text-sm font-medium text-gray-200">
                          {message.subject || "No subject"}
                        </p>

                        <p className="mt-1 max-w-[200px] truncate text-xs text-gray-500">
                          {message.message}
                        </p>
                      </td>

                      {/* DATE */}

                      <td className="px-6 py-5 text-sm text-gray-400">
                        {formatDate(message.createdAt)}
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle(
                            message.status
                          )}`}
                        >
                          {message.status === "unread" ? (
                            <Clock size={12} />
                          ) : (
                            <CheckCircle size={12} />
                          )}

                          {message.status || "unread"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => openMessage(message)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2.5 text-xs font-semibold text-[#e2c27e] transition hover:bg-[#c6a15b] hover:text-black"
                        >
                          <Eye size={15} />
                          View Message
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* MESSAGE DETAILS MODAL */}

        {selectedMessage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedMessage(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#c6a15b]/30 bg-[#141414] shadow-2xl shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >

              {/* MODAL HEADER */}

              <div className="relative flex items-center justify-between overflow-hidden border-b border-[#c6a15b]/20 bg-[#090909] p-6 text-white">

                <div className="absolute -right-10 -top-20 h-40 w-40 rounded-full border-[20px] border-[#c6a15b]/10" />

                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#d5b46a]">
                    <MessageSquare size={15} />
                    Customer Support
                  </div>

                  <h2 className="text-xl font-bold">
                    Message Details
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Review customer enquiry
                  </p>
                </div>

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="relative z-10 rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:border-[#c6a15b]/40 hover:text-[#d5b46a]"
                  aria-label="Close message"
                >
                  <X size={21} />
                </button>

              </div>

              {/* MODAL CONTENT */}

              <div className="space-y-5 p-6">

                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="rounded-xl border border-white/10 bg-[#090909] p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c6a15b]">
                      <User size={15} />
                      Customer
                    </div>

                    <p className="font-semibold text-white">
                      {selectedMessage.name}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#090909] p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c6a15b]">
                      <Mail size={15} />
                      Email
                    </div>

                    <p className="break-all font-semibold text-gray-200">
                      {selectedMessage.email}
                    </p>
                  </div>

                </div>

                {/* SUBJECT */}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#c6a15b]">
                    Subject
                  </p>

                  <div className="rounded-xl border border-white/10 bg-[#090909] p-4 font-semibold text-white">
                    {selectedMessage.subject}
                  </div>
                </div>

                {/* MESSAGE */}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#c6a15b]">
                    Customer Message
                  </p>

                  <div className="min-h-[140px] whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#090909] p-5 text-sm leading-7 text-gray-300">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* FOOTER */}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={16} className="text-[#c6a15b]" />
                    {formatDate(selectedMessage.createdAt)}
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {selectedMessage.status === "unread" && (
                      <button
                        onClick={() => markAsRead(selectedMessage)}
                        className="flex items-center gap-2 rounded-lg bg-[#c6a15b] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#e2c27e]"
                      >
                        <CheckCircle size={16} />
                        Mark as Read
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-[#c6a15b]/40 hover:text-[#d5b46a]"
                    >
                      Close
                    </button>

                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 py-5 text-xs text-gray-500 sm:flex-row">
          <p>SalonPro Premium Management</p>

          <p className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
            Customer Support Inbox
          </p>
        </div>

      </div>
    </div>
  );
};

export default ContactMessages;
