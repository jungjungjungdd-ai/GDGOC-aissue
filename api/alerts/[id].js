import fs from 'fs';
import path from 'path';

// GET /api/alerts/[id] : 재난문자 1건 - 명세서 3-2
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'GET 요청만 가능합니다.' },
    });
  }

  try {
    const { id } = req.query;
    const filePath = path.join(process.cwd(), 'data', 'alerts.json');
    const alerts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const alert = alerts.find((a) => a.id === id);

    if (!alert) {
      return res.status(404).json({
        error: { code: 'ALERT_NOT_FOUND', message: '해당 재난문자를 찾을 수 없습니다.' },
      });
    }

    return res.status(200).json({ dataStatus: 'mock', alert });
  } catch (e) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: '재난문자를 불러오지 못했습니다.' },
    });
  }
}