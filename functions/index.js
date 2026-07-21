/* Us. — v2 Cloud Function
   Fires when a tap doc is created, pushes to the *other* person's
   devices, prunes dead tokens, and cleans up taps older than a day. */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const NAMES = { shane: "Shane", molly: "Molly" };
const APP_URL = "https://shanemsap-lab.github.io/Us-Hub/";

exports.sendTap = onDocumentCreated("taps/{tapId}", async (event) => {
  const tap = event.data && event.data.data();
  if (!tap || !NAMES[tap.who]) return;

  const to = tap.who === "shane" ? "molly" : "shane";
  const db = getFirestore();
  const pushDoc = await db.doc("hub/push").get();
  const tokens = (pushDoc.exists && pushDoc.data()[to]) || [];
  if (tokens.length === 0) {
    console.log(`No push tokens for ${to} yet — tap stored, nothing sent.`);
    return;
  }

  const result = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "Us. 💓",
      body: `${NAMES[tap.who]} is thinking of you`,
    },
    webpush: {
      headers: { Urgency: "high", TTL: "3600" },
      fcmOptions: { link: APP_URL },
    },
  });

  // Drop tokens for devices that no longer exist (reinstalls, resets)
  const dead = [];
  result.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument") {
      dead.push(tokens[i]);
    }
  });
  if (dead.length) {
    await db.doc("hub/push").update({ [to]: FieldValue.arrayRemove(...dead) });
  }

  // Keep the taps collection tiny
  const old = await db.collection("taps")
    .where("ts", "<", Date.now() - 24 * 60 * 60 * 1000)
    .limit(50).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));

  console.log(`Tap from ${tap.who} → ${to}: ${result.successCount} sent, ${result.failureCount} failed.`);
});
