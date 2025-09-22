
// Backend Server 
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// 설정 import
import { env } from './config/env.js';
import { supabase } from './config/database.js';

// 미들웨어 import
import { requestLogger } from './middleware/logging.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { metricsMiddleware, renderPrometheusMetrics } from './middleware/metrics.js';

// 서비스 import
import { analyzeHandler } from './services/analysisService.js';
import { handleChatRequest } from './services/chatService.js';
import { handleRecordRequest } from './services/recordService.js';
import { createChatStreamHandler } from './services/chatStreamService.js';
import { createAnalyzeStreamHandler } from './services/analyzeStreamService.js';

// Express app setup
const app = express();

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Simple request logging 
app.use(requestLogger);
app.use(metricsMiddleware);

// Rate limiter 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Routes (기존과 동일한 엔드포인트들)
app.get('/', (req, res) => {
  res.json({
    message: 'API server is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (로깅에 표기된 엔드포인트 실제 구현)
app.get('/health', async (req, res) => {
  const start = Date.now();
  let db = 'ok';
  try {
    // 가벼운 DB 연결 확인
    await supabase.from('records').select('date', { head: true, count: 'exact' }).limit(1);
  } catch (e) {
    db = 'error';
  }
  res.json({
    status: 'OK',
    db,
    uptime: process.uptime(),
    responseTimeMs: Date.now() - start,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint (Prometheus format)
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(renderPrometheusMetrics());
});

// Record endpoint 
app.post('/record', handleRecordRequest);

// Analysis endpoints 
app.get('/analyze', analyzeHandler);
app.post('/analyze', analyzeHandler);

// 월간 분석 엔드포인트 
app.post('/analyze-monthly', async (req, res) => {
  console.log('==============================');
  console.log('[월간분석] analyze-monthly 요청 수신');
  console.log('[월간분석] body:', req.body);
  
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    console.log('[월간분석] 분석 결과:', data);
    console.log('==============================');
    return originalJson(data);
  };
  await analyzeHandler(req, res);
});

// Chatbot endpoint 
app.post('/chat', handleChatRequest);
// Streaming endpoints (SSE)
app.get('/chat/stream', createChatStreamHandler());
app.get('/analyze/stream', createAnalyzeStreamHandler());

// 404 handler 
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /record',
      'GET|POST /analyze',
      'POST /chat',
      'GET /chat/stream',
      'GET /analyze/stream'
    ]
  });
});

// Global error handler 
app.use(globalErrorHandler);

// Start server 
const PORT = env.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET  / (Server status)');
  console.log('- GET  /health (Health check)');
  console.log('- POST /record (Save record)');
  console.log('- GET|POST /analyze (Analyze records)');
  console.log('- POST /chat (Chatbot)');
  console.log('- GET  /chat/stream (SSE Chat)');
  console.log('- GET  /analyze/stream (SSE Analyze)');
});
