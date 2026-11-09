
import { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";
import {
  Crown,
  Scissors,
  Clock,
  IndianRupee,
  ImagePlus,
  Upload,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Camera,
  Pencil,
  Trash2,
  Power,
  X,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";

const initialForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
};

const durationOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "75", label: "1 hour 15 minutes" },
  { value: "90", label: "1 hour 30 minutes" },
  { value: "105", label: "1 hour 45 minutes" },
  { value: "120", label: "2 hours" },
  { value: "150", label: "2 hours 30 minutes" },
  { value: "180", label: "3 hours" },
  { value: "240", label: "4 hours" },
];

const formatDuration = (minutes) => {
  const total = Number(minutes);

  if (!Number.isFinite(total) || total <= 0) {
    return "Not specified";
  }

  const hours = Math.floor(total / 60);
  const remaining = total % 60;

  if (!hours) return `${remaining} minutes`;
  if (!remaining) return `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remaining} minutes`;
};

export default function Services() {
  const { backendUrl, token } = useContext(AdminContext);

  const API = `${backendUrl}/api/services`;

  const [form, setForm] = useState(initialForm);
  const [services, setServices] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [statusId, setStatusId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // FETCH SERVICES
  const fetchServices = useCallback(async () => {
    if (!token) {
      setError("Please log in again. Token is missing.");
      setFetching(false);
      return;
    }

    try {
      const { data } = await axios.get(`${API}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (data.success) {
        setServices(data.services || []);
        setError("");
      }
    } catch (err) {
      console.error("Fetch services:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Failed to load services."
      );
    } finally {
      setFetching(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // IMAGE PREVIEW
  useEffect(() => {
    if (!imageFile) return;

    const url = URL.createObjectURL(imageFile);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // IMAGE VALIDATION
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    setError("");
    setMessage("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
  };

  // RESET FORM
  const resetForm = () => {
    setForm(initialForm);
    setImageFile(null);
    setPreview("");
    setEditingId(null);

    const input = document.getElementById("service-image");
    if (input) input.value = "";
  };

  // ADD / UPDATE SERVICE
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      !form.duration ||
      !Number.isFinite(Number(form.duration)) ||
      Number(form.duration) <= 0
    ) {
      setError("Please select a valid duration.");
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("price", form.price);
    formData.append("duration", form.duration);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    setLoading(true);

    try {
      let response;

      if (editingId) {
        // UPDATE EXISTING SERVICE
        response = await axios.put(
          `${API}/${editingId}`,
          formData,
          {
            headers,
            withCredentials: true,
          }
        );
      } else {
        // CREATE NEW SERVICE
        response = await axios.post(
          `${API}/add`,
          formData,
          {
            headers,
            withCredentials: true,
          }
        );
      }

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Operation failed."
        );
      }

      setMessage(
        response.data.message ||
          (editingId
            ? "Service updated successfully."
            : "Service added successfully.")
      );

      resetForm();
      await fetchServices();
    } catch (err) {
      console.error("Save service:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save service."
      );
    } finally {
      setLoading(false);
    }
  };

  // EDIT SERVICE
  const handleEdit = (service) => {
    setEditingId(service._id);

    setForm({
      name: service.name || "",
      description: service.description || "",
      price: String(service.price ?? ""),
      duration: String(service.duration ?? ""),
    });

    setImageFile(null);
    setPreview(service.image || "");

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE SERVICE
  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(service._id);
    setError("");
    setMessage("");

    try {
      const { data } = await axios.delete(
        `${API}/${service._id}`,
        {
          headers,
          withCredentials: true,
        }
      );

      if (!data.success) {
        throw new Error(data.message || "Delete failed.");
      }

      setServices((prev) =>
        prev.filter((item) => item._id !== service._id)
      );

      if (editingId === service._id) {
        resetForm();
      }

      setMessage(data.message || "Service deleted successfully.");
    } catch (err) {
      console.error("Delete service:", err.response?.data || err);

      setError(
        err.response?.data?.message || "Failed to delete service."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ACTIVATE / DEACTIVATE
  const handleToggleStatus = async (service) => {
    setStatusId(service._id);
    setError("");
    setMessage("");

    try {
      const newStatus = !service.isActive;

      const { data } = await axios.patch(
        `${API}/${service._id}/status`,
        {
          isActive: newStatus,
        },
        {
          headers,
          withCredentials: true,
        }
      );

      if (!data.success) {
        throw new Error(data.message || "Status update failed.");
      }

      setServices((prev) =>
        prev.map((item) =>
          item._id === service._id
            ? { ...item, isActive: newStatus }
            : item
        )
      );

      setMessage(data.message || "Service status updated.");
    } catch (err) {
      console.error("Status update:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          "Failed to update service status."
      );
    } finally {
      setStatusId(null);
    }
  };

  const handleRefresh = async () => {
    setFetching(true);
    await fetchServices();
  };

  const activeCount = services.filter(
    (service) => service.isActive
  ).length;

  const inactiveCount = services.length - activeCount;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b]/70 focus:ring-2 focus:ring-[#c6a15b]/10";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-300";

  return (
    <div className="min-h-screen bg-[#090909] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c6a15b]">
              <Crown size={16} />
              Salon Management
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Services Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Add, edit, delete and manage your salon services.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={fetching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-gray-300 transition hover:border-[#c6a15b]/40 hover:text-[#d5b46a] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={fetching ? "animate-spin" : ""}
            />
            Refresh Services
          </button>
        </div>

        {/* MESSAGES */}
        {message && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
          >
            <CheckCircle size={19} />
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Services",
              value: services.length,
              icon: Scissors,
              color: "text-[#d5b46a]",
            },
            {
              label: "Active Services",
              value: activeCount,
              icon: CheckCircle,
              color: "text-green-400",
            },
            {
              label: "Inactive Services",
              value: inactiveCount,
              icon: Clock,
              color: "text-red-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {item.label}
                  </p>
                  <h2 className={`mt-2 text-3xl font-bold ${item.color}`}>
                    {item.value}
                  </h2>
                </div>

                <item.icon size={25} className={item.color} />
              </div>
            </div>
          ))}
        </div>

        {/* ADD / EDIT FORM */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-white/[0.07] bg-[#141414] p-5 sm:p-7"
        >
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#c6a15b]/10 p-3">
                {editingId ? (
                  <Pencil size={22} className="text-[#d5b46a]" />
                ) : (
                  <Plus size={22} className="text-[#d5b46a]" />
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Edit Service" : "Add New Service"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {editingId
                    ? "Update your existing service details."
                    : "Add a service with its price, duration and image."}
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:text-white"
              >
                <X size={15} />
                Cancel
              </button>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            {/* NAME */}
            <div>
              <label className={labelClass}>
                Service Name *
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Premium Haircut"
                className={inputClass}
                required
              />
            </div>

            {/* PRICE */}
            <div>
              <label className={labelClass}>
                Price (₹) *
              </label>

              <div className="relative">
                <IndianRupee
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="300"
                  className={`${inputClass} pl-11`}
                  required
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Service Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe what customers can expect..."
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* DURATION */}
            <div>
              <label className={labelClass}>
                Service Duration *
              </label>

              <div className="relative">
                <Clock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none pl-11`}
                  required
                >
                  <option value="">Select duration</option>

                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* IMAGE */}
            <div>
              <label className={labelClass}>
                Service Image (Optional)
              </label>

              <label
                htmlFor="service-image"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#c6a15b]/30 bg-[#0d0d0d] px-4 py-3 transition hover:border-[#c6a15b]/70"
              >
                <Upload size={20} className="text-[#d5b46a]" />

                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-200">
                    {imageFile
                      ? imageFile.name
                      : "Choose service image"}
                  </p>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP · Max 5 MB
                  </p>
                </div>
              </label>

              <input
                id="service-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* IMAGE PREVIEW */}
          {preview && (
            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-sm text-gray-300">
                <Camera size={16} className="text-[#c6a15b]" />
                Image Preview
              </p>

              <div className="relative max-w-sm overflow-hidden rounded-xl border border-white/10">
                <img
                  src={preview}
                  alt="Service preview"
                  className="h-52 w-full object-cover"
                />
              </div>

              {editingId && !imageFile && (
                <p className="mt-2 text-xs text-gray-500">
                  Current image. Select a new image to replace it.
                </p>
              )}
            </div>
          )}

          {/* SUBMIT */}
          <div className="mt-7 flex flex-col justify-end gap-3 sm:flex-row">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b08a42] to-[#e1c47b] px-7 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                <>
                  <CheckCircle size={18} />
                  Update Service
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Service
                </>
              )}
            </button>
          </div>
        </form>

        {/* EXISTING SERVICES */}
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Existing Services
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage services registered under your salon.
              </p>
            </div>

            <span className="rounded-full border border-[#c6a15b]/20 bg-[#c6a15b]/10 px-3 py-1.5 text-xs font-semibold text-[#d5b46a]">
              {services.length} Services
            </span>
          </div>

          {fetching ? (
            <div className="flex min-h-48 items-center justify-center rounded-2xl bg-[#141414]">
              <RefreshCw className="animate-spin text-[#c6a15b]" />
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#141414] px-5 py-16 text-center">
              <Scissors
                size={32}
                className="mx-auto mb-4 text-[#c6a15b]"
              />

              <h3 className="text-lg font-semibold">
                No Services Found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add your first salon service using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service._id}
                  className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141414] transition hover:border-[#c6a15b]/30"
                >
                  {/* IMAGE */}
                  <div className="relative h-52 overflow-hidden bg-[#0d0d0d]">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-gray-600">
                        <ImagePlus size={32} />
                        <p className="mt-2 text-xs">
                          No image uploaded
                        </p>
                      </div>
                    )}

                    <span
                      className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        service.isActive
                          ? "border-green-400/20 bg-green-500/10 text-green-400"
                          : "border-red-400/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {service.isActive ? "Active" : "Inactive"}
                    </span>

                    <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 px-3 py-2">
                      <p className="flex items-center gap-1 font-bold text-[#e1c47b]">
                        <IndianRupee size={15} />
                        {service.price}
                      </p>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-gray-100">
                        {service.name}
                      </h3>

                      <Sparkles
                        size={17}
                        className="mt-1 shrink-0 text-[#c6a15b]"
                      />
                    </div>

                    <p className="min-h-10 break-words text-sm leading-6 text-gray-500">
                      {service.description ||
                        "No description available."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          Duration
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-300">
                          <Clock size={15} className="text-[#c6a15b]" />
                          {formatDuration(service.duration)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          Price
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#d5b46a]">
                          ₹{service.price}
                        </p>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.07] pt-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-3 py-2.5 text-sm text-[#d5b46a] transition hover:bg-[#c6a15b]/20"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(service)}
                        disabled={deletingId === service._id}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {deletingId === service._id ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        disabled={statusId === service._id}
                        className={`col-span-2 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition disabled:opacity-50 ${
                          service.isActive
                            ? "border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                            : "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        }`}
                      >
                        {statusId === service._id ? (
                          <RefreshCw size={15} className="animate-spin" />
                        ) : (
                          <Power size={15} />
                        )}

                        {service.isActive
                          ? "Deactivate Service"
                          : "Activate Service"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
