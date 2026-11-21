// localStorage 키 (API 명세서 2-1)
const KEY = {
  profile: 'aissue.profile',
  push: 'aissue.pushSubscription',
  offline: 'aissue.offlineBundle',
};

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const getProfile = () => read(KEY.profile);
export const saveProfile = (p) => write(KEY.profile, p);
export const getPushSubscription = () => read(KEY.push);
export const savePushSubscription = (s) => write(KEY.push, s);
export const getOfflineBundle = () => read(KEY.offline);
export const saveOfflineBundle = (b) => write(KEY.offline, b);

// 마지막으로 받은(테스트 발송한) 재난문자: { alertId, receivedAt }
const LAST_RECEIVED = 'aissue.lastReceivedAlert';
export const getLastReceivedAlert = () => read(LAST_RECEIVED);
export const saveLastReceivedAlert = (alertId) =>
  write(LAST_RECEIVED, { alertId, receivedAt: new Date().toISOString() });

// 온보딩에서 고른 언어 (프로필 저장 전까지 임시 보관)
const DRAFT_LANGUAGE = 'aissue.draftLanguage';
export const getDraftLanguage = () => localStorage.getItem(DRAFT_LANGUAGE);
export const saveDraftLanguage = (lang) => localStorage.setItem(DRAFT_LANGUAGE, lang);
export const clearDraftLanguage = () => localStorage.removeItem(DRAFT_LANGUAGE);
