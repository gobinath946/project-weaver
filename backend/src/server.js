const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./socket/socketHandler');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
});
app.use('/api/', limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts' } }
});
app.use('/api/auth/', authLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/bugs', require('./routes/bugs'));
app.use('/api/timelogs', require('./routes/timelogs'));
app.use('/api/timesheets', require('./routes/timesheets'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io handler
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = { app, server };
