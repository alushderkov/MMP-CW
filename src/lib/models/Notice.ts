import mongoose, { Schema } from "mongoose";

const NoticeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 400 },
    kind: { type: String, enum: ["info", "success", "warning"], default: "info" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notice || mongoose.model("Notice", NoticeSchema);
