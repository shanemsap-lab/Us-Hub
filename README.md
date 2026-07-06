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

1. Create a new repo (e.g. `us-hub`) and push `index.html` (and this README) to it.
2. Repo → **Settings → Pages** → Source: "Deploy from a branch" → branch `main`, folder `/ (root)` → Save.
3. Your app lives at `https://shanemsap-lab.github.io/us-hub/` within a minute or two.

## 5. Authorize the domain + install on your phones

1. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain** → add `shanemsap-lab.github.io`. (Without this, Google sign-in will refuse to run from your Pages URL.)
2. On each iPhone: open the URL in Safari → Share → **Add to Home Screen**. It behaves like an app from there.
3. Sign in with Google on each phone. Done — everything syncs live between you.

## How notifications work

- The 🔔 bell shows a badge counting everything the other person has done since you last checked.
- Tap **enable alerts** in the feed to allow banner notifications while the app is open — since sync is live, you'll see her changes land in real time.
- True push notifications (phone buzzing while the app is closed) need a push server and Apple's web-push flow; that's a possible v2, not included here.

## Troubleshooting

- **Sign-in popup does nothing on iPhone**: the app falls back to a redirect automatically; if it still fails, check step 5.1 (authorized domains).
- **"isn't on the list" after signing in**: the Gmail you used isn't in `EMAILS` in index.html, or has different casing. Fix, commit, push.
- **Permission errors in the console**: your Firestore rules emails don't match the accounts you signed in with.
- **Changes not syncing**: both phones need to be signed in and online; the app has no offline queue in v1.
