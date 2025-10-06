require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

let ingredients = [
    {id: 1, name: 'Tomate', amount: '3 unidades', tags: ['vegetal']},
    {id: 2, name: 'Queijo Mussarela', amount: '200g', tags: ['laticínio']},
];

const getNextId = () => {
    return ingredients.length > 0 ? Math.max(...ingredients.map(i => i.id)) + 1 : 1;
}

app.get('/api/ingredients', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const result = q ? ingredients.filter(i => i.name.toLowerCase().includes(q) || (i.tags||[]).some(t=>t.includes(q))) : ingredients;
  res.json(result);
});

app.get('/api/ingredients/:id', (req, res) => {
  const id = Number(req.params.id);
  const ing = ingredients.find(i => i.id === id);
  if (!ing) return res.status(404).json({ error: 'Not found' });
  res.json(ing);
});

app.post('/api/ingredients', (req, res) => {
  const { name, amount, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newIng = { id: getNextId(), name, amount: amount||'', tags: tags||[] };
  ingredients.push(newIng);
  res.status(201).json(newIng);
});

app.put('/api/ingredients/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = ingredients.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, amount, tags } = req.body;
  ingredients[idx] = {...ingredients[idx], name: name||ingredients[idx].name, amount: amount||ingredients[idx].amount, tags: tags||ingredients[idx].tags};
  res.json(ingredients[idx]);
});

app.delete('/api/ingredients/:id', (req, res) => {
  const id = Number(req.params.id);
  ingredients = ingredients.filter(i => i.id !== id);
  res.status(204).send();
});

app.post('/api/ai/suggest', async (req, res) => {
  try {
    const { ingredientNames } = req.body; 
    if (!ingredientNames || !Array.isArray(ingredientNames)) return res.status(400).json({ error: 'ingredientNames required array' });

    const prompt = `Você é um assistente culinário. Com base nestes ingredientes: ${ingredientNames.join(', ')}.
    1) Sugira até 5 receitas simples com passo a passo curto (3-5 passos).
    2) Para cada ingrediente, sugira 1 substituto viável (ex: "Queijo Mussarela -> Queijo Vegano").
    3) Indique se é possível criar uma versão vegana ou sem glúten de cada receita e como.
    Responda em JSON com chaves: recipes (array), substitutions (object).`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'groq/compound',
        messages: [
          { role: 'system', content: 'Você é um assistente útil, direto e objetivo.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiText = response.data?.choices?.[0]?.message?.content || response.data?.text || JSON.stringify(response.data);
    let parsed;
    try { parsed = JSON.parse(aiText); } catch(e) { parsed = { text: aiText }; }

    res.json({ ok: true, result: parsed });
  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    res.status(500).json({ error: 'IA request failed', detail: err?.response?.data || err.message });
  }
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));