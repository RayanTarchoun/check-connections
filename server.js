import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = 3000;

// Config providers

const providers = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest'
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  },
  {
    name: 'Hugging Face',
    url: 'https://router.huggingface.co/v1/chat/completions',
    key: process.env.HUGGINGFACE_TOKEN,
    model: 'meta-llama/Llama-3.1-8B-Instruct'
  }
];

// Fonctions reutilisees

async function checkProvider(provider) {
  if (!provider.key) {
    return { provider: provider.name, status: 'ERROR', latency: 0, error: 'Cle API manquante' };
  }

  const start = Date.now();

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: 'Dis juste ok' }],
        max_tokens: 5
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return { provider: provider.name, status: 'ERROR', latency, error: `HTTP ${response.status}` };
    }

    return { provider: provider.name, status: 'OK', latency };
  } catch (err) {
    const latency = Date.now() - start;
    return { provider: provider.name, status: 'ERROR', latency, error: err.message };
  }
}

async function checkPinecone() {
  const key = process.env.PINECONE_API_KEY;

  if (!key) {
    return { provider: 'Pinecone', status: 'ERROR', latency: 0, error: 'Cle API manquante' };
  }

  const start = Date.now();

  try {
    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': key,
        'X-Pinecone-API-Version': '2024-07'
      }
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return { provider: 'Pinecone', status: 'ERROR', latency, error: `HTTP ${response.status}` };
    }

    return { provider: 'Pinecone', status: 'OK', latency };
  } catch (err) {
    const latency = Date.now() - start;
    return { provider: 'Pinecone', status: 'ERROR', latency, error: err.message };
  }
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// ROUTES

// GET /check -> lance les checks de connexion
app.get('/check', async (req, res) => {
  const results = await Promise.all([
    ...providers.map(p => checkProvider(p)),
    checkPinecone()
  ]);
  res.json(results);
});

// GET /ask?q=...&provider=mistral -> envoie le prompt au provider
app.get('/ask', async (req, res) => {
  const { q, provider: providerName } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Parametre "q" manquant' });
  }

  const provider = providers.find(p => p.name.toLowerCase().includes((providerName || 'mistral').toLowerCase()));

  if (!provider) {
    return res.status(400).json({ error: `Provider "${providerName}" non trouve` });
  }

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: q }],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    res.json({ provider: provider.name, response: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /cost?text=... -> estime les couts
app.get('/cost', (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Parametre "text" manquant' });
  }

  const tokens = estimateTokens(text);

  const pricing = [
    { provider: 'Mistral Small', pricePerMillion: 0.20 },
    { provider: 'Groq Llama 3', pricePerMillion: 0.05 },
    { provider: 'GPT-4o', pricePerMillion: 2.50 }
  ];

  const results = pricing.map(p => ({
    provider: p.provider,
    tokens,
    estimatedCost: `${((tokens / 1_000_000) * p.pricePerMillion).toFixed(8)}e`
  }));

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Serveur demarre sur http://localhost:${PORT}`);
});