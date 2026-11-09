import User from "../models/userModel.js";
import cloudinary from "../config/cloudinary.js";

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getProfileUploadSignature = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const publicId = `stylehub/profiles/${user._id}`;

    // These exact parameters must also be sent to Cloudinary.
    const paramsToSign = {
      timestamp,
      public_id: publicId,
      overwrite: true,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      success: true,
      signature,
      timestamp,
      publicId,
      overwrite: true,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });

  } catch (error) {
    console.error("Cloudinary signature error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate Cloudinary signature",
    });
  }
};


export const saveProfileImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const expectedPublicId = `stylehub/profiles/${user._id}`;

    if (publicId !== expectedPublicId) {
      return res.status(400).json({
        success: false,
        message: "Invalid image identifier",
      });
    }

    // Verify image exists in Cloudinary
    const image = await cloudinary.api.resource(expectedPublicId);

    user.profileImage = image.secure_url;
    user.profileImagePublicId = image.public_id;

    await user.save();

    const updatedUser = await User.findById(req.userId)
      .select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile image saved successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Save image error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not save profile image",
    });
  }
};