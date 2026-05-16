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

    // Name / label for the technique (short, memorable)
    techniqueName: {
      type: String,
      trim: true,
    },
    // Detailed description / notes
    description: {
      type: String,
      required: true,
    },
    // Which lens this technique relates to
    lens: {
      type: String,
      enum: ['rhythm', 'texture', 'harmony', 'arrangement'],
      required: true,
    },

    artist: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
    },

    // Where in the song this was observed (seconds)
    exampleTimestamp: {
      type: Number,
    },

    // How confident/certain is this observation? 1–5 scale
    confidence: {
      type: Number,
      min: 1,
      max: 5,
    },

    // What do you want to do next with this technique?
    nextAction: {
      type: String,
      enum: ['study', 'practice', 'transcribe', 'apply', 'revisit', null],
      default: null,
    },

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Text index for full-text search across key fields
techniqueEntrySchema.index({
  techniqueName: 'text',
  description: 'text',
  notes: 'text',
});

// Fast queries by lens, artist, tag, date
techniqueEntrySchema.index({ userId: 1, lens: 1, deletedAt: 1 });
techniqueEntrySchema.index({ userId: 1, deletedAt: 1, createdAt: -1 });
techniqueEntrySchema.index({ userId: 1, tags: 1 });

export default mongoose.model('TechniqueEntry', techniqueEntrySchema);
