const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { setupSocketHandlers, attachSocketIO } = require('./utils/socketHandler');

// Ladda miljövariabler
dotenv.config();

// Anslut till databas
connectDB();

// Initiera Express
const app = express();

// Skapa HTTP server och Socket.io
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Gör io tillgänglig i alla routes
app.use(attachSocketIO(io));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/invoices', require('./routes/invoices'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Mini-ERP API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║      Mini-ERP Light Server Running       ║
╠═══════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}                  ║
║  Port: ${PORT}                              ║
║  Database: Connected                      ║
║  Socket.io: Active                        ║
╚═══════════════════════════════════════════╝
  `);
});

// Hantera oväntade fel
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };