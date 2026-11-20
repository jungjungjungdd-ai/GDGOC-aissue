import { useSyncExternalStore } from 'react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// 인터넷 연결 상태 (true = 온라인)
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
