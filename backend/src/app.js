const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const statusPageRoutes = require('./routes/statusPageRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/+$/, '') : null
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(cleanOrigin) ||
        process.env.NODE_ENV !== 'production' ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/status-pages', statusPageRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'PingCraft API',
    version: '1.0.0',
    status: 'ONLINE'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

app.use(errorHandler);

module.exports = app;
