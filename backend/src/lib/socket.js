// ============================================================================
// WebStackPro Realtime (Socket.io)
// Pushes new messages, handoffs, toasts and typing events to the dashboard.
// Rooms: `biz:<businessId>` — each WebStackPro dashboard joins its business room.
// ============================================================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(server, corsOrigin) {
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('WebStackPro: missing token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data = payload;
      next();
    } catch (_) {
      next(new Error('WebStackPro: unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const businessId = socket.data.businessId;
    if (businessId) socket.join(`biz:${businessId}`);

    socket.on('webstackpro:typing', (data) => {
      socket.to(`biz:${businessId}`).emit('webstackpro:typing', data);
    });

    socket.on('disconnect', () => {
      socket.leave(`biz:${businessId}`);
    });
  });

  return io;
}

/** Emit a real-time toast: "New message on WebStackPro" */
function emitNewMessage(businessId, payload) {
  if (!io) return;
  io.to(`biz:${businessId}`).emit('webstackpro:new-message', payload);
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO, emitNewMessage };