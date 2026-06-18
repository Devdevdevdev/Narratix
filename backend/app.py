import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI


load_dotenv()

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:4173",
                "http://127.0.0.1:4173",
            ]
        }
    },
)

DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
SERVER_DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")

PLATFORM_LIMITS = {
    "TWITTER": {"short": 280, "long": 2000},
    "LINKEDIN": {"short": 500, "medium": 2000, "long": 5000},
    "FACEBOOK": {"short": 300, "medium": 2000, "long": 4000},
    "REDDIT": {"short": 500, "medium": 2000, "long": 5000},
}


def get_request_api_key(data):
    api_key = (data or {}).get("api_key") or request.headers.get("X-DeepSeek-API-Key")
    return api_key or SERVER_DEEPSEEK_API_KEY


def build_prompt(data, max_chars):
    text = data.get("text", "").strip()
    platform = data.get("template") or data.get("platform") or "TWITTER"
    tone = data.get("tone") or "Professionnel"
    action = data.get("content_type") or "generate"
    language = data.get("language") or "fr"

    output_language = "French" if language == "fr" else "English"
    action_instruction = (
        f"Write an original social media post optimized for {platform}."
        if action == "generate"
        else f"Write a useful and engaging reply optimized for {platform}."
    )
    source_label = "Topic or brief" if action == "generate" else "Original content to answer"

    return f"""
You are Narratix, an AI assistant specialized in social media writing.

Language:
- Respond only in {output_language}.
- Ignore the language of the input if it differs from {output_language}.

Task:
- {action_instruction}
- Use a natural {tone} tone.
- Stay under {max_chars} characters, including spaces, line breaks, emojis and hashtags.
- Do not use Markdown bold or italic markers.
- Return only the final content, with no explanation before or after it.

{source_label}:
{text}
""".strip()


def extract_content(response):
    if not response or not response.choices:
        return ""

    message = response.choices[0].message
    content = getattr(message, "content", None)

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                parts.append(item.get("text") or item.get("content") or "")
            else:
                parts.append(getattr(item, "text", "") or getattr(item, "content", "") or "")
        return "".join(parts).strip()

    return ""


@app.get("/")
def root():
    return jsonify({"name": "Narratix", "status": "running"})


@app.get("/health")
@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "deepseek_configured": bool(SERVER_DEEPSEEK_API_KEY),
            "model": DEEPSEEK_MODEL,
        }
    )


@app.get("/api/config")
def config():
    return jsonify(
        {
            "server_api_key_configured": bool(SERVER_DEEPSEEK_API_KEY),
            "model": DEEPSEEK_MODEL,
        }
    )


@app.post("/api/generate")
def generate_content():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Le texte est obligatoire."}), 400

    api_key = get_request_api_key(data)
    if not api_key:
        return jsonify({"error": "Ajoutez une clé API DeepSeek dans l'interface ou dans backend/.env."}), 400

    platform = data.get("template") or data.get("platform") or "TWITTER"
    length_key = data.get("length") or "short"
    length_config = data.get("length_config") or {}
    requested_max_chars = length_config.get("maxChars")
    max_chars = requested_max_chars or PLATFORM_LIMITS.get(platform, {}).get(length_key, 500)

    try:
        max_chars = int(max_chars)
    except (TypeError, ValueError):
        max_chars = 500

    prompt = build_prompt(data, max_chars)

    try:
        client = OpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)
        response = client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You write polished social media content. Return only the final answer.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=1600,
            temperature=0.7,
        )
        generated_content = extract_content(response)

        if not generated_content:
            return jsonify({"error": "DeepSeek a renvoyé une réponse vide. Réessayez."}), 502

        if len(generated_content) > max_chars:
            generated_content = generated_content[: max_chars - 1].rstrip() + "…"

        return jsonify(
            {
                "result": generated_content,
                "length": len(generated_content),
                "max_length": max_chars,
                "model": DEEPSEEK_MODEL,
            }
        )
    except Exception as exc:
        app.logger.exception("DeepSeek generation failed")
        return jsonify({"error": f"Erreur DeepSeek: {str(exc)}"}), 502


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") != "production")
