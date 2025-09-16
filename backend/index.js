﻿// Backend Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error(' Supabase environment variables not set');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error(' OpenAI API key not set');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Express app setup
const app = express();

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'API server is running',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Record endpoint
app.post('/record', async (req, res) => {
  try {
    const { user_id, date, fatigue, notes } = req.body;
    
    if (!user_id || !date || !fatigue) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'date', 'fatigue']
      });
    }

    if (fatigue < 1 || fatigue > 5) {
      return res.status(400).json({
        error: 'Fatigue must be between 1-5'
      });
    }

    const { data, error } = await supabase
      .from('records')
      .upsert({ user_id, date, fatigue, notes });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Analysis endpoint
async function analyzeHandler(req, res) {
  try {
    console.log('--- 분석 요청 수신 ---');
    console.log('Body:', req.body);
    // Validate the request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must be a valid JSON object',
        received: typeof req.body
      });
    }

    // Extract and log parameters
    const { range, from, to } = req.body;
    console.log('Request body:', req.body);
    console.log('Request parameters:', { range, from, to });

    // Validate parameters (more robust)
    // Only treat range as present if it's a non-empty string
    const hasRange = typeof range === 'string' && range.trim().length > 0;
    const hasFromTo = typeof from === 'string' && typeof to === 'string' && from.length > 0 && to.length > 0;

    if (hasRange && hasFromTo) {
      return res.status(400).json({
        error: 'Invalid parameters',
        message: 'Provide either range OR from/to dates, not both',
        examples: [
          { range: 'daily' },
          { from: '2025-09-01', to: '2025-09-07' }
        ]
      });
    }

    if (!hasRange && !hasFromTo) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Provide either range OR both from and to dates',
        examples: [
          { range: 'daily' },
          { from: '2025-09-01', to: '2025-09-07' }
        ]
      });
    }

    let fromDate, toDate;
    if (range) {
      const now = dayjs();
      switch (range) {
        case 'daily':
          fromDate = now.startOf('day').format('YYYY-MM-DD');
          toDate = now.format('YYYY-MM-DD');
          break;
        case 'weekly':
          fromDate = now.startOf('week').format('YYYY-MM-DD');
          toDate = now.format('YYYY-MM-DD');
          break;
        case 'monthly':
          fromDate = now.startOf('month').format('YYYY-MM-DD');
          toDate = now.format('YYYY-MM-DD');
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid range value',
            allowed: ['daily', 'weekly', 'monthly']
          });
      }
    } else {
      fromDate = from;
      toDate = to;
    }
    console.log(`[분석] from: ${fromDate}, to: ${toDate}`);

    console.log('Querying Supabase for date range:', { fromDate, toDate });
    
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('[분석] Supabase query error:', error);
      console.log(`[분석] 실패: DB 조회 에러 (${error.message})`);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      console.log(`[분석] 실패: 데이터 없음 (${fromDate} ~ ${toDate})`);
      return res.json({ 
        result: 'No data found for the specified period. Please record some entries first.'
      });
    }

    console.log(`[분석] 조회된 기록 수: ${data.length}`);

    const formatted = data
      .map(row => {
        const fatigueText = ['Very Bad', 'Bad', 'Okay', 'Good', 'Very Good'][row.fatigue - 1] || row.fatigue;
        return ` ${row.date}: Condition ${fatigueText} (${row.notes || 'No notes'})`;
      })
      .join('\n');

    console.log('[분석] OpenAI로 보낼 데이터:', formatted);
    
    let completion;
    try {
      console.log('[분석] OpenAI API 요청');
      completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are an empathetic counselor who specializes in emotional analysis. Always respond in Korean with warm and friendly tone. Never use English in your responses.'
          },
          { 
            role: 'user', 
            content: `다음은 사용자의 컨디션 데이터입니다:\n${formatted}\n\n다음 내용을 포함하여 종합적인 분석을 해주세요:\n1. 전반적인 패턴\n2. 주목할만한 변화나 트렌드\n3. 개선을 위한 제안\n\n따뜻하고 친근한 톤으로 3-4문장으로 요약해주세요.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      console.log('[분석] OpenAI 응답 수신:', completion.choices?.[0]?.message?.content);
      console.log(`[분석] 성공: ${fromDate} ~ ${toDate}`);
    } catch (openaiError) {
      console.error('[분석] OpenAI API error:', openaiError);
      console.log(`[분석] 실패: OpenAI 에러 (${openaiError.message})`);
      throw new Error(`OpenAI API error: ${openaiError.message}`);
    }

    const aiResponse = completion?.choices?.[0]?.message?.content || 'Unable to generate analysis';
    res.json({ result: aiResponse });

  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Analysis error',
      details: error.message,
      stack: error.stack
    });
  }
}


app.get('/analyze', analyzeHandler);
app.post('/analyze', analyzeHandler);

// 월간 분석 엔드포인트 추가
app.post('/analyze-monthly', async (req, res) => {
  console.log('==============================');
  console.log('[월간분석] analyze-monthly 요청 수신');
  console.log('[월간분석] body:', req.body);
  // 월간 분석은 항상 from/to만 전달
  // 프론트엔드에서 from/to만 보내는 경우 그대로 사용
  // range는 절대 추가하지 않음
  // 분석 결과를 받아서 별도 로그 남김
  // analyzeHandler가 res.json()을 직접 호출하므로, 결과를 가로채려면 래핑 필요
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    console.log('[월간분석] 분석 결과:', data);
    console.log('==============================');
    return originalJson(data);
  };
  await analyzeHandler(req, res);
});

// Chatbot endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, user = 'test_user' } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messageId = uuidv4();
    await supabase.from('chat_messages').insert({
      id: messageId,
      user,
      message: message.trim()
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI assistant specializing in emotional care. You must always respond in Korean language with a warm and friendly tone. Never use English in your responses. Show empathy and provide advice on emotional wellbeing, stress management, and mental health.'
        },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I cannot generate a response';

    await supabase.from('chat_messages').insert({
      id: uuidv4(),
      user: 'ai',
      message: aiResponse,
      parent_message_id: messageId
    });

    res.send(aiResponse);

  } catch (error) {
    res.status(500).json({ 
      error: 'Chatbot error',
      details: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /record',
      'GET|POST /analyze',
      'POST /chat'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET  / (Server status)');
  console.log('- GET  /health (Health check)');
  console.log('- POST /record (Save record)');
  console.log('- GET|POST /analyze (Analyze records)');
  console.log('- POST /chat (Chatbot)');
});
