# Security Policy

Narratix is designed to run locally with the user's own DeepSeek API key.

## Reporting a Vulnerability

Open a private report or contact the maintainers. Do not include API keys, tokens, `.env` contents, or other secrets in public issues.

## API Key Handling

- The frontend can store the DeepSeek key in browser `localStorage` only if the user enables it.
- The backend accepts a key per request or reads `DEEPSEEK_API_KEY` from `backend/.env`.
- The backend does not persist the key.
- The app must not log API keys.

## Supported Setup

The default supported setup is local development on `127.0.0.1` / `localhost`.
