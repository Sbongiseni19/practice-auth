# QueryCrest - Secure Token & Session Handling Practice

This repository contains a proof-of-concept for migrating from JavaScript-accessible bearer tokens (sessionStorage) to secure, server-issued HttpOnly cookies with CSRF protection.

## Architecture
- **Frontend (`/public`)**: Vanilla HTML/JS. No tokens are ever saved to `sessionStorage` or `localStorage`.
- **Backend (`/server`)**: Node.js/Express gateway. Issues HttpOnly cookies and validates CSRF tokens.

## Security Features Implemented
1. **HttpOnly Cookies**: Session tokens are strictly hidden from frontend JavaScript.
2. **CSRF Protection**: Double-submit cookie pattern (`csrf_token` cookie + `X-CSRF-Token` header).
3. **Environment Aware**: Cookies automatically add the `Secure` flag when `NODE_ENV=production`.
4. **No JS Token Storage**: Auth is handled entirely by browser cookie management.

## Local Setup
1. Navigate to `/server` and run `npm install`.
2. Run `node index.js`.
3. Open `http://localhost:8080`.
4. Log in with Username: `App` and Password: `123`.

## Deployment (DigitalOcean)
Set the environment variable `NODE_ENV=production` in your App Platform settings to enforce HTTPS-only cookies.