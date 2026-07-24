/* Cloud Function — the missing server-side half of push notifications.
   A browser can only show a notification while its own tab/app is open (that's
   what index.html's foreground Notification() calls do). To land a push on the
   HOME SCREEN when the app is closed, something with server credentials has to
   call Firebase Cloud Messaging — that can't happen from index.html itself, so
   this function does it, running on Firebase's servers, triggered whenever a
   partner adds something.

   Deploy once with the Firebase CLI:
     npm install -g firebase-tools   (if you don't have it)
     firebase login
     firebase init functions        (pick this project, JavaScript, this folder)
     firebase deploy --only functions

   Needs the paid-but-effectively-free "Blaze" plan (Cloud Functions require it;
   a couple of people tapping a heart all day costs fractions of a cent). */
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

initializeApp();
const db = getFirestore();

const PEOPLE = { shane: "Shane", molly: "Molly" };

async function notifyPartner(who, title, body, tag) {
  const pushDoc = await db.doc("hub/push").get();
  const tokenMap = pushDoc.exists ? pushDoc.data() : {};
  const partner = who === "shane" ? "molly" : "shane";
  const tokens = tokenMap[partner] || [];
  if (!tokens.length) return;
  const stale = [];
  await Promise.all(tokens.map(async (token) => {
    try {
      await getMessaging().send({
        token,
        notification: { title, body },
        webpush: { fcmOptions: { link: "/" }, notification: { icon: "/icon-192.png", tag, vibrate: [80, 50, 80, 50, 140] } },
      });
    } catch (e) {
      if (e.code === "messaging/registration-token-not-registered") stale.push(token);
    }
  }));
  if (stale.length) {
    const { FieldValue } = require("firebase-admin/firestore");
    await db.doc("hub/push").set({ [partner]: FieldValue.arrayRemove(...stale) }, { merge: true });
  }
}

exports.onTap = onDocumentCreated("taps/{id}", async (event) => {
  const t = event.data.data();
  await notifyPartner(t.who, "Us. 💌", t.caption ? `${PEOPLE[t.who]}: "${t.caption}"` : `${PEOPLE[t.who]} sent you a tap 💓`, "tap");
});

exports.onActivity = onDocumentCreated("activity/{id}", async (event) => {
  const a = event.data.data();
  await notifyPartner(a.who, "Us. 💛", `${PEOPLE[a.who]} ${a.text}`, "activity");
});

exports.onComment = onDocumentCreated("comments/{id}", async (event) => {
  const c = event.data.data();
  await notifyPartner(c.who, "Us. 💬", `${PEOPLE[c.who]}: "${c.text.slice(0, 80)}"`, "comment");
});
