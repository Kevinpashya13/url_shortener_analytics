const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../services/authService');

router.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Email and password (min 8 chars) are required' });
  }

  try {
    const user = await registerUser(email, password);
    res.status(201).json(user);
  } catch (err) {
    if (err.message === 'EMAIL_TAKEN') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;