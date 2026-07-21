/* Us. — push service worker (v2)
   Receives taps while the app is closed and shows the notification.
   Must live at the repo root next to index.html. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCdWsbhPYUbuCiOy3JSyCpMwwYnyU9NK3Y",
  authDomain: "us-hub-smmb.firebaseapp.com",
  projectId: "us-hub-smmb",
  storageBucket: "us-hub-smmb.firebasestorage.app",
  messagingSenderId: "130628007706",
  appId: "1:130628007706:web:e892da439302b402e61ea3",
});

// Initializing messaging is what wires this worker up to display
// incoming "notification" payloads automatically.
firebase.messaging();

// Tapping the banner opens (or focuses) the hub.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes("Us-Hub") && "focus" in w) return w.focus();
      }
      return clients.openWindow("./");
    })
  );
});
