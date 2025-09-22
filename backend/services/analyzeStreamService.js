// SSE 비활성화: 나중에 사용할 수 있도록 기존 구현은 주석 처리하고,
// 동일 export 이름으로 501을 반환하는 핸들러만 유지합니다.

export function createAnalyzeStreamHandler() {
	return function disabledAnalyzeStreamHandler(req, res) {
		return res.status(501).json({ error: 'Streaming disabled', message: 'SSE analyze stream is currently disabled.' });
	};
}

/*
import { openai } from '../config/openai.js';
import { supabase } from '../config/database.js';
import dayjs from 'dayjs';

function sseInit(res) {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders?.();
}

function formatDataForAnalysis(data) {
	return data
		.sort((a, b) => new Date(a.date) - new Date(b.date))
		.map(row => {
			const fatigue = Number(row.fatigue);
			let fatigueText;
			if (Number.isFinite(fatigue)) {
				if (fatigue >= 9) fatigueText = '극도로 피곤';
				else if (fatigue >= 7) fatigueText = '매우 피곤';
				else if (fatigue >= 5) fatigueText = '보통 수준의 피곤';
				else if (fatigue >= 3) fatigueText = '약간 피곤';
				else fatigueText = '전혀 피곤하지 않음';
			} else {
				fatigueText = '알 수 없음';
			}
			return `${row.date}: 피곤함 ${fatigue}점(${fatigueText}) (${row.notes?.trim() || '기록 없음'})`;
		})
		.join('\n');
}

export function createAnalyzeStreamHandler() {
	return async function analyzeStreamHandler(req, res) {
		try {
			const { from, to, user_id = 'test_user' } = req.query;
			if (!from || !to) return res.status(400).json({ error: 'from/to required' });
			sseInit(res);
			const { data, error } = await supabase
				.from('records')
				.select('date, fatigue, notes')
				.eq('user_id', user_id)
				.gte('date', String(from))
				.lte('date', String(to))
				.order('date', { ascending: true });
			if (error || !data?.length) {
				res.write(`event: error\n`);
				res.write(`data: ${JSON.stringify({ error: error?.message || 'no data' })}\n\n`);
				return res.end();
			}
			const formatted = formatDataForAnalysis(data);
			const systemPrompt = '너는 따뜻하고 공감적인 한국어 상담사야. 항상 한국어로 짧고 친근하게 요약하고, 패턴/변화/개선 제안을 제공해. 숫자가 클수록 더 피곤함(1=전혀, 10=극도로).';
			const userPrompt = `사용자 피곤함 기록(1~10, 높을수록 피곤):\n${formatted}\n\n패턴(증가/감소), 잠재 요인, 개선 제안을 3~4문장으로 요약해줘.`;
			const stream = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				],
				max_tokens: 260,
				temperature: 0.6,
				stream: true
			});
			for await (const chunk of stream) {
				const delta = chunk?.choices?.[0]?.delta?.content;
				if (delta) res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
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


