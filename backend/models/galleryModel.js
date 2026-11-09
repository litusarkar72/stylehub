import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
      index: true,
    },

    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Haircut",
        "Beard Grooming",
        "Hair Treatment",
        "Salon Interior",
        "Transformations",
      ],
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

gallerySchema.index({ salonId: 1, isActive: 1, createdAt: -1 });

const Gallery = mongoose.model("Gallery", gallerySchema);

export default Gallery;