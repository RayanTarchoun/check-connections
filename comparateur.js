import 'dotenv/config';

// PHASE 8 : Comparateur de modeles

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

const PROMPTS = [
  { type: 'traduction', content: 'Traduis en anglais : "Le chat dort sur le canape."' },
  { type: 'resume', content: 'Resume en une phrase : "Les Large Language Models sont des modeles statistiques entraines sur des milliards de textes. Ils predisent le token suivant a partir du contexte. Cette capacite simple fait emerger des comportements complexes comme la traduction, le raisonnement ou la generation de code."' },
  { type: 'code', content: 'Ecris une fonction JavaScript qui inverse une chaine de caracteres. Donne uniquement le code, sans explication.' },
  { type: 'creatif', content: 'Donne une metaphore originale pour expliquer ce qu\'est un LLM. Une seule phrase.' },
  { type: 'factuel', content: 'Qui a introduit l\'architecture Transformer en 2017 ? Reponds en une phrase.' }
];

async function callProvider(provider, prompt) {
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
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return { provider: provider.name, content: null, latency, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { provider: provider.name, content: data.choices[0].message.content, latency, error: null };
  } catch (err) {
    return { provider: provider.name, content: null, latency: Date.now() - start, error: err.message };
  }
}

// Toutes les combinaisons en parallele
const tasks = PROMPTS.flatMap(p =>
  providers.map(prov => callProvider(prov, p.content).then(r => ({ type: p.type, ...r })))
);

const results = await Promise.all(tasks);

// Affichage en tableau markdown
const types = PROMPTS.map(p => p.type);
const providerNames = providers.map(p => p.name);

console.log('| Type | ' + providerNames.join(' | ') + ' |');
console.log('|' + '-'.repeat(12) + '|' + providerNames.map(() => '-'.repeat(40)).join('|') + '|');

for (const type of types) {
  const row = providerNames.map(name => {
    const r = results.find(r => r.type === type && r.provider === name);
    if (r.error) return `ERREUR: ${r.error}`;
    // Tronquer a 35 chars pour le tableau
    const text = r.content.replace(/\n/g, ' ').substring(0, 35);
    return text + (r.content.length > 35 ? '...' : '');
  });

  console.log(`| ${type.padEnd(10)} | ${row.join(' | ')} |`);
}