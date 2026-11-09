
import mongoose from "mongoose";
import Gallery from "../models/galleryModel.js";
import Salon from "../models/salonModel.js";
import cloudinary from "../config/cloudinary.js";

const CATEGORIES = [
  "Haircut",
  "Beard Grooming",
  "Hair Treatment",
  "Salon Interior",
  "Transformations",
];

const isValidId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

const getOwnedSalon = (salonId, userId) =>
  Salon.findOne({ _id: salonId, ownerId: userId });

const canManageSalon = async (salonId, req) => {
  if (req.userRole === "admin") {
    return Salon.findById(salonId);
  }

  return getOwnedSalon(salonId, req.userId);
};

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "stylehub/gallery",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary returned no result"));
        resolve(result);
      }
    );

    stream.end(buffer);
  });

export const getSalonGallery = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { category } = req.query;

    if (!isValidId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon ID",
      });
    }

    const filter = { salonId, isActive: true };

    if (category && category !== "All") {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gallery category",
        });
      }
      filter.category = category;
    }

    const salon = await Salon.findById(salonId).select("_id isActive");
    if (!salon || salon.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Salon not found or inactive",
      });
    }

    const images = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error("Get gallery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load gallery",
    });
  }
};

export const addGalleryImage = async (req, res) => {
  let uploadedPublicId;

  try {
    const { salonId } = req.params;
    const { title, category, description = "" } = req.body;

    if (!isValidId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon ID",
      });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Title is required and must be at most 100 characters",
      });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery category",
      });
    }

    if (
      typeof description !== "string" ||
      description.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be at most 500 characters",
      });
    }

    const salon = await canManageSalon(salonId, req);

    if (!salon) {
      return res.status(403).json({
        success: false,
        message: "You cannot manage this salon's gallery",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    uploadedPublicId = result.public_id;

    const image = await Gallery.create({
      salonId: salon._id,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      title: title.trim(),
      category,
      description: description.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Gallery image uploaded successfully",
      image,
    });
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedPublicId);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    console.error("Upload gallery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload gallery image",
    });
  }
};

export const updateGalleryImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { title, category, description } = req.body;

    if (!isValidId(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery image ID",
      });
    }

    const image = await Gallery.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    const salon = await canManageSalon(image.salonId.toString(), req);

    if (!salon) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit this gallery image",
      });
    }

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid title",
        });
      }
      image.title = title.trim();
    }

    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gallery category",
        });
      }
      image.category = category;
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid description",
        });
      }
      image.description = description.trim();
    }

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Gallery image updated successfully",
      image,
    });
  } catch (error) {
    console.error("Update gallery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update gallery image",
    });
  }
};

export const deleteGalleryImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!isValidId(imageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery image ID",
      });
    }

    const image = await Gallery.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    const salon = await canManageSalon(image.salonId.toString(), req);

    if (!salon) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this gallery image",
      });
    }

    const result = await cloudinary.uploader.destroy(image.publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      return res.status(502).json({
        success: false,
        message: "Cloudinary could not delete the image",
      });
    }

    await Gallery.deleteOne({ _id: image._id });

    return res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.error("Delete gallery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete gallery image",
    });
  }
};
