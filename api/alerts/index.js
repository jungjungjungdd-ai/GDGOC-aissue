import fs from 'fs';
import path from 'path';

// GET /api/alerts : 재난문자 목록 (최신순) - 명세서 3-1
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'GET 요청만 가능합니다.' },
    });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'alerts.json');
    const alerts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // 발령 시각 기준 최신순 정렬
    const items = [...alerts].sort(
      (a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)
    );

    return res.status(200).json({ dataStatus: 'mock', items });
  } catch (e) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: '재난문자를 불러오지 못했습니다.' },
    });
  }
}