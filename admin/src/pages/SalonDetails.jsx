
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Crown,
  Store,
  MapPin,
  Phone,
  Clock,
  ImagePlus,
  Save,
  RefreshCw,
  Upload,
  CheckCircle,
  FileText,
  Camera,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";

const initialForm = {
  name: "",
  description: "",
  address: "",
  city: "",
  phone: "",
  openingTime: "09:00",
  closingTime: "21:00",
};

const SalonDetails = () => {
  const { backendUrl, token } = useContext(AdminContext);

  const [form, setForm] = useState(initialForm);
  const [salon, setSalon] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // FETCH SALON DETAILS
  // =========================
  useEffect(() => {
    let cancelled = false;

    const fetchSalon = async () => {
      if (!token) {
        setError("Please log in as an admin first.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${backendUrl}/api/salons/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (cancelled) return;

        if (data.success && data.salon) {
          setSalon(data.salon);

          setForm({
            name: data.salon.name || "",
            description: data.salon.description || "",
            address: data.salon.address || "",
            city: data.salon.city || "",
            phone: data.salon.phone || "",
            openingTime: data.salon.openingTime || "09:00",
            closingTime: data.salon.closingTime || "21:00",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load salon details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSalon();

    return () => {
      cancelled = true;
    };
  }, [backendUrl, token]);

  // =========================
  // IMAGE PREVIEW
  // =========================
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // =========================
  // IMAGE CHANGE
  // =========================
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      e.target.value = "";
      return;
    }

    setError("");
    setMessage("");
    setImageFile(file);
  };

  // =========================
  // SAVE SALON DETAILS
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Salon name and phone number are required.");
      return;
    }

    if (form.openingTime >= form.closingTime) {
      setError("Closing time must be later than opening time.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${backendUrl}/api/salons/my`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data.success || !data.salon) {
        throw new Error(
          data.message || "Unable to save salon details."
        );
      }

      setSalon(data.salon);
      setImageFile(null);

      setForm({
        name: data.salon.name || "",
        description: data.salon.description || "",
        address: data.salon.address || "",
        city: data.salon.city || "",
        phone: data.salon.phone || "",
        openingTime: data.salon.openingTime || "09:00",
        closingTime: data.salon.closingTime || "21:00",
      });

      setMessage("Salon details saved successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save salon details."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b]/70 focus:ring-2 focus:ring-[#c6a15b]/10";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-300";

  const displayedImage =
    imagePreview || salon?.image || "";

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
        <div className="text-center">
          <RefreshCw
            size={30}
            className="mx-auto mb-4 animate-spin text-[#c6a15b]"
          />
          <p className="text-sm text-gray-400">
            Loading salon details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] p-4 text-white sm:p-6 lg:p-8">

      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c6a15b]">
            <Crown size={16} />
            Salon Management
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Salon Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage your salon information, contact details, and cover image.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
          >
            <CheckCircle size={19} />
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* BASIC INFORMATION */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3 border-b border-white/[0.07] pb-5">
              <div className="rounded-xl bg-[#c6a15b]/10 p-3">
                <Store size={22} className="text-[#d5b46a]" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Basic Information
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Your salon's identity and contact information
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className={labelClass}>
                  Salon Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Royal Hair Studio"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Phone Number *
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                  />

                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className={`${inputClass} pl-11`}
                    placeholder="Enter contact number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  City *
                </label>

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Full Address *
                </label>

                <div className="relative">
                  <MapPin
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                  />

                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`${inputClass} pl-11`}
                    placeholder="Enter salon address"
                    required
                  />
                </div>
              </div>

            </div>

            <div className="mt-5">
              <label className={labelClass}>
                Salon Description
              </label>

              <div className="relative">
                <FileText
                  size={17}
                  className="absolute left-4 top-4 text-[#c6a15b]"
                />

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={`${inputClass} min-h-[120px] resize-y pl-11`}
                  placeholder="Tell customers about your salon, experience, and services..."
                  rows={4}
                />
              </div>
            </div>

          </section>

          {/* SALON COVER IMAGE */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3 border-b border-white/[0.07] pb-5">
              <div className="rounded-xl bg-[#c6a15b]/10 p-3">
                <ImagePlus size={22} className="text-[#d5b46a]" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Salon Cover Image
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Upload a professional image of your salon
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              <div>
                <label className={labelClass}>
                  Choose Image
                </label>

                <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c6a15b]/30 bg-[#0d0d0d] p-6 text-center transition hover:border-[#c6a15b]/70 hover:bg-[#c6a15b]/[0.03]">
                  <div className="mb-4 rounded-xl bg-[#c6a15b]/10 p-4">
                    <Upload size={27} className="text-[#d5b46a]" />
                  </div>

                  <p className="font-semibold text-gray-200">
                    Click to upload image
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG or WebP · Maximum 5 MB
                  </p>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imageFile && (
                  <p className="mt-3 text-sm text-[#d5b46a]">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Image Preview
                </label>

                {displayedImage ? (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
                    <img
                      src={displayedImage}
                      alt="Salon cover preview"
                      className="h-48 w-full object-cover"
                    />

                    <div className="flex items-center gap-2 p-3 text-xs text-gray-400">
                      <Camera size={15} className="text-[#c6a15b]" />
                      {imageFile
                        ? "New image preview — save to upload"
                        : "Current salon cover image"}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#0d0d0d] text-gray-600">
                    <ImagePlus size={32} />
                    <p className="mt-3 text-sm">
                      No image uploaded yet
                    </p>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* BUSINESS HOURS */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3 border-b border-white/[0.07] pb-5">
              <div className="rounded-xl bg-[#c6a15b]/10 p-3">
                <Clock size={22} className="text-[#d5b46a]" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Business Hours
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Set your salon's daily opening and closing time
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label className={labelClass}>
                  Opening Time
                </label>

                <input
                  name="openingTime"
                  type="time"
                  value={form.openingTime}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Closing Time
                </label>

                <input
                  name="closingTime"
                  type="time"
                  value={form.closingTime}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

            </div>
          </section>

          {/* SAVE BUTTON */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() => loadSalonForm()}
              className="rounded-xl border border-white/10 bg-[#141414] px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#c6a15b]/40 hover:text-white"
            >
              Reset Changes
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b08a42] to-[#e1c47b] px-7 py-3 text-sm font-bold text-black shadow-lg shadow-[#c6a15b]/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {salon ? "Update Salon Details" : "Save Salon Details"}
                </>
              )}
            </button>

          </div>
        </form>

        {/* SAVED SALON PREVIEW */}
        {salon && (
          <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141414]">

            <div className="border-b border-white/[0.07] p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <Crown size={21} className="text-[#c6a15b]" />
                <h2 className="text-lg font-semibold">
                  Saved Salon Details
                </h2>
              </div>
            </div>

            {salon.image ? (
              <img
                src={salon.image}
                alt={salon.name}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <div className="flex h-56 items-center justify-center bg-[#0d0d0d] text-gray-500">
                <ImagePlus size={30} className="mr-3" />
                No salon image uploaded
              </div>
            )}

            <div className="p-5 sm:p-7">

              <h3 className="text-2xl font-bold">
                {salon.name}
              </h3>

              {salon.description && (
                <p className="mt-3 text-sm leading-7 text-gray-400">
                  {salon.description}
                </p>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                {[
                  {
                    label: "Phone",
                    value: salon.phone,
                    icon: Phone,
                  },
                  {
                    label: "City",
                    value: salon.city,
                    icon: MapPin,
                  },
                  {
                    label: "Address",
                    value: salon.address,
                    icon: MapPin,
                  },
                  {
                    label: "Opening Time",
                    value: salon.openingTime,
                    icon: Clock,
                  },
                  {
                    label: "Closing Time",
                    value: salon.closingTime,
                    icon: Clock,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/[0.06] bg-[#0d0d0d] p-4"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon size={15} className="text-[#c6a15b]" />
                        {item.label}
                      </div>

                      <p className="mt-2 break-words text-sm font-medium text-gray-200">
                        {item.value || "Not provided"}
                      </p>
                    </div>
                  );
                })}

              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

export default SalonDetails;
