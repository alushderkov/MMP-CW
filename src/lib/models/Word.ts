import mongoose, { Schema } from "mongoose";

const WordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    term: { type: String, required: true, trim: true, maxlength: 120 },
    translation: { type: String, required: true, trim: true, maxlength: 240 },
    transcription: { type: String, default: "", trim: true, maxlength: 80 },
    language: { type: String, default: "en", trim: true, maxlength: 8 },
    partOfSpeech: { type: String, default: "", trim: true, maxlength: 40 },
    example: { type: String, default: "", trim: true, maxlength: 400 },
    tags: { type: [String], default: [] },
    mastery: { type: Number, default: 0, min: 0, max: 5 },
    notes: { type: String, default: "", maxlength: 400 },
  },
  { timestamps: true }
);

WordSchema.index({ userId: 1, term: 1 });

export default mongoose.models.Word || mongoose.model("Word", WordSchema);
