// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyC8mTc2ZECs9ZfGlAoHHUCjV_wHT2jz7xY",
    authDomain: "bssm-meal-alerter.firebaseapp.com",
    projectId: "bssm-meal-alerter",
    storageBucket: "bssm-meal-alerter.firebasestorage.app",
    messagingSenderId: "392151699714",
    appId: "1:392151699714:web:f8084fd2f21a94b725721b",
    measurementId: "G-34BMEBXNNQ"
});

const messaging = firebase.messaging();

// ✅ 백그라운드 메시지 수신 로직 보완
messaging.onBackgroundMessage((payload) => {
  console.log('[sw] 백그라운드 메시지 수신:', payload);

  // 1. notification 객체나 data 객체 어디서든 제목과 본문을 가져오도록 방어 로직 추가
  const title = payload.notification?.title || payload.data?.title || "BSSM 급식 알리미";
  const body = payload.notification?.body || payload.data?.body || "새로운 알림이 도착했습니다.";
  
  const notificationOptions = {
    body: body,
    icon: '/logo192.png', 
    badge: '/logo192.png',
    tag: 'meal-notification', // 동일 태그 알림은 하나로 묶음
    data: payload.data, // 클릭 시 이동할 경로 데이터 포함
    vibrate: [200, 100, 200], // 진동 패턴
  };

  // 🔔 브라우저 시스템 알림 강제 실행
  console.log('[sw] 알림 팝업 명령 실행');
  return self.registration.showNotification(title, notificationOptions);
});

// ✅ 알림 클릭 시 로직 개선
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // 서버에서 보낸 targetDate 데이터 추출
  const targetDate = event.notification.data?.targetDate;
  // 클릭 시 이동할 절대 경로 설정 (도메인이 다를 경우를 대비)
  const urlToOpen = targetDate ? `/?date=${targetDate}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // 1. 이미 열려있는 동일 페이지가 있다면 포커스
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. 열려있는 페이지가 없다면 새 창으로 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});