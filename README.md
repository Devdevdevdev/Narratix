# Narratix

Narratix is an open source local app for generating social media content with DeepSeek.

It runs on your machine, does not require an account, and does not include payments, subscriptions, Supabase, Stripe, Firebase, admin dashboards, or token systems. You can paste your own DeepSeek API key in the interface, or configure it in the backend `.env`.

## Features

- Local React interface.
- Local Flask backend.
- DeepSeek chat generation.
- Platforms: Twitter/X, LinkedIn, Facebook, Reddit.
- Content modes: generate a post or write a reply.
- 75 restored Narratix tones, grouped by category.
- Tone and length controls.
- Local generation history in the browser.
- Optional dark mode.
- No remote database.
- No authentication.

## Requirements

- Python 3.11+
- Node.js 20+
- npm
- A DeepSeek API key from https://platform.deepseek.com/

## Quick Start

Clone the repository and install the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

In another terminal, install and start the frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

Paste your DeepSeek API key in the interface and generate your first post.

## DeepSeek Configuration

You have two options.

Option 1: paste the key in the app UI.

The key is sent to your local backend for each generation request. If you enable storage, it is saved in your browser `localStorage`.

Option 2: configure the backend `.env`.

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
PORT=5000
```

If `DEEPSEEK_API_KEY` is set in `backend/.env`, users can leave the key field empty in the UI.

## Project Structure

```text
backend/
  app.py
  requirements.txt
  .env.example

frontend/
  src/
    App.jsx
    main.jsx
    index.css
  package.json
  .env.example
```

## Development Commands

Backend:

```bash
cd backend
python app.py
```

Frontend:

```bash
cd frontend
npm run dev
```

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax check:

```bash
python3 -m py_compile backend/app.py
```

## Troubleshooting

If the frontend cannot reach the backend, check that Flask is running on `http://127.0.0.1:5000`.

If you changed the backend port, update `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

If DeepSeek returns an error, verify that your API key is valid and that your DeepSeek account has available credit.

## Security Notes

- Do not commit `.env` files.
- Do not share screenshots containing your API key.
- Browser storage is convenient but not secret storage; disable "Stocker la clé" if you prefer to paste the key each session.
- The backend never writes your DeepSeek key to disk.

## License

MIT. See [LICENSE](LICENSE).
