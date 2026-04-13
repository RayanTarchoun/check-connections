// check-connections.js
import 'dotenv/config';

// ===== PHASE 1 : Vérification que les clés sont présentes =====

const requiredKeys = ['MISTRAL_API_KEY', 'GROQ_API_KEY', 'HF_API_KEY'];

console.log('Vérification des clés API...\n');

for (const key of requiredKeys) {
  const status = process.env[key] ? 'présente' : 'MANQUANTE';
  console.log(`${key}: ${status}`);
}

// ===== PHASE 2 : Ping Mistral =====

async function checkMistral() {
  const key = process.env.MISTRAL_API_KEY;

  if (!key) {
    return { provider: 'Mistral', status: 'ERROR', latency: 0, error: 'Clé API manquante' };
  }

  const start = Date.now();

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'Dis juste ok' }],
        max_tokens: 5
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return { provider: 'Mistral', status: 'ERROR', latency, error: `HTTP ${response.status}` };
    }

    return { provider: 'Mistral', status: 'OK', latency };
  } catch (err) {
    const latency = Date.now() - start;
    return { provider: 'Mistral', status: 'ERROR', latency, error: err.message };
  }
}

const result = await checkMistral();
console.log('\n Ping Mistral...');
console.log(result);