import fs from 'fs';
import path from 'path';
import * as webpush from 'web-push';

// POST /api/push/test : 테스트 재난 푸시 발송 - 명세서 4-3

// 오류 응답 (명세서 1-2 형식)
function sendError(res, status, code, message, field) {
  const error = { code, message };
  if (field) error.field = field;
  return res.status(status).json({ error });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'POST 요청만 가능합니다.');
  }

  // 1. 요청 본문 읽기 (JSON이 깨져 있으면 400)
  let body;
  try {
    body = req.body || {};
  } catch (e) {
    return sendError(res, 400, 'VALIDATION_ERROR', '요청 형식이 올바른 JSON이 아닙니다.');
  }

  const { alertId, subscription } = body;

  // 2. 필수 값 확인
  if (!alertId) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'alertId가 필요합니다.', 'alertId');
  }
  if (!subscription || !subscription.endpoint) {
    return sendError(res, 400, 'VALIDATION_ERROR', '구독 정보(endpoint)가 필요합니다.', 'subscription.endpoint');
  }
  if (!subscription.keys || !subscription.keys.p256dh) {
    return sendError(res, 400, 'VALIDATION_ERROR', '구독 키(p256dh)가 필요합니다.', 'subscription.keys.p256dh');
  }
  if (!subscription.keys.auth) {
    return sendError(res, 400, 'VALIDATION_ERROR', '구독 키(auth)가 필요합니다.', 'subscription.keys.auth');
  }

  // 3. 재난문자 찾기
  let alert;
  try {
    const filePath = path.join(process.cwd(), 'data', 'alerts.json');
    const alerts = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    alert = alerts.find((a) => a.id === alertId);
  } catch (e) {
    return sendError(res, 500, 'SERVER_ERROR', '재난문자를 불러오지 못했습니다.');
  }

  if (!alert) {
    return sendError(res, 404, 'ALERT_NOT_FOUND', '해당 재난문자를 찾을 수 없습니다.');
  }

  // 4. VAPID 키 확인 (비밀 키는 응답·로그에 절대 넣지 않기!)
  // 환경변수에 붙여 넣다 들어간 공백·줄바꿈 제거
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) {
    return sendError(res, 500, 'SERVER_ERROR', '푸시 키가 설정되지 않았습니다.');
  }

  // 연락처: 푸시 서비스가 문제 있을 때 연락할 주소 (팀 이메일로 바꿔도 됨)
      try {
    webpush.setVapidDetails('mailto:aissue.team@example.com', publicKey, privateKey);
  } catch (e) {
    return sendError(res, 500, 'SERVER_ERROR', '푸시 키 형식이 올바르지 않습니다.');
  }

  // 5. 서비스워커가 받을 내용 (명세서 4-3 payload)
  const payload = JSON.stringify({
    title: alert.title,
    body: alert.message,
    url: `/alerts/${alert.id}/location`,
  });

  // 6. 발송
  try {
    await webpush.sendNotification(subscription, payload);
    return res.status(200).json({ sent: true });
  } catch (err) {
    // 404, 410: 구독이 만료됐거나 없어짐 → 화면에서 다시 구독해야 함
    if (err.statusCode === 404 || err.statusCode === 410) {
      return sendError(res, 410, 'SUBSCRIPTION_EXPIRED', '푸시 구독이 만료되었습니다. 다시 구독해 주세요.');
    }
    console.error('푸시 발송 실패, 상태 코드:', err.statusCode);
    return sendError(res, 500, 'SERVER_ERROR', '알림 발송에 실패했습니다.');
  }
}