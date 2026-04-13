import 'dotenv/config';

// PHASE 6 : Cost Calculator

const pricing = [
  { provider: 'Mistral Small', pricePerMillion: 0.20 },
  { provider: 'Groq Llama 3', pricePerMillion: 0.05 },
  { provider: 'GPT-4o', pricePerMillion: 2.50 }
];

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCost(text, label) {
  const tokens = estimateTokens(text);

  console.log(`Texte${label ? ` (${label})` : ''} : ${text.length} caracteres -> ~${tokens} tokens\n`);
  console.log('Provider'.padEnd(20) + 'Cout estime (input)'.padEnd(25) + 'Pour 1000 requetes');
  console.log('-'.repeat(65));

  for (const p of pricing) {
    const cost = (tokens / 1_000_000) * p.pricePerMillion;
    const cost1000 = cost * 1000;
    console.log(
      p.provider.padEnd(20) +
      `${cost.toFixed(11)}e`.padEnd(25) +
      `${cost1000.toFixed(5)}e`
    );
  }
}

// Test avec un texte exemple
const testText = process.argv[2] || 'Explique le concept de recursion a un lyceen, en 3 phrases maximum. La recursion est un concept fondamental en programmation.';

estimateCost(testText);