import 'dotenv/config';

//PHASE 1 : Verification des cles

const requiredKeys = ['MISTRAL_API_KEY', 'GROQ_API_KEY', 'HUGGINGFACE_TOKEN', 'PINECONE_API_KEY'];

console.log('Verification des cles API...\n');

for (const key of requiredKeys) {
  const status = process.env[key] ? 'presente' : 'MANQUANTE';
  console.log(`${key}: ${status}`);
}

// PHASE 5 : Flag verbose

const verbose = process.argv.includes('--verbose');

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
        messages: [{ role: 'user', content: verbose ? 'Donne-moi la capitale de la France en un mot.' : 'Dis juste ok' }],
        max_tokens: 5
      })
    });

    const data = await response.json();
    const latency = Date.now() - start;

    if (!response.ok) {
      return { provider: provider.name, status: 'ERROR', latency, error: `HTTP ${response.status}` };
    }

    const answer = verbose ? data.choices[0].message.content : null;
    return { provider: provider.name, status: 'OK', latency, answer };
  } catch (err) {
    const latency = Date.now() - start;
    return { provider: provider.name, status: 'ERROR', latency, error: err.message };
  }
}

// PHASE 5

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

// Lancement des checks en parallele
console.log('\nPing des providers...\n');
const results = await Promise.all([
  ...providers.map(p => checkProvider(p)),
  checkPinecone()
]);

// PHASE 4

function displayResults(results) {
  console.log('Resultats :\n');

  let okCount = 0;

  for (const r of results) {
    const icon = r.status === 'OK' ? '[OK]' : '[ERREUR]';
    const error = r.error ? ` -- ${r.error}` : '';
    const answer = r.answer ? ` -> "${r.answer}"` : '';
    console.log(`  ${icon} ${r.provider.padEnd(15)} ${r.latency}ms${error}${answer}`);
    if (r.status === 'OK') okCount++;
  }

  console.log(`\n${okCount}/${results.length} connexions actives`);

  if (okCount === results.length) {
    console.log('Tout est bon.');
  } else {
    console.log('Certaines connexions ont echoue.');
  }
}

displayResults(results);