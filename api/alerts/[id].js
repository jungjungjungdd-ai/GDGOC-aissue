import fs from 'fs';
import path from 'path';

// GET /api/alerts/[id] : 재난문자 1건
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 가능합니다.' });
  }

  const { id } = req.query; // 주소의 [id] 자리에 들어온 값

  const filePath = path.join(process.cwd(), 'data', 'alerts.json');
  const alerts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return res.status(404).json({ error: '해당 재난문자를 찾을 수 없습니다.' });
  }

  res.status(200).json({ dataStatus: 'mock', alert });
}