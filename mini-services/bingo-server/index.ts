// ============================================================
// Bingo Aventuras Numéricas — Server Entry Point
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './src/socket';
import { getRoomCount } from './src/rooms';
import { logger } from './src/logger';

const PORT = process.env.PORT || 3003;

// ---- Express app ----
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: getRoomCount(),
    uptime: Math.floor(process.uptime()),
  });
});

// ---- HTTP server ----
const httpServer = createServer(app);

// ---- Socket.io server ----
const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    origin: [
      'http://localhost:3000',
      /^https:\/\/[a-z0-9-]+\.github\.io$/,   // GitHub Pages
      process.env.CORS_ORIGIN || '',             // Render o custom domain
    ].filter(Boolean),
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---- Register socket handlers ----
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// ---- Start server ----
httpServer.listen(Number(PORT), () => {
  logger.info(`🎲 Bingo Aventuras Numéricas server running on port ${PORT}`);
  logger.info(`   Health check: http://localhost:${PORT}/health`);
});

// ---- Graceful shutdown ----
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal, shutting down server...');
  httpServer.close(() => {
    logger.info('Bingo server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT signal, shutting down server...');
  httpServer.close(() => {
    logger.info('Bingo server closed');
    process.exit(0);
  });
});
