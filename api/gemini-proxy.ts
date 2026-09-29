const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_TIMEOUT_MS = 20000;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido, usa POST.' });
  }

  const { prompt } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'El campo "prompt" es requerido.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: controller.signal,
      }
    );

    const data = await geminiRes.json();

    if (data.error) {
      return res.status(502).json({ error: `Gemini: ${data.error.message}` });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return res.status(200).json({ text });

  } catch (err: any) {
    const message = err?.name === 'AbortError'
      ? 'Gemini tardó demasiado en responder (timeout de 20s).'
      : String(err);
    return res.status(500).json({ error: message });
  } finally {
    clearTimeout(timeout);
  }
};
