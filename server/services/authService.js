import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.secret = process.env.JWT_SECRET || 'your-secret';
  }

  async register(data) {
    const { email, password, name } = data;

    if (!email || !password) {
      throw new Error('Email and password required');
    }

    const existingUser = await this.userRepository.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user - password hashing is handled by Mongoose pre-save middleware
    const user = await this.userRepository.create({ email, password, name });
    
    const token = this.generateToken(user._id);

    return {
      token,
      user: { id: user._id, email: user.email, name: user.name, preferences: user.preferences },
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password required');
    }

    // Find user by email
    // We need to ensure we get the password field
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id);

    return {
      token,
      user: { id: user._id, email: user.email, name: user.name, preferences: user.preferences },
    };
  }

  generateToken(userId) {
    return jwt.sign({ userId }, this.secret, { expiresIn: '7d' });
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      preferences: user.preferences || { defaultWorkflow: 'quick', preferredLenses: [] }
    };
  }

  async updatePreferences(userId, preferences) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedPrefs = {
      ...user.preferences,
      ...preferences
    };
    const updatedUser = await this.userRepository.updateById(userId, { preferences: updatedPrefs });
    return updatedUser.preferences;
  }
}
