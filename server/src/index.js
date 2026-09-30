// ==============================================================================
// EDGEWFORCE - ENTERPRISE BACKEND SERVER
// Commercial Sales Force Automation, Field Operations & Workforce Operating System
// Powered by Experiential Edge / Integrated Marketing Solutions
// ==============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import executiveRoutes from './routes/executiveRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import workforceRoutes from './routes/workforceRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import { requireAuth } from './middleware/auth.js';
import { employeeService } from './services/employeeService.js';
import { reminderWorker } from './services/reminderWorker.js';
import { staffImportService } from './services/staffImportService.js';
import { logger } from './utils/logger.js';
import { supabase } from './config/database.js';
import { isAllowedBrowserOrigin } from './utils/corsOrigin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const uploadDir = isServerless ? path.join(os.tmpdir(), 'edgewforce-uploads') : path.resolve(__dirname, '../uploads');

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch {
  // Gracefully ignore filesystem errors on read-only environments
}

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.CLIENT_URL) {
  throw new Error('CLIENT_URL must list the allowed production frontend origin(s).');
}

// 1. Security & Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "*"],
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "https:", "ws:", "wss:"]
    }
  }
}));

const allowedOrigins = CLIENT_URL.split(',').map(value => {
  try { return new URL(value.trim()).origin; } catch { return null; }
}).filter(origin => origin && (!isProduction || !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::|$)/i.test(origin)));
app.use(cors((req, callback) => callback(null, {
  origin: (origin, originCallback) => {
    if (isAllowedBrowserOrigin(origin, req.get('host'), allowedOrigins, isProduction)) {
      originCallback(null, true);
    } else {
      const error = new Error('Origin is not allowed by CORS.');
      error.status = 403;
      error.code = 'CORS_ORIGIN_DENIED';
      originCallback(error);
    }
  },
  credentials: true
})));

// 2. Request Body Parsers & Uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/uploads', express.static(uploadDir));

// 3. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' } }
});
app.use('/api', generalLimiter);

// 4. Health Check
app.get('/api/health', async (req, res) => {
  try {
    if (!supabase) {
      if (isProduction) throw new Error('Production Supabase client is unavailable.');
      return res.json({ status: 'healthy', database: 'local', service: 'EDGEWFORCE Enterprise Backend', version: '1.0.0', timestamp: new Date().toISOString() });
    }

    const { error: companyError } = await supabase.from('companies').select('id', { head: true }).limit(1);
    if (companyError) throw companyError;

    const { error: uuidColumnError } = await supabase.from('employees').select('uuid').limit(0);
    if (uuidColumnError) throw new Error('Supabase migrations 011 and 012 are required: employees.uuid is missing or inaccessible.');

    const { error: assignmentTypeError } = await supabase
      .from('employee_location_assignments')
      .select('id')
      .eq('employee_id', '00000000-0000-4000-8000-000000000000')
      .limit(0);
    if (assignmentTypeError) throw new Error('Supabase migrations 011 and 012 are required: employee_location_assignments.employee_id must be UUID.');

    res.json({ status: 'healthy', database: 'supabase', service: 'EDGEWFORCE Enterprise Backend', version: '1.0.0', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Readiness check failed', error);
    res.status(503).json({ status: 'not_ready', database: 'unavailable_or_unmigrated', service: 'EDGEWFORCE Enterprise Backend', version: '1.0.0' });
  }
});

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', notificationRoutes);
app.use('/api/workforce', workforceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/work-locations', locationRoutes);
app.use('/api/schedules', scheduleRoutes);


// Compatibility route for idle telemetry
app.post('/api/telemetry/idle', requireAuth, async (req, res) => {
  try {
    const empId = req.user.employee?.id || req.user.id;
    const alert = await employeeService.logIdleEvent(empId, req.body, req);
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// 6. Serve Client Static Assets (Production Mode)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api/') && !req.originalUrl.startsWith('/uploads/')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// 7. 404 Handler for Unhandled API Routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`
    }
  });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred.'
    }
  });
});

// Start Server if directly executed (standalone non-serverless mode)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`EdgeWForce Backend Server operational on port ${PORT}`);
    logger.info(`API Base URL: http://localhost:${PORT}/api`);
    if (supabase) {
      supabase.from('task_reminders').select('id').limit(0).then(({ error }) => {
        if (error) logger.warn('Reminder worker requires the database migrations. Restart the backend after applying them.');
        else reminderWorker.start(15000);
      }).catch(() => logger.warn('Reminder worker could not connect to Supabase.'));
    } else {
      reminderWorker.start(15000);
    }
    if (!supabase) {
      staffImportService.importAuthoritativeStaff().catch(err => {
        logger.warn(`Staff sync note: ${err.message}`);
      });
    }
  });
}

export default app;
