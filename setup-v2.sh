#!/usr/bin/env bash
# ============================================================
# Us. v2 — one-command setup
# Run from the repo root:  bash setup-v2.sh
#
# Handles: tool checks, firebase login, function deps,
# deploying the function + firestore rules, git commit & push.
# Leaves for you: Blaze upgrade, VAPID key paste, phone opt-in.
# ============================================================
set -euo pipefail

PROJECT="us-hub-smmb"
bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$*"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$*"; }
die()  { printf "  \033[31m✗\033[0m %s\n" "$*"; exit 1; }

bold "Us. v2 setup"

# --- 0. Right directory? ---------------------------------------------------
[[ -f index.html && -f functions/index.js ]] || die "Run this from the Us-Hub repo root (index.html + functions/ not found here)."

# --- 1. VAPID key pasted? --------------------------------------------------
if grep -q 'PASTE_VAPID_KEY' index.html; then
  warn "VAPID_KEY in index.html is still the placeholder."
  echo "    Get it: Firebase console → Project settings → Cloud Messaging →"
  echo "    Web Push certificates → Generate key pair. Paste it into the"
  echo "    SETUP block in index.html, then re-run this script."
  read -rp "  Continue anyway and deploy the backend now? [y/N] " cont
  [[ "${cont:-n}" =~ ^[Yy]$ ]] || exit 0
else
  ok "VAPID key is set in index.html"
fi

# --- 2. Node 20+ -----------------------------------------------------------
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if (( NODE_MAJOR >= 20 )); then
    ok "Node $(node -v)"
  else
    die "Node 20+ required (you have $(node -v)). Install from https://nodejs.org or: brew install node@20"
  fi
else
  die "Node isn't installed. Install from https://nodejs.org or: brew install node"
fi

# --- 3. firebase-tools -----------------------------------------------------
if ! command -v firebase >/dev/null 2>&1; then
  warn "firebase-tools not found — installing globally via npm…"
  npm install -g firebase-tools
fi
ok "firebase-tools $(firebase --version)"

# --- 4. Login + project ----------------------------------------------------
if ! firebase projects:list >/dev/null 2>&1; then
  bold "Signing in to Firebase (browser will open)…"
  firebase login
fi
firebase use "$PROJECT" >/dev/null
ok "Using project $PROJECT"

# --- 5. Function dependencies ---------------------------------------------
bold "Installing function dependencies…"
( cd functions && npm install --no-audit --no-fund )
ok "Dependencies installed"

# --- 6. Deploy -------------------------------------------------------------
bold "Deploying Cloud Function + Firestore rules…"
if ! firebase deploy --only functions,firestore:rules; then
  echo ""
  warn "Deploy failed. Most common cause: the project isn't on the Blaze plan yet."
  echo "    Fix: Firebase console → gear icon → Usage and billing → Modify plan → Blaze."
  echo "    (Free tier covers you — two people tapping stays at \$0.) Then re-run this script."
  exit 1
fi
ok "Backend deployed"

# --- 7. Push the frontend to GitHub Pages ----------------------------------
if [[ -d .git ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    bold "Committing and pushing to GitHub Pages…"
    git add -A
    git commit -m "v2: taps + real push notifications"
    git push
    ok "Pushed — GitHub Pages updates within a minute or two"
  else
    ok "Git working tree clean — nothing new to push"
  fi
else
  warn "No .git folder here — copy these files into your cloned repo and push manually."
fi

# --- Done ------------------------------------------------------------------
echo ""
bold "Backend done. Three things left, on the phones + console:"
echo "  1. Blaze plan (if the deploy step didn't already confirm it's on)"
echo "  2. VAPID key in index.html (if the check above warned you)"
echo "  3. On each iPhone: delete + re-add the app to the Home Screen,"
echo "     open it, Today tab → 'Turn on buzzes' → Allow. Then send a tap."
