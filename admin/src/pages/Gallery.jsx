
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import {
  Images,
  Upload,
  Pencil,
  Trash2,
  RefreshCw,
  ImagePlus,
  X,
  Store,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Filter,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  "Haircut",
  "Beard Grooming",
  "Hair Treatment",
  "Salon Interior",
  "Transformations",
];

const EMPTY_FORM = {
  title: "",
  category: "Haircut",
  description: "",
};

const Gallery = () => {
  const { backendUrl, token, admin } = useContext(AdminContext);

  const [salon, setSalon] = useState(null);
  const [salonId, setSalonId] = useState("");
  const [images, setImages] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState("");

  const [loadingSalon, setLoadingSalon] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const authConfig = useMemo(
    () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    [token]
  );

  const filteredImages = useMemo(() => {
    if (categoryFilter === "All") return images;

    return images.filter(
      (image) => image.category === categoryFilter
    );
  }, [images, categoryFilter]);

  // =========================
  // FETCH SALON
  // =========================

  const fetchSalon = useCallback(async () => {
    if (!token) {
      setSalon(null);
      setSalonId("");
      setImages([]);
      setError("Please log in again.");
      setLoadingSalon(false);
      return;
    }

    setLoadingSalon(true);
    setError("");

    try {
      const response = await axios.get(
        `${backendUrl}/api/salons/my`,
        authConfig
      );

      const ownSalon = response.data.salon;

      if (!ownSalon?._id) {
        setSalon(null);
        setSalonId("");
        setImages([]);
        setError("No salon is associated with this account.");
        return;
      }

      setSalon(ownSalon);
      setSalonId(ownSalon._id);
    } catch (err) {
      setSalon(null);
      setSalonId("");
      setImages([]);

      setError(
        err.response?.data?.message ||
          "Unable to load your salon."
      );
    } finally {
      setLoadingSalon(false);
    }
  }, [backendUrl, authConfig, token]);

  // =========================
  // FETCH GALLERY IMAGES
  // =========================

  const fetchImages = useCallback(async () => {
    if (!salonId || !token) {
      setImages([]);
      return;
    }

    setLoadingImages(true);
    setError("");

    try {
      const response = await axios.get(
        `${backendUrl}/api/gallery/salon/${salonId}`,
        authConfig
      );

      setImages(response.data.images || []);
    } catch (err) {
      setImages([]);

      setError(
        err.response?.data?.message ||
          "Unable to load the salon gallery."
      );
    } finally {
      setLoadingImages(false);
    }
  }, [backendUrl, salonId, authConfig, token]);

  useEffect(() => {
    fetchSalon();
  }, [fetchSalon]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setEditingId("");

    const input = document.getElementById("gallery-file");

    if (input) input.value = "";
  };

  // =========================
  // EDIT IMAGE
  // =========================

  const handleEdit = (image) => {
    setEditingId(image._id);

    setForm({
      title: image.title || "",
      category: image.category || "Haircut",
      description: image.description || "",
    });

    setFile(null);
    setError("");
    setNotice("");

    document.getElementById("gallery-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =========================
  // SAVE / UPLOAD IMAGE
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!salonId) {
      setError("Your salon could not be found.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please enter an image title.");
      return;
    }

    if (!editingId && !file) {
      setError("Please select an image to upload.");
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await axios.put(
          `${backendUrl}/api/gallery/${editingId}`,
          {
            title: form.title.trim(),
            category: form.category,
            description: form.description.trim(),
          },
          authConfig
        );

        setNotice("Gallery image updated successfully.");
      } else {
        const body = new FormData();

        body.append("image", file);
        body.append("title", form.title.trim());
        body.append("category", form.category);
        body.append("description", form.description.trim());

        await axios.post(
          `${backendUrl}/api/gallery/salon/${salonId}`,
          body,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setNotice("Gallery image uploaded successfully.");
      }

      resetForm();
      await fetchImages();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save the gallery image."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE IMAGE
  // =========================

  const handleDelete = async (image) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${image.title}"?`
    );

    if (!confirmed) return;

    setDeletingId(image._id);
    setError("");
    setNotice("");

    try {
      await axios.delete(
        `${backendUrl}/api/gallery/${image._id}`,
        authConfig
      );

      setImages((current) =>
        current.filter((item) => item._id !== image._id)
      );

      if (editingId === image._id) {
        resetForm();
      }

      setNotice("Gallery image deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete the gallery image."
      );
    } finally {
      setDeletingId("");
    }
  };

  // =========================
  // REFRESH
  // =========================

  const handleRefresh = async () => {
    setNotice("");
    setError("");

    await fetchSalon();
  };

  // =========================
  // FILE PREVIEW
  // =========================

  const previewUrl = file
    ? URL.createObjectURL(file)
    : null;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#090909] p-4 text-white sm:p-6 lg:p-8">

      {/* PAGE HEADER */}

      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#c6a15b]">
            <Sparkles size={15} />
            Premium Owner Panel
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Gallery Management
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Manage your salon photos and showcase your best work.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Welcome, {admin?.name || "Admin"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loadingSalon || loadingImages}
          className="flex items-center justify-center gap-2 self-start rounded-xl border border-[#c6a15b]/30 bg-[#171717] px-4 py-3 text-sm font-semibold text-[#d5b46a] transition hover:bg-[#c6a15b]/10 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={
              loadingSalon || loadingImages
                ? "animate-spin"
                : ""
            }
          />
          Refresh
        </button>

      </header>

      {/* ALERTS */}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
        >
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {/* SALON INFORMATION */}

      <section className="mb-7 grid gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6 md:col-span-2">

          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-[#c6a15b]/10 p-3">
              <Store className="text-[#d5b46a]" size={23} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Managing gallery for
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {loadingSalon
                  ? "Loading salon..."
                  : salon?.name || "Salon not found"}
              </h2>
            </div>
          </div>

          {salon?.address && (
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin size={15} className="text-[#c6a15b]" />
              {salon.address}
            </p>
          )}

          {salon && (
            <p className="mt-4 text-xs text-emerald-400">
              <CheckCircle2 size={14} className="mr-1 inline" />
              You are managing this salon's gallery.
            </p>
          )}

        </div>

        <div className="rounded-2xl border border-[#c6a15b]/20 custom-gradient from-[#201b12] to-[#141414] p-6">

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Total Gallery Images
            </p>

            <Images size={23} className="text-[#d5b46a]" />
          </div>

          <p className="mt-5 text-4xl font-bold text-[#e0c47f]">
            {images.length}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Photos uploaded to your salon
          </p>

        </div>

      </section>

      {/* UPLOAD / EDIT FORM */}

      <section
        id="gallery-form"
        className="mb-8 rounded-2xl border border-[#c6a15b]/20 bg-[#141414] p-5 sm:p-7"
      >

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#c6a15b]/10 p-3">
              {editingId ? (
                <Pencil size={21} className="text-[#d5b46a]" />
              ) : (
                <ImagePlus size={21} className="text-[#d5b46a]" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold">
                {editingId
                  ? "Edit Gallery Image"
                  : "Add New Gallery Image"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {editingId
                  ? "Update your image information."
                  : "Upload a new photo to showcase your salon."}
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <X size={16} />
              Cancel edit
            </button>
          )}

        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* IMAGE UPLOAD */}

          {!editingId && (
            <div>
              <label
                htmlFor="gallery-file"
                className="mb-2 block text-sm font-semibold text-gray-300"
              >
                Select Image
              </label>

              <label
                htmlFor="gallery-file"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#c6a15b]/40 bg-[#0e0e0e] p-8 text-center transition hover:border-[#d5b46a] hover:bg-[#c6a15b]/5"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="mb-4 max-h-48 rounded-xl object-contain"
                  />
                ) : (
                  <Upload
                    size={35}
                    className="mb-3 text-[#d5b46a]"
                  />
                )}

                <p className="font-semibold text-gray-200">
                  {file ? file.name : "Click to upload image"}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG or WebP · Maximum 5 MB
                </p>
              </label>

              <input
                id="gallery-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(event) =>
                  setFile(event.target.files?.[0] || null)
                }
                className="hidden"
              />
            </div>
          )}

          {/* TITLE AND CATEGORY */}

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label
                htmlFor="gallery-title"
                className="mb-2 block text-sm font-semibold text-gray-300"
              >
                Image Title <span className="text-[#d5b46a]">*</span>
              </label>

              <input
                id="gallery-title"
                type="text"
                required
                maxLength={100}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Modern Haircut"
                className="w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b]"
              />
            </div>

            <div>
              <label
                htmlFor="gallery-category"
                className="mb-2 block text-sm font-semibold text-gray-300"
              >
                Image Category
              </label>

              <select
                id="gallery-category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none focus:border-[#c6a15b]"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="gallery-description"
              className="mb-2 block text-sm font-semibold text-gray-300"
            >
              Description
            </label>

            <textarea
              id="gallery-description"
              rows={4}
              maxLength={500}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe this hairstyle or salon photo..."
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0d0d0d] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#c6a15b]"
            />
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={saving || !salonId || loadingSalon}
            className="flex items-center justify-center gap-2 rounded-xl custom-gradient from-[#b08a42] to-[#e1c47b] px-6 py-3 font-bold text-black shadow-lg shadow-[#c6a15b]/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : editingId ? (
              <Pencil size={17} />
            ) : (
              <Upload size={17} />
            )}

            {saving
              ? "Saving..."
              : editingId
                ? "Save Changes"
                : "Upload Image"}
          </button>

        </form>

      </section>

      {/* GALLERY */}

      <section>

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">
                Salon Gallery
              </h2>

              <span className="rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-3 py-1 text-xs font-semibold text-[#d5b46a]">
                {filteredImages.length} Images
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Manage your salon's visual portfolio.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-3">
            <Filter size={16} className="text-[#c6a15b]" />

            <select
              aria-label="Filter gallery by category"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="bg-transparent py-3 text-sm text-gray-300 outline-none"
            >
              <option value="All">All Categories</option>

              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* LOADING */}

        {loadingSalon || loadingImages ? (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-12 text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-[#d5b46a]"
            />

            <p className="mt-4 text-sm text-gray-400">
              Loading gallery...
            </p>
          </div>
        ) : !salonId ? (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-12 text-center text-gray-400">
            Your salon could not be loaded. Please refresh or log in again.
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-12 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c6a15b]/10">
              <ImageIcon size={30} className="text-[#d5b46a]" />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              No Gallery Images Found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Upload your first salon photo to get started.
            </p>

          </div>
        ) : (

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filteredImages.map((image) => (

              <article
                key={image._id}
                className="group overflow-hidden rounded-2xl border custom-border bg-[#141414] transition duration-300 hover:-translate-y-1 hover:border-[#c6a15b]/40"
              >

                {/* IMAGE */}

                <div className="relative custom-aspect overflow-hidden bg-[#202020]">

                  <img
                    src={image.imageUrl}
                    alt={image.title || "Salon gallery image"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-3 top-3 rounded-full border border-[#d5b46a]/30 bg-black/75 px-3 py-1 text-xs font-semibold text-[#e0c47f] backdrop-blur">
                    {image.category}
                  </div>

                </div>

                {/* IMAGE DETAILS */}

                <div className="space-y-3 p-4">

                  <h3 className="font-bold text-gray-100">
                    {image.title}
                  </h3>

                  <p className="min-h-10 whitespace-pre-wrap custom-break text-sm text-gray-500">
                    {image.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">

                    <button
                      type="button"
                      onClick={() => handleEdit(image)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c6a15b]/30 bg-[#c6a15b]/5 px-3 py-2 text-sm font-semibold text-[#d5b46a] transition hover:bg-[#c6a15b] hover:text-black"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === image._id}
                      onClick={() => handleDelete(image)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      {deletingId === image._id ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      Delete
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>
        )}

      </section>

      {/* FOOTER */}

      <div className="mt-8 flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-xs text-gray-600 sm:flex-row">
        <p>SalonPro Premium Management</p>
        <p>Gallery Management · {images.length} Total Images</p>
      </div>

    </div>
  );
};

export default Gallery;
