const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

// Import routes
const authRoutes = require("./routes/auth.routes");
const masterRoutes = require("./routes/master.routes");
const companyRoutes = require("./routes/company.routes");
const dropdownRoutes = require("./routes/dropdown.routes");
const logsRoutes = require("./routes/logs.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const customModuleRoutes = require("./routes/customModule.routes");


const errorHandler = require("./middleware/error");
const { logRequest } = require("./controllers/logs.controller");
const { startGlobalLogCleanupCron } = require("./jobs/globalLogsCron");


// Connect to database
connectDB();


const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
// app.use(cors({
//   origin: [
//     process.env.FRONTEND_URL || 'http://localhost:8080',
//     'http://localhost:8080',
//     'http://127.0.0.1:8080'
//   ],
//   credentials: true
// }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization
app.use(mongoSanitize());
// Apply XSS sanitization conditionally - skip for workflow routes that need HTML templates
app.use((req, res, next) => {
  xss()(req, res, next);
});

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("combined"));
}

// Custom logging middleware
app.use(logRequest);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Socket.io health check endpoint
app.get("/socket/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Socket.io endpoint is available",
    timestamp: new Date().toISOString(),
  });
});

// Start CRON jobs
startGlobalLogCleanupCron();


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/dropdown", dropdownRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/master/custom-modules", customModuleRoutes);


app.get("/api/health", async (req, res) => {
  try {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      services: {},
    };

    // Check MongoDB connection
    try {
      const dbState = mongoose.connection.readyState;
      healthCheck.services.database = {
        status: dbState === 1 ? "connected" : "disconnected",
        state: dbState,
        stateName: getMongoDBStateName(dbState),
      };

      // Test a simple query if connected
      if (dbState === 1) {
        const User = require("./models/User");
        const GlobalLog = require("./models/GlobalLog");

        const userCount = await User.countDocuments();
        const logCount = await GlobalLog.countDocuments();
        healthCheck.services.database.userCount = userCount;
        healthCheck.services.database.logCount = logCount;
      }
    } catch (dbError) {
      healthCheck.services.database = {
        status: "error",
        error: dbError.message,
      };
    }

    // Add other service checks
    healthCheck.services.redis = { status: "not_implemented" };
    healthCheck.services.sqs = { status: "not_implemented" };

    // Overall status
    const allServicesHealthy = Object.values(healthCheck.services).every(
      (service) =>
        service.status === "connected" || service.status === "not_implemented"
    );

    if (!allServicesHealthy) {
      healthCheck.status = "degraded";
      return res.status(503).json(healthCheck);
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Internal server error during health check",
    });
  }
});

// Simple health check
app.get("/api/health/simple", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "OK" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: isDbConnected,
      state: dbState,
      stateName: getMongoDBStateName(dbState),
    },
  });
});

// Basic health check for load balancers
app.get("/api/health/basic", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  if (isDbConnected) {
    res.status(200).send("OK");
  } else {
    res.status(503).send("Service Unavailable");
  }
});

// Helper function to get MongoDB connection state name
function getMongoDBStateName(state) {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };
  return states[state] || "unknown";
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
