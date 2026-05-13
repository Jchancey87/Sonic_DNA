import mongoose from 'mongoose';

const techniqueEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
    },
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audit',
    },
    artist: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['rhythm', 'texture', 'harmony', 'arrangement'],
      required: true,
    },
    sourceTimestamp: {
      type: Number, // seconds into the song where this was noted
    },
    tags: [String],
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast queries
techniqueEntrySchema.index({ userId: 1, category: 1 });
techniqueEntrySchema.index({ userId: 1, createdAt: -1 });
techniqueEntrySchema.index({ userId: 1, tags: 1 });

export default mongoose.model('TechniqueEntry', techniqueEntrySchema);
