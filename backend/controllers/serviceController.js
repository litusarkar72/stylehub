
import Service from "../models/serviceModel.js";
import Salon from "../models/salonModel.js";
import mongoose from "mongoose";
import uploadImage from "../utils/uploadImage.js";

export const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    if (
      !name?.trim() ||
      price === undefined ||
      price === "" ||
      duration === undefined ||
      duration === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, price and duration are required",
      });
    }

    const servicePrice = Number(price);
    const serviceDuration = Number(duration);

    if (!Number.isFinite(servicePrice) || servicePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid price",
      });
    }

    if (!Number.isFinite(serviceDuration) || serviceDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Duration must be greater than zero",
      });
    }

    const salon = await Salon.findOne({ ownerId: req.userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found. Please set up your salon first.",
      });
    }

    // Upload the selected image to Cloudinary.
    let imageUrl = "";

    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer);
    }

    const service = await Service.create({
      salonId: salon._id,
      name: name.trim(),
      description: description?.trim() || "",
      price: servicePrice,
      duration: serviceDuration,
      image: imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create service",
    });
  }
};

export const updateService = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const salon = await Salon.findOne({ ownerId: req.userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    const { name, description, price, duration } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Service name cannot be empty",
      });
    }

    if (
      price !== undefined &&
      (price === "" || !Number.isFinite(Number(price)) || Number(price) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid price",
      });
    }

    if (
      duration !== undefined &&
      (duration === "" ||
        !Number.isFinite(Number(duration)) ||
        Number(duration) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid duration",
      });
    }

    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) {
      updates.description = description.trim();
    }
    if (price !== undefined) updates.price = Number(price);
    if (duration !== undefined) updates.duration = Number(duration);

    // Preserve the old image unless a new one is uploaded.
    if (req.file) {
      updates.image = await uploadImage(req.file.buffer);
    }

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, salonId: salon._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in your salon",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update service",
    });
  }
};

// Get ALL services belonging to the logged-in owner's salon
export const getSalonServices = async (req, res) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found. Please set up your salon first.",
      });
    }

    const services = await Service.find({
      salonId: salon._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get salon services error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};


// Activate or deactivate a service
export const updateServiceStatus = async (req, res) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.userId });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, salonId: salon._id },
      { $set: { isActive } },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in your salon",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Service activated successfully"
        : "Service deactivated successfully",
      service,
    });
  } catch (error) {
    console.error("Update service status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update service status",
    });
  }
};

export const getPublicServices = async (req, res) => {
  try {
    const salon = await Salon.findOne({ isActive: true }).select("_id");

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon is not available",
      });
    }

    const services = await Service.find({
      salonId: salon._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get public services error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load services",
    });
  }
};


export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    // Find the logged-in owner's salon
    const salon = await Salon.findOne({
      ownerId: req.userId,
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    // Delete only a service belonging to this salon
    const service = await Service.findOneAndDelete({
      _id: id,
      salonId: salon._id,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found in your salon",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      serviceId: service._id,
    });

  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete service",
    });
  }
};
