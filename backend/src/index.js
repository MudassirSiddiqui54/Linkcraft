import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const port = Number(process.env.PORT) || 5000;
try {
  await connectDB();
  const server = app.listen(port, () => console.log(`Linkcraft API listening on port ${port}`));
  const shutdown = signal => { console.log(`${signal}: shutting down`); server.close(async () => { const mongoose = await import('mongoose'); await mongoose.default.disconnect(); process.exit(0); }); };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} catch (error) { console.error('Startup failed:', error.message); process.exit(1); }
