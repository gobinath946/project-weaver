const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const socketHandler = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`User connected: ${socket.user.email}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join company room
    if (socket.user.companyId) {
      socket.join(`company:${socket.user.companyId}`);
    }

    // Join project rooms
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
      logger.debug(`User ${userId} joined project ${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
      logger.debug(`User ${userId} left project ${projectId}`);
    });

    // Handle task updates
    socket.on('task:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:updated', data);
    });

    // Handle bug updates
    socket.on('bug:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('bug:updated', data);
    });

    // Handle comments
    socket.on('comment:new', (data) => {
      const room = data.taskId ? `project:${data.projectId}` : `project:${data.projectId}`;
      socket.to(room).emit('comment:added', {
        ...data,
        user: {
          _id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          avatar: socket.user.avatar
        }
      });
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:typing', {
        userId,
        resourceType: data.resourceType,
        resourceId: data.resourceId
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`project:${data.projectId}`).emit('user:stopped_typing', {
        userId,
        resourceType: data.resourceType,
        resourceId: data.resourceId
      });
    });

    // Handle user presence
    socket.on('presence:update', (status) => {
      socket.to(`company:${socket.user.companyId}`).emit('user:presence', {
        userId,
        status,
        lastSeen: new Date()
      });
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.email}`);
      
      // Notify about offline status
      if (socket.user.companyId) {
        socket.to(`company:${socket.user.companyId}`).emit('user:presence', {
          userId,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}: ${error.message}`);
    });
  });
};

module.exports = socketHandler;
