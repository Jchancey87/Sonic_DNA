import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lensSelection: {
      type: [String], // ['rhythm', 'texture', 'harmony', 'arrangement']
      required: true,
    },
    responses: {
      type: mongoose.Schema.Types.Mixed, // Flexible for different audit questions
      default: {},
    },
    bookmarks: [
      {
        timestamp: Number, // seconds
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    techniques: [
      {
        description: String,
        category: {
          type: String,
          enum: ['rhythm', 'texture', 'harmony', 'arrangement'],
        },
        sourceTimestamp: Number, // optional: where in the song this was noted
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    workflowType: {
      type: String,
      enum: ['quick', 'guided'],
      default: 'quick',
    },
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
auditSchema.index({ userId: 1, songId: 1 });
auditSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Audit', auditSchema);
