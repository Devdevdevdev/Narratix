# Installation

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- A DeepSeek API key

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

The backend starts on:

```text
http://127.0.0.1:5000
```

Check it with:

```bash
curl http://127.0.0.1:5000/api/health
```

## Frontend

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

## Optional Backend Key

If you want the backend to provide the key for local use, edit `backend/.env`:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

If you prefer entering the key in the UI, leave this empty.
