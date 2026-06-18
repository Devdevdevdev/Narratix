# Contributing

Thanks for improving Narratix.

## Local Setup

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Before Opening a Pull Request

Run:

```bash
python3 -m py_compile backend/app.py
cd frontend && npm run build
```

Keep pull requests focused. Do not commit `.env`, API keys, local build output, cache folders, or generated dependency directories.

## Code Style

- Prefer simple local-first behavior.
- Keep the DeepSeek API key out of logs.
- Keep the app usable without accounts, payments, remote databases, or hosted infrastructure.
