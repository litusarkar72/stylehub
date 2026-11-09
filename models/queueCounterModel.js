import mongoose from "mongoose";

const queueCounterSchema = new mongoose.Schema({
    salonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Salon",
        required: true,
    },

    queueDate: {
        type: String,
        required: true,
    },

    lastNumber: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

queueCounterSchema.index({
    salonId: 1,
    queueDate: 1,
}, {
    unique: true,
});

const QueueCounter = mongoose.model(
    "QueueCounter",
    queueCounterSchema
);

export default QueueCounter;