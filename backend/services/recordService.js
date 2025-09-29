
import { supabase } from '../config/database.js';
import { openai } from '../config/openai.js';



export async function handleRecordRequest(req, res) {
	try {
		const { user_id, date, fatigue, notes } = req.body;

		if (!user_id || !date || !fatigue) {
			return res.status(400).json({
				error: 'Missing required fields',
				required: ['user_id', 'date', 'fatigue']
			});
		}

		if (fatigue < 1 || fatigue > 10) {
			return res.status(400).json({
				error: 'Fatigue must be between 1-10'
			});
		}

		// notes가 있으면 감정 분석
		let emotion = null;
		if (typeof notes === 'string' && notes.trim().length > 0) {
			try {
				const prompt = `다음 텍스트(고민 내용)를 종합적으로 읽고, 가장 대표적인 감정 하나만 한글 단어(예: 행복, 우울, 분노, 스트레스, 불안, 평온, 보람 등)로 알려줘. 반드시 한 단어만 답해:\n"""\n${notes.trim()}\n"""`;
				   const completion = await openai.chat.completions.create({
					   model: 'gpt-4o-mini',
					   messages: [
						   { role: 'system', content: '너는 감정 분석가야. 반드시 한글 감정 단어 하나만 답해.' },
						   { role: 'user', content: prompt }
					   ],
					   max_tokens: 8,
					   temperature: 0.0
				   });
				   console.log('[OpenAI completion]', JSON.stringify(completion));
				   emotion = completion?.choices?.[0]?.message?.content?.trim().replace(/\n/g, '') || null;
				   // 한 단어만 추출(여분 텍스트 제거)
				   if (emotion && emotion.includes(' ')) {
					   emotion = emotion.split(' ')[0];
				   }
				   console.log('[Parsed emotion]', emotion);
			} catch (err) {
				// 감정 분석 실패 시 null 저장
				emotion = null;
			}
		}

		   const { data, error } = await supabase
			   .from('records')
			   .upsert({ user_id, date, fatigue, notes, emotion })
			   .select('*');

		// 분석 캐시 무효화(비차단)
		(async () => {
			try {
				const { getRedisClient } = await import('../config/redis.js');
				const redis = await getRedisClient();
				if (redis) {
					const prefix = `${user_id}:`;
					for await (const key of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
						await redis.del(key);
					}
				}
			} catch (_) {}
		})();

		if (error) {
			return res.status(500).json({ error: error.message });
		}

		res.json({ success: true, data });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
}
