import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const preferencesSchema = new mongoose.Schema(
  {
    defaultWorkflow: {
      type: String,
      enum: ['quick', 'guided'],
      default: 'quick',
    },
    preferredLenses: {
      type: [String],
      default: [],
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Display name shown in UI
    displayName: {
      type: String,
      trim: true,
    },
    // Legacy field kept for backwards compat during transition
    name: {
      type: String,
      trim: true,
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
