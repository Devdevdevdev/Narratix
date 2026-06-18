import React, { useEffect, useMemo, useState } from 'react';
import logo from './assets/LOGO.png';
import { allTones, toneCategories } from './tones';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const PLATFORMS = {
  TWITTER: 'Twitter / X',
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  REDDIT: 'Reddit',
};

const LENGTHS = {
  TWITTER: {
    short: { label: 'Post court', maxChars: 280 },
    long: { label: 'Post long', maxChars: 2000 },
  },
  LINKEDIN: {
    short: { label: 'Post court', maxChars: 500 },
    medium: { label: 'Post moyen', maxChars: 2000 },
    long: { label: 'Article long', maxChars: 5000 },
  },
  FACEBOOK: {
    short: { label: 'Post court', maxChars: 300 },
    medium: { label: 'Post moyen', maxChars: 2000 },
    long: { label: 'Post long', maxChars: 4000 },
  },
  REDDIT: {
    short: { label: 'Commentaire court', maxChars: 500 },
    medium: { label: 'Post moyen', maxChars: 2000 },
    long: { label: 'Post long', maxChars: 5000 },
  },
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('narratix_theme') || 'dark');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('narratix_deepseek_api_key') || '');
  const [useStoredKey, setUseStoredKey] = useState(() => localStorage.getItem('narratix_store_key') !== 'false');
  const [serverConfig, setServerConfig] = useState({ server_api_key_configured: false, model: 'deepseek-chat' });
  const [platform, setPlatform] = useState('TWITTER');
  const [contentType, setContentType] = useState('generate');
  const [length, setLength] = useState('short');
  const [tone, setTone] = useState('professionnel');
  const [language, setLanguage] = useState('fr');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState(() => readStorage('narratix_generation_history', []));

  const lengthOptions = LENGTHS[platform];
  const currentLength = lengthOptions[length] ? length : 'short';
  const canGenerate = prompt.trim() && (apiKey.trim() || serverConfig.server_api_key_configured) && !isGenerating;

  const displayApiKeyHelp = useMemo(() => {
    if (serverConfig.server_api_key_configured) {
      return 'Une clé est déjà configurée côté backend. Le champ ci-dessous peut rester vide.';
    }
    return 'Votre clé DeepSeek est utilisée uniquement pour les appels locaux. Elle peut être stockée dans votre navigateur.';
  }, [serverConfig.server_api_key_configured]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('narratix_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('narratix_store_key', String(useStoredKey));
    if (useStoredKey) {
      localStorage.setItem('narratix_deepseek_api_key', apiKey);
    } else {
      localStorage.removeItem('narratix_deepseek_api_key');
    }
  }, [apiKey, useStoredKey]);

  useEffect(() => {
    localStorage.setItem('narratix_generation_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!LENGTHS[platform][length]) {
      setLength('short');
    }
  }, [platform, length]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/config`)
      .then((response) => response.json())
      .then(setServerConfig)
      .catch(() => setServerConfig({ server_api_key_configured: false, model: 'deepseek-chat' }));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Entrez une demande avant de générer.');
      return;
    }

    if (!apiKey.trim() && !serverConfig.server_api_key_configured) {
      setError('Ajoutez votre clé API DeepSeek ou configurez DEEPSEEK_API_KEY côté backend.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey.trim() || undefined,
          text: prompt.trim(),
          template: platform,
          platform,
          tone,
          content_type: contentType,
          length: currentLength,
          length_config: lengthOptions[currentLength],
          language,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      if (!data.result || typeof data.result !== 'string') {
        throw new Error('Le backend a répondu sans contenu généré.');
      }

      setResult(data.result);
      setHistory((previous) => [
        {
          id: Date.now(),
          prompt: prompt.trim(),
          result: data.result,
          platform,
          tone,
          length: currentLength,
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ].slice(0, 12));
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyResult = async (value = result) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  const resetForm = () => {
    setPrompt('');
    setResult('');
    setError('');
    setPlatform('TWITTER');
    setContentType('generate');
    setLength('short');
    setTone('professionnel');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Narratix" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Narratix</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Générateur local de contenu social avec DeepSeek</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {language === 'fr' ? 'FR' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? 'Clair' : 'Sombre'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[420px_1fr]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-semibold">Configuration DeepSeek</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{displayApiKeyHelp}</p>
            <label className="mb-2 block text-sm font-medium" htmlFor="api-key">Clé API DeepSeek</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={serverConfig.server_api_key_configured ? 'Déjà configurée côté backend' : 'Votre clé API DeepSeek'}
              className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={useStoredKey}
                onChange={(event) => setUseStoredKey(event.target.checked)}
              />
              Stocker la clé dans ce navigateur
            </label>
            <div className="mt-3 rounded bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Backend: {API_BASE_URL} · Modèle: {serverConfig.model || 'deepseek-chat'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold">Paramètres</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Plateforme</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PLATFORMS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlatform(key)}
                      className={`rounded px-3 py-2 text-sm font-medium ${platform === key ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Type de contenu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('generate')}
                    className={`rounded px-3 py-2 text-sm font-medium ${contentType === 'generate' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                  >
                    Générer
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('respond')}
                    className={`rounded px-3 py-2 text-sm font-medium ${contentType === 'respond' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                  >
                    Répondre
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Longueur</label>
                <div className="grid gap-2">
                  {Object.entries(lengthOptions).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLength(key)}
                      className={`flex justify-between rounded px-3 py-2 text-left text-sm font-medium ${currentLength === key ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                    >
                      <span>{option.label}</span>
                      <span>{option.maxChars} caractères</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="tone">Ton ({allTones.length})</label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {Object.entries(toneCategories).map(([category, groups]) => (
                    <optgroup key={category} label={category}>
                      {Object.entries(groups).flatMap(([group, tones]) => (
                        tones.map((toneOption) => (
                          <option key={`${category}-${group}-${toneOption}`} value={toneOption}>
                            {toneOption}
                          </option>
                        ))
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">{contentType === 'generate' ? 'Votre demande' : 'Contenu à commenter'}</h2>
              <button
                type="button"
                onClick={resetForm}
                disabled={isGenerating}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Réinitialiser
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={contentType === 'generate' ? "Décrivez l'idée, l'annonce ou le message à transformer..." : 'Collez le post ou la question à laquelle répondre...'}
              rows={8}
              className="w-full resize-y rounded border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
            />

            {error && (
              <div className="mt-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="mt-4 w-full rounded bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isGenerating ? 'Génération en cours...' : 'Générer le contenu'}
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contenu généré</h2>
              <button
                type="button"
                onClick={() => copyResult()}
                disabled={!result}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Copier
              </button>
            </div>
            <div className="min-h-[280px] rounded bg-slate-100 p-4 dark:bg-slate-800">
              {isGenerating ? (
                <div className="flex h-[240px] items-center justify-center text-slate-500 dark:text-slate-400">
                  Génération avec DeepSeek...
                </div>
              ) : result ? (
                <>
                  <p className="whitespace-pre-wrap leading-relaxed">{result}</p>
                  <div className="mt-4 text-xs text-slate-500">{result.length} caractères</div>
                </>
              ) : (
                <div className="flex h-[240px] items-center justify-center text-center text-slate-500 dark:text-slate-400">
                  Le contenu généré apparaîtra ici.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historique local</h2>
              <button
                type="button"
                onClick={() => setHistory([])}
                disabled={!history.length}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Vider
              </button>
            </div>
            {history.length ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <article key={item.id} className="rounded border border-slate-200 p-3 dark:border-slate-800">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{PLATFORMS[item.platform]}</span>
                      <span>{item.tone}</span>
                      <span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{item.result}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResult(item.result)}
                        className="rounded bg-slate-100 px-3 py-2 text-xs font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        Afficher
                      </button>
                      <button
                        type="button"
                        onClick={() => copyResult(item.result)}
                        className="rounded bg-slate-100 px-3 py-2 text-xs font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        Copier
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucune génération enregistrée pour le moment.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
