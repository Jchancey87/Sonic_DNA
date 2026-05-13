import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import songRoutes from './routes/songs.js';
import auditRoutes from './routes/audits.js';
import techniqueRoutes from './routes/techniques.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sonic_dna')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

// Routes (public)
app.use('/api/auth', authRoutes);

// Routes (protected)
app.use('/api/songs', authMiddleware, songRoutes);
app.use('/api/audits', authMiddleware, auditRoutes);
app.use('/api/techniques', authMiddleware, techniqueRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
