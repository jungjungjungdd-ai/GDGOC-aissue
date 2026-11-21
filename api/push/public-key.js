// GET /api/push/public-key : 푸시 공개 키 - 명세서 4-2
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'GET 요청만 가능합니다.' },
    });
  }

  // 환경변수에 붙여 넣다 들어간 공백·줄바꿈 제거
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();

  if (!publicKey) {
    return res.status(500).json({
      error: { code: 'SERVER_ERROR', message: '푸시 공개 키가 설정되지 않았습니다.' },
    });
  }

  return res.status(200).json({ publicKey });
}