import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { errorHandler } from './middleware/errorHandler.js';
import aiRoutes from './routes/aiRoutes.js';
import { setupTranscriptionWebSocket } from './routes/transcriptionRoutes.js';

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [CLIENT_URL, 'file://'],
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/ai', aiRoutes);

app.use(errorHandler);

const server = createServer(app);
setupTranscriptionWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set PORT in server/.env`
    );
    process.exit(1);
  }
  throw err;
});
