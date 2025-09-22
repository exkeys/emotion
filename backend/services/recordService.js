import { supabase } from '../config/database.js';


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

		const { data, error } = await supabase
			.from('records')
			.upsert({ user_id, date, fatigue, notes });

		// 분석 캐시 무효화(비차단)
		(async () => {
			try {
				const { getRedisClient } = await import('../config/redis.js');
				const redis = await getRedisClient();
				if (redis) {
					// 간단히 사용자 키 프리픽스 삭제(세분화 필요시 키 스캔)
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
