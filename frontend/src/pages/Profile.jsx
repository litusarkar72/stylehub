
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  ArrowLeft,
  Camera,
  Upload,
  X,
} from "lucide-react";

import { useAppContext } from "../context/AppContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function Profile() {
  const {
    user,
    token,
    isAuthenticated,
    backendUrl,
    updateUser,
  } = useAppContext();

  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Clean up temporary image preview.
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Select and validate image.
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Cancel selected image.
  const handleCancelSelection = () => {
    setSelectedFile(null);
    setPreview("");
    setMessage("");
    setError("");

    const input = document.getElementById("profileImageInput");

    if (input) {
      input.value = "";
    }
  };

  // Upload image to Cloudinary and save it in MongoDB.
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    if (!token) {
      setError("Your session has expired. Please login again.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setMessage("");

      // STEP 1: Get signed upload details from backend.
      const signatureResponse = await axios.post(
        `${backendUrl}/api/user/profile/upload-signature`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const signatureData = signatureResponse.data;

      if (
        !signatureData.success ||
        !signatureData.signature ||
        !signatureData.timestamp ||
        !signatureData.publicId ||
        !signatureData.apiKey ||
        !signatureData.cloudName
      ) {
        throw new Error(
          signatureData.message ||
          "Unable to generate Cloudinary signature."
        );
      }

      // STEP 2: Upload directly to Cloudinary.
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("public_id", signatureData.publicId);

      // Must match the signed parameters on your backend.
      if (signatureData.overwrite === true) {
        formData.append("overwrite", "true");
      }

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        formData
      );

      const uploadedImage = cloudinaryResponse.data;

      if (
        !uploadedImage.public_id ||
        !uploadedImage.secure_url
      ) {
        throw new Error(
          "Cloudinary did not return a valid image."
        );
      }

      // console.log("Cloudinary upload successful:", {
      //   publicId: uploadedImage.public_id,
      //   imageUrl: uploadedImage.secure_url,
      // });

      // STEP 3: Save uploaded image reference in MongoDB.
      const saveResponse = await axios.post(
        `${backendUrl}/api/user/profile/save-image`,
        {
          publicId: uploadedImage.public_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!saveResponse.data.success) {
        throw new Error(
          saveResponse.data.message ||
          "Unable to save profile image."
        );
      }

      // STEP 4: Update React context and localStorage.
      let updatedUser = saveResponse.data.user;

      if (!updatedUser) {
        const profileResponse = await axios.get(
          `${backendUrl}/api/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        updatedUser =
          profileResponse.data.user ||
          profileResponse.data.data?.user;
      }

      if (!updatedUser) {
        throw new Error(
          "Image uploaded, but unable to refresh customer profile."
        );
      }

      updateUser(updatedUser);

      // Clear selection and preview.
      setSelectedFile(null);
      setPreview("");
      setMessage("Profile picture updated successfully!");

      const input = document.getElementById("profileImageInput");

      if (input) {
        input.value = "";
      }

    } catch (err) {
      console.error("PROFILE IMAGE UPLOAD ERROR:", {
        url: err.config?.url,
        status: err.response?.status,
        response: err.response?.data,
        message: err.message,
      });

      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Profile image upload failed."
      );

    } finally {
      setIsUploading(false);
    }
  };

  // Login check.
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">
          Login required
        </h1>

        <p className="mt-2 text-gray-600">
          Please log in to view your profile.
        </p>

        <Link
          to="/login"
          className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-white"
        >
          Login
        </Link>
      </main>
    );
  }

  // Customer details.
  const details = [
    {
      label: "Full name",
      value: user?.name,
      icon: UserRound,
    },
    {
      label: "Email address",
      value: user?.email,
      icon: Mail,
    },
    {
      label: "Phone number",
      value: user?.phone,
      icon: Phone,
    },
    {
      label: "Account role",
      value: user?.role || "Customer",
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          {/* Profile header */}
          <div className="bg-gray-900 px-6 py-8 text-white sm:px-8">

            <div className="flex items-center gap-5">

              {/* Profile image */}
              <div className="relative h-24 w-24 shrink-0">

                <img
                  src={
                    preview ||
                    user?.profileImage ||
                    "https://placehold.co/120x120?text=User"
                  }
                  alt="Profile"
                  className="h-24 w-24 rounded-full border-2 border-white/30 object-cover"
                />

                {/* Hidden file input */}
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />

                {/* Camera button */}
                <label
                  htmlFor="profileImageInput"
                  title="Change profile picture"
                  className={`absolute bottom-0 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg ${
                    isUploading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:bg-gray-200"
                  }`}
                >
                  <Camera size={20} />
                </label>
              </div>

              {/* Customer name */}
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">
                  My Profile
                </h1>

                <p className="mt-1 truncate text-sm text-gray-300">
                  {user?.name || "StyleHub Customer"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Click the camera icon to change your picture
                </p>
              </div>
            </div>

            {/* Selected image information */}
            {selectedFile && (
              <div className="mt-5 rounded-lg bg-white/10 p-4">

                <p className="break-all text-sm text-gray-200">
                  Selected: {selectedFile.name}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload size={17} />

                    {isUploading
                      ? "Uploading..."
                      : "Save Profile Picture"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelSelection}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <X size={17} />
                    Cancel
                  </button>

                </div>
              </div>
            )}

            {/* Uploading message */}
            {isUploading && (
              <p className="mt-4 text-sm text-gray-300">
                Uploading your profile picture. Please wait...
              </p>
            )}

            {/* Success message */}
            {message && (
              <p className="mt-4 text-sm text-green-300">
                {message}
              </p>
            )}

            {/* Error message */}
            {error && (
              <p className="mt-4 text-sm text-red-300">
                {error}
              </p>
            )}
          </div>

          {/* Customer details */}
          <div className="divide-y divide-gray-100 px-6 sm:px-8">

            {details.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-4 py-5"
              >
                <div className="rounded-lg bg-gray-100 p-3">
                  <Icon size={20} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    {label}
                  </p>

                  <p className="mt-1 break-words font-medium text-gray-900">
                    {value || "Not provided"}
                  </p>
                </div>
              </div>
            ))}

          </div>

          {/* Navigation buttons */}
          <div className="flex flex-wrap gap-3 px-6 pb-6 sm:px-8">

            <Link
              to="/my-queue"
              className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              View My Queue
            </Link>

            <Link
              to="/queue-history"
              className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-50"
            >
              Queue History
            </Link>

          </div>
        </section>
      </div>
    </main>
  );
}
