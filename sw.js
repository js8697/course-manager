// 더 시에나 서울CC 코스관리 — Service Worker
// 버전을 올리면 캐시가 갱신됩니다
const CACHE_NAME = 'siena-course-v1';

const CACHE_URLS = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js@4',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
];

// 설치 — 핵심 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn('캐시 일부 실패 (정상):', err);
      });
    })
  );
  self.skipWaiting();
});

// 활성화 — 구버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// fetch — Network First (항상 최신 데이터), 실패 시 캐시 반환
self.addEventListener('fetch', event => {
  // Supabase API 요청은 캐시하지 않음
  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('open-meteo.com') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공하면 캐시에도 저장
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // 오프라인이면 캐시에서 반환
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // 오프라인 + 캐시 없으면 기본 페이지
          return caches.match('/index.html');
        });
      })
  );
});

// 백그라운드 메시지 (선택적 알림 기능용)
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
