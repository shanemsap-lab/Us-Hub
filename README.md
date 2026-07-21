# Us. — a two-person hub

A single-file web app for Shane + Molly: countdown to the next visit, savings goals, joint bills, house hunting, shared lists, trips, comments, and a live activity feed. Real-time sync through Firebase, hosted free on GitHub Pages.

Setup is about 15 minutes, one time. Do it in this order.

## 1. Create the Firebase project (the shared brain)

1. Go to https://console.firebase.google.com and sign in with your Gmail.
2. **Add project** → name it anything (`us-hub`) → Google Analytics off → Create.
3. In the left sidebar: **Build → Firestore Database → Create database** → choose a US region → start in **production mode**.
4. Sidebar: **Build → Authentication → Get started** → Sign-in method → enable **Google** → save.
5. Click the **gear icon → Project settings**. Under "Your apps," click the **`</>` (web)** icon, register the app (no hosting needed), and copy the `firebaseConfig` block it shows you.

## 2. Configure index.html

Already done in this copy — the Firebase config and both Gmail addresses are baked into the SETUP block at the top of the `<script>` in `index.html`. If an email ever changes, that block is where to edit.

## 3. Lock the database to just you two

In Firebase: **Firestore Database → Rules**, replace everything with this (using your real emails), then Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hub/{docId} {
      allow read, write: if request.auth != null
        && request.auth.token.email in [
          'shanemsap@gmail.com',
          'mollymaclaughlin@gmail.com'
        ];
    }
  }
}
```

This matters: your GitHub repo is public, so the Firebase config in it is public too. That's fine and normal — the config isn't a secret — but these rules are what actually stop anyone else from touching your data. With them in place, only your two signed-in Google accounts can read or write anything.

## 4. Put it on GitHub Pages

1. Create a new repo (e.g. `Us-Hub`) and push `index.html` (and this README) to it.
2. Repo → **Settings → Pages** → Source: "Deploy from a branch" → branch `main`, folder `/ (root)` → Save.
3. Your app lives at `https://shanemsap-lab.github.io/Us-Hub/` within a minute or two.

## 5. Authorize the domain + install on your phones

1. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain** → add `shanemsap-lab.github.io`. (Without this, Google sign-in will refuse to run from your Pages URL.)
2. On each iPhone: open the URL in Safari → Share → **Add to Home Screen**. It behaves like an app from there.
3. Sign in with Google on each phone. Done — everything syncs live between you.

## How notifications work (v2 — real push!)

- **Taps**: the 💓 button on the Today tab sends a tap. The other person's phone gets a real push notification — locked screen, closed app, doesn't matter — and if they have the app open, a full-screen pulse in your color.
- The 🔔 bell still shows a badge counting everything the other person has done since you last checked, and foreground banners still work as before.

### One-time push setup (~20 min)

1. **Upgrade to Blaze**: Firebase console → gear → Usage and billing → Modify plan → Blaze. Requires a card, but two people tapping will stay at $0 — the free tier includes 2M function calls/month.
2. **Get the VAPID key**: Project settings → **Cloud Messaging** → Web configuration → **Web Push certificates** → Generate key pair. Copy the key.
3. **Paste it** into `VAPID_KEY` in the SETUP block at the top of `index.html`. Commit and push.
4. **Update Firestore rules**: console → Firestore → Rules → paste the contents of `firestore.rules` from this repo → Publish. (v2 adds a `taps` collection.)
5. **Deploy the function** from a machine with Node 20+:
   ```
   npm install -g firebase-tools
   firebase login
   cd Us-Hub && firebase use us-hub-smmb
   cd functions && npm install && cd ..
   firebase deploy --only functions
   ```
6. **On each iPhone**: open the installed home-screen app → Today tab → tap **"Turn on buzzes"** → Allow. (If you'd enabled alerts before, delete and re-add the app to the Home Screen first so iOS picks up the new service worker cleanly.)
7. Send a tap. The other phone should buzz within a couple seconds.

### How the pieces fit

```
tap button ──▶ Firestore taps/{id} ──▶ Cloud Function sendTap
                     │                        │
                     ▼                        ▼
        other phone's app open?      FCM push ──▶ firebase-messaging-sw.js
        pulse via live snapshot            ──▶ lock-screen notification
```

Push tokens live in `hub/push` (one array per person, auto-pruned when a device disappears). Tap docs older than 24h are cleaned up automatically.

## Troubleshooting

- **Sign-in popup does nothing on iPhone**: the app falls back to a redirect automatically; if it still fails, check step 5.1 (authorized domains).
- **"isn't on the list" after signing in**: the Gmail you used isn't in `EMAILS` in index.html, or has different casing. Fix, commit, push.
- **Permission errors in the console**: your Firestore rules emails don't match the accounts you signed in with.
- **Changes not syncing**: both phones need to be signed in and online; the app has no offline queue in v1.
