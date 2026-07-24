/* Background push handler — this is what lets a notification land on the
   home screen even when the app/tab is closed. Firebase's SDK finds this
   file automatically because registerPush() in index.html registers it at
   "./firebase-messaging-sw.js". Don't rename or move it. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Keep this in sync with the firebaseConfig block in index.html.
firebase.initializeApp({
  apiKey: "AIzaSyCdWsbhPYUbuCiOy3JSyCpMwwYnyU9NK3Y",
  authDomain: "us-hub-smmb.firebaseapp.com",
  projectId: "us-hub-smmb",
  storageBucket: "us-hub-smmb.firebasestorage.app",
  messagingSenderId: "130628007706",
  appId: "1:130628007706:web:e892da439302b402e61ea3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, tag } = payload.notification || payload.data || {};
  self.registration.showNotification(title || "Us.", {
    body: body || "Something new in your hub 💛",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: tag || "hub-update",
    vibrate: [80, 50, 80, 50, 140],
    data: { url: "./" },
  });
});

// Tapping the notification focuses/opens the app instead of just dismissing it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || "./");
    })
  );
});
