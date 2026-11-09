import mongoose from "mongoose";
import Salon from "../models/salonModel.js";
import uploadImage from "../utils/uploadImage.js";

export const getMySalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({
      ownerId: req.userId,
    });

    return res.status(200).json({
      success: true,
      salon,
    });
  } catch (error) {
    console.error("Get salon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch salon details",
    });
  }
};

export const saveMySalon = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      phone,
      openingTime,
      closingTime,
    } = req.body;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    if (
      !name?.trim() ||
      !address?.trim() ||
      !city?.trim() ||
      !phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, address, city and phone are required",
      });
    }

    // Find this owner's existing salon.
    let salon = await Salon.findOne({
      ownerId: req.userId,
    });

    // Keep the existing image if no new image is uploaded.
    let imageUrl = salon?.image || "";

    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer);
    }

    const salonData = {
      name: name.trim(),
      description: description?.trim() || "",
      address: address.trim(),
      city: city.trim(),
      phone: phone.trim(),
      openingTime: openingTime || "09:00",
      closingTime: closingTime || "21:00",
      image: imageUrl,
    };

    if (salon) {
      Object.assign(salon, salonData);
      await salon.save();
    } else {
      salon = await Salon.create({
        ...salonData,
        ownerId: req.userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Salon details saved successfully",
      salon,
    });
  } catch (error) {
  console.error("========== SAVE SALON ERROR ==========");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  console.error("=======================================");

  return res.status(500).json({
    success: false,
    message: error.message || "Failed to save salon details",
  });
}
};

export const getPublicSalon = async (req, res) => {
  try {
    const salon = await Salon.findOne({ isActive: true }).select(
      "name description address city phone image openingTime closingTime"
    );

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon is not available",
      });
    }

    return res.status(200).json({
      success: true,
      salon,
    });
  } catch (error) {
    console.error("Get public salon error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load salon",
    });
  }
};

