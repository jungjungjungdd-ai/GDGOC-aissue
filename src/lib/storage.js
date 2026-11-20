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
