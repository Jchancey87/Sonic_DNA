import mongoose from 'mongoose';

const songSchema = new mongoose.Schema(
  {
    youtubeId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in seconds
    },
    thumbnail: {
      type: String,
    },
    youtubeUrl: {
      type: String,
    },
    researchSummary: {
      type: mongoose.Schema.Types.Mixed, // Tavily research data
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index: user can't import same song twice
songSchema.index({ userId: 1, youtubeId: 1 }, { unique: true });

export default mongoose.model('Song', songSchema);
