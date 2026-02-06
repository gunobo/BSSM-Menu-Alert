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

// ✅ 백그라운드 메시지 수신 시 시스템 알림을 생성합니다.
messaging.onBackgroundMessage((payload) => {
  console.log('[sw] 백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification.title || "BSSM 급식 알리미";
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png', // 실제 경로에 맞는 아이콘 파일명
    badge: '/logo192.png',
    data: payload.data // 클릭 시 이동할 경로를 위해 보관
  };

  // 🔔 브라우저에게 알림 팝업을 띄우라고 명령함
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ 알림 클릭 시 해당 페이지로 이동하는 로직 추가
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetDate = event.notification.data?.targetDate;
  const urlToOpen = targetDate ? `/?date=${targetDate}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});