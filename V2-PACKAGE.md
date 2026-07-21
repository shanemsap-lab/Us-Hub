# Us. v2 — Taps & Real Push

The upgrade the v1 README promised: a tap button that makes the other person's phone buzz from anywhere, lock screen included.

## What it feels like

You tap the 💓 on the Today tab. Two things happen at Molly's end within seconds: her iPhone gets a push notification — "Us. 💓 Shane is thinking of you" — even locked, even with the app closed. And if she happens to have the hub open, the whole screen pulses with an expanding ring in *your* teal. When she taps back, yours pulses terracotta. Each of you arrives in your own color, same as everywhere else in the app.

## What's in the package

| File | Status | What it does |
|---|---|---|
| `index.html` | modified | Tap button + pulse overlay, taps listener, FCM token registration, `VAPID_KEY` slot in the SETUP block |
| `firebase-messaging-sw.js` | new | Service worker — receives push while the app is closed, opens the hub when the banner is tapped |
| `functions/index.js` | new | Cloud Function: tap doc created → push sent to the other person, dead tokens pruned, taps >24h deleted |
| `functions/package.json` | new | Function dependencies (Node 20, firebase-admin, firebase-functions) |
| `firestore.rules` | modified | Adds the `taps` collection — append-only, your two emails only |
| `firebase.json` | new | Tells the Firebase CLI where the rules and function live |
| `manifest.json` + `icon-192/512.png` | new | Proper PWA manifest and app icons (two hearts, your two colors) — iOS web push wants this |
| `setup-v2.sh` | new | One command that does every scriptable step below |
| `README.md` | modified | The v1 "possible v2" notifications section is now the v2 setup guide |

## How it works

```
tap button ──▶ Firestore taps/{id} ──▶ Cloud Function sendTap
                     │                        │
                     ▼                        ▼
        her app open? full-screen      FCM push ──▶ service worker
        pulse via live snapshot            ──▶ lock-screen buzz
```

Two paths on purpose: the Firestore snapshot gives an instant in-app pulse with zero backend (works today, before any deploy), and the Cloud Function adds the closed-app push on top. Push tokens live in `hub/push`, one array per person, protected by the same email rules as everything else. The function cleans up after itself — dead device tokens get removed, old tap docs get deleted — so nothing grows forever.

## Order of operations

1. **Unzip over your local clone** of Us-Hub (replaces index.html, README, rules; adds the rest).
2. **Blaze plan** — Firebase console → gear → Usage and billing → Modify plan. Needs a card; two people tapping stays at $0 (free tier: 2M function calls/month).
3. **VAPID key** — console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair → paste into `VAPID_KEY` in index.html.
4. **Run the script** — `bash setup-v2.sh` from the repo root. It checks Node 20+, installs firebase-tools if needed, signs you in, installs function deps, deploys the function *and* the rules together, then commits and pushes to GitHub Pages.
5. **On each iPhone** — delete and re-add the app to the Home Screen (so iOS picks up the new service worker), open it, Today tab → **Turn on buzzes** → Allow.
6. **Send a tap.** If nothing buzzes: Firebase console → Functions → sendTap → Logs will say whether it found tokens for the other person.

## Costs and gotchas

- **Cost**: $0 in practice. Blaze just requires the card; you'd need to send hundreds of thousands of taps a month to owe anything. Set a budget alert in the console if you want a belt with those suspenders.
- **The permission prompt must come from the installed home-screen app**, not Safari — iOS only grants web push to installed PWAs (16.4+).
- **Notifications go to whichever devices opted in.** If one of you re-installs the app, just hit "Turn on buzzes" again — the old token gets pruned automatically the next time a tap fails to deliver to it.
- **Do Not Disturb / Focus modes** treat these like any other notification. If she's in a work Focus, the tap waits like everything else does.
