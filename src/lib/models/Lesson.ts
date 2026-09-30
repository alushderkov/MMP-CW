import mongoose, { Schema } from "mongoose";

const LessonSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, required: true, trim: true, maxlength: 8000 },
    language: { type: String, default: "en", trim: true, maxlength: 8 },
    level: { type: String, default: "A1", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
  },
  { timestamps: true }
);

export default mongoose.models.Lesson || mongoose.model("Lesson", LessonSchema);
