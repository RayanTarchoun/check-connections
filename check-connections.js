import 'dotenv/config';

//PHASE 1 : Verification des cles

const requiredKeys = ['MISTRAL_API_KEY', 'GROQ_API_KEY', 'HUGGINGFACE_TOKEN'];

console.log('Verification des cles API...\n');

for (const key of requiredKeys) {
  const status = process.env[key] ? 'presente' : 'MANQUANTE';
  console.log(`${key}: ${status}`);
}

// PHASE 3

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

// Lancement des 3 checks en parallele
console.log('\nPing des providers...\n');
const results = await Promise.all(providers.map(p => checkProvider(p)));

for (const r of results) {
  console.log(r);
}