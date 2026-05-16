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
      user: { id: user._id, email: user.email, name: user.name },
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
      user: { id: user._id, email: user.email, name: user.name },
    };
  }

  generateToken(userId) {
    return jwt.sign({ userId }, this.secret, { expiresIn: '7d' });
  }
}
