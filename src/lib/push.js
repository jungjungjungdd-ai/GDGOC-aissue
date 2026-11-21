import { getPublicKey, sendTestPush } from './api.js';
import { getPushSubscription, savePushSubscription } from './storage.js';

// 이 브라우저가 웹 푸시를 지원하는지
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// 현재 알림 권한 상태: 'granted'(허용) / 'denied'(차단) / 'default'(아직 안 물어봄)
export function getPermission() {
  return isPushSupported() ? Notification.permission : 'unsupported';
}

// 공개 키(글자)를 브라우저가 원하는 형식(바이트 배열)으로 바꾸기
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// 서비스워커 준비 기다리기 (10초 안에 안 되면 포기)
function waitServiceWorker() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('no-sw')), 10000)),
  ]);
}

// 알림 권한 요청 → 구독 생성 → 폰에 저장
export async function enablePush() {
  if (!isPushSupported()) throw new Error('unsupported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('denied');

  const registration = await waitServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const { publicKey } = await getPublicKey();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  savePushSubscription(json);
  return json;
}

// 기존 구독을 지우고 새로 만들기 (구독이 만료됐을 때, 원격 링크를 끊을 때)
export async function resubscribe() {
  const registration = await waitServiceWorker();
  const old = await registration.pushManager.getSubscription();
  if (old) await old.unsubscribe();
  return enablePush();
}

// 테스트 재난 발송: 구독이 없으면 먼저 만들고, 만료됐으면 다시 만들어서 1번 더 시도
export async function sendTestAlert(alertId) {
  let subscription = getPushSubscription() ?? (await enablePush());

  try {
    return await sendTestPush(alertId, subscription);
  } catch (err) {
    if (err?.code === 'SUBSCRIPTION_EXPIRED' || err?.code === 'VALIDATION_ERROR') {
      subscription = await resubscribe();
      return sendTestPush(alertId, subscription);
    }
    throw err;
  }
}

// ── PC에서 이 폰으로 보내기 (시연용 원격 발송 링크) ──
// 구독 정보를 링크의 # 뒤에 담는다. # 뒤는 서버로 전송되지 않아서 서버·로그에 남지 않음.
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(text) {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export async function createRemoteLink() {
  const subscription = getPushSubscription() ?? (await enablePush());
  const { endpoint, keys } = subscription;
  return `${location.origin}/remote#s=${toBase64Url(JSON.stringify({ endpoint, keys }))}`;
}

// /remote#s=... 에서 구독 정보 꺼내기 (형식이 이상하면 null)
export function readRemoteSubscription(hash) {
  try {
    const raw = new URLSearchParams(hash.replace(/^#/, '')).get('s');
    const sub = raw && JSON.parse(fromBase64Url(raw));
    return sub?.endpoint && sub?.keys?.p256dh && sub?.keys?.auth ? sub : null;
  } catch {
    return null;
  }
}
