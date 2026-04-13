import 'dotenv/config';

// PHASE 7 : Prompt Lab

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

const temperatures = [0, 0.5, 1];
const PROMPT = "Explique ce qu'est un cookie HTTP en 2 phrases.";

async function callProvider(provider, prompt, temperature) {
  try {
    // HuggingFace n'accepte pas temperature 0, on met 0.01
    const temp = temperature === 0 && provider.name === 'Hugging Face' ? 0.01 : temperature;

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temp,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      return { provider: provider.name, temperature, content: null, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { provider: provider.name, temperature, content: data.choices[0].message.content, error: null };
  } catch (err) {
    return { provider: provider.name, temperature, content: null, error: err.message };
  }
}

// Toutes les combinaisons provider x temperature
const tasks = providers.flatMap(p =>
  temperatures.map(t => callProvider(p, PROMPT, t))
);

console.log(`Prompt : "${PROMPT}"\n`);
console.log('-'.repeat(80));

const results = await Promise.all(tasks);

for (const r of results) {
  if (r.error) {
    console.log(`\n${r.provider} | temp ${r.temperature} | ERREUR: ${r.error}`);
  } else {
    console.log(`\n${r.provider} | temp ${r.temperature} | ${r.content}`);
  }
}

console.log('\n' + '-'.repeat(80));