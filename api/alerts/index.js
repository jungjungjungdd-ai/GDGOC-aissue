import fs from 'fs';
import path from 'path';

// GET /api/alerts : 재난문자 목록 (최신순)
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 가능합니다.' });
  }

  // data/alerts.json 파일 읽기
  const filePath = path.join(process.cwd(), 'data', 'alerts.json');
  const alerts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // 발령 시각 기준 최신순 정렬
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)
  );

  res.status(200).json({ dataStatus: 'mock', alerts: sorted });
}