// SSE 비활성화: 나중에 사용할 수 있도록 기존 구현은 주석 처리하고,
// 동일 export 이름으로 501을 반환하는 핸들러만 유지합니다.

export function createChatStreamHandler() {
	return function disabledChatStreamHandler(req, res) {
		return res.status(501).json({ error: 'Streaming disabled', message: 'SSE chat stream is currently disabled.' });
	};
}

/*
import { openai } from '../config/openai.js';

function sseInit(res) {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders?.();
}

export function createChatStreamHandler() {
	return async function chatStreamHandler(req, res) {
		try {
			const { message, user = 'test_user' } = req.query;
			if (!message || !String(message).trim()) {
				return res.status(400).json({ error: 'Message is required' });
			}
			sseInit(res);
			const systemPrompt = '너는 따뜻하고 공감적인 한국어 상담사야. 항상 한국어로 짧고 친근하게 답하고, 감정 케어/스트레스 관리에 실질적인 조언을 제공해.';
			const stream = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: String(message).trim() }
				],
				max_tokens: 280,
				temperature: 0.6,
				stream: true
			});
			for await (const chunk of stream) {
				const delta = chunk?.choices?.[0]?.delta?.content;
				if (delta) {
					res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
				}
			}
			res.write('event: done\n');
			res.write('data: {}\n\n');
			res.end();
		} catch (e) {
			try {
				res.write(`event: error\n`);
				res.write(`data: ${JSON.stringify({ error: e?.message || 'stream error' })}\n\n`);
				res.end();
			} catch (_) {
				res.status(500).end();
			}
		}
	};
}
*/


