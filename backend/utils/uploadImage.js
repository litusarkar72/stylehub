
import cloudinary from "../config/cloudinary.js";

const uploadImage = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error("Image buffer is missing"));
    }

    cloudinary.uploader.upload_stream(
      {
        folder: "salon-app",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error);
          return reject(error);
        }

        if (!result?.secure_url) {
          return reject(new Error("Cloudinary returned no image URL"));
        }

        resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

export default uploadImage;
