import express from 'express';

export default function createAuthRoutes(authService) {
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
    try {
      const result = await authService.register(req.body);

      res.status(201).json(result);
    } catch (err) {
      console.error('Register error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.json(result);
    } catch (err) {
      console.error('Login error:', err);
      res.status(401).json({ error: err.message });
    }
  });

  return router;
}

