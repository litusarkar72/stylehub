import mongoose from "mongoose";

const salonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One salon per admin
    },
    description: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    openingTime: {
      type: String,
      default: "09:00",
    },
    closingTime: {
      type: String,
      default: "21:00",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Salon = mongoose.model("Salon", salonSchema);

export default Salon;