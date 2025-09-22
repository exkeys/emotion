import { openai } from '../config/openai.js';
import { supabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';


export async function handleChatRequest(req, res) {
	try {
		const { message, user = 'test_user' } = req.body;
		const trimmed = typeof message === 'string' ? message.trim() : '';
		if (!trimmed) {
			return res.status(400).json({ error: 'Message is required' });
		}

		// 사용자 메시지 저장과 OpenAI 호출을 병렬 처리
		const messageId = uuidv4();
		const userInsertPromise = supabase
			.from('chat_messages')
			.insert({ id: messageId, user, message: trimmed }, { returning: 'minimal' })
			.then(() => null)
			.catch((e) => {
				console.error('User message insert error:', e?.message || e);
				return null;
			});

		const systemPrompt = '너는 따뜻하고 공감적인 한국어 상담사야. 항상 한국어로만 답하고, 영어 단어/등급 라벨(very good, okay 등)이나 내부 코드명을 쓰지 마. 짧고 친근하게 답하고, 감정 케어/스트레스 관리에 실질적인 조언을 제공해.';

		const aiCall = openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: trimmed }
			],
			max_tokens: 280,
			temperature: 0.6
		});

		// 소프트 타임아웃 후 폴백
		const softTimeoutMs = 12000;
		const softTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), softTimeoutMs));
		let completion;
		try {
			completion = await Promise.race([aiCall, softTimeout]);
		} catch (primaryErr) {
			console.warn('Primary AI call failed, trying fallback:', primaryErr?.message || primaryErr);
			try {
				completion = await openai.chat.completions.create({
					model: 'gpt-4o-mini',
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: trimmed }
					],
					max_tokens: 200,
					temperature: 0.6
				});
			} catch (fallbackErr) {
				await userInsertPromise;
				return res.status(502).json({ error: 'AI 응답 지연', details: fallbackErr?.message || primaryErr?.message });
			}
		}

		const aiResponse = completion?.choices?.[0]?.message?.content || '죄송해요, 지금은 응답을 생성할 수 없어요.';

		// 사용자에게 즉시 응답
		res.send(aiResponse);

		// AI 메시지 저장은 비동기 처리
		supabase
			.from('chat_messages')
			.insert({ id: uuidv4(), user: 'ai', message: aiResponse, parent_message_id: messageId }, { returning: 'minimal' })
			.then(() => null)
			.catch((e) => console.error('AI message insert error:', e?.message || e));

		userInsertPromise.catch(() => {});

	} catch (error) {
		console.error('Chatbot error:', error);
		res.status(500).json({ 
			error: 'Chatbot error',
			details: error.message 
		});
	}
}
