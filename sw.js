const CACHE_NAME = 'wara-kitchen-v1';

// 캐시할 파일 목록
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap',
];

// 설치 — 앱 첫 실행 시 파일들을 캐시에 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('일부 파일 캐시 실패 (정상):', err);
      });
    })
  );
  self.skipWaiting();
});

// 활성화 — 오래된 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 네트워크 요청 처리 — Cache First 전략
// 캐시에 있으면 캐시 사용, 없으면 네트워크 요청 후 캐시에 저장
self.addEventListener('fetch', event => {
  // POST 등 non-GET 요청은 무시
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // 유효한 응답만 캐시에 저장
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
          return response;
        })
        .catch(() => {
          // 오프라인 + 캐시 없을 때 index.html 반환
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
