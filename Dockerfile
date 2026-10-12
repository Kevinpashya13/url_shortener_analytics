FROM node:20-alpine AS base
WORKDIR /app

# Install openssl and build libraries for native bindings & Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy dependencies definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies and generate Prisma Client
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose API port
EXPOSE 3000

# Start script with migration deploy
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
