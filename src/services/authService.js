const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const SALT_ROUNDS = 10;

async function registerUser(email, password) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_TAKEN');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  return { id: user.id, email: user.email };
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return { token, user: { id: user.id, email: user.email } };
}

module.exports = { registerUser, loginUser };