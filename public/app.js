const $cards = document.getElementById('cards');
const search = document.getElementById('search');
const modalForm = new bootstrap.Modal(document.getElementById('modalForm'));
const modalAI = new bootstrap.Modal(document.getElementById('modalAI'));

async function fetchIngredients(q){
  const url = '/api/ingredients' + (q ? `?q=${encodeURIComponent(q)}` : '');
  const res = await fetch(url);
  return res.json();
}

function renderCard(ing){
  const div = document.createElement('div');
  div.className = 'col-sm-6 col-md-4';
  div.innerHTML = `
    <div class="card card-ingredient shadow-sm">
      <div class="card-body">
        <h5 class="card-title">${ing.name}</h5>
        <p class="card-text">${ing.amount || ''}</p>
        <p>${(ing.tags||[]).map(t=>`<span class="badge bg-secondary me-1">${t}</span>`).join('')}</p>
        <div class="d-flex justify-content-between">
          <div>
            <button class="btn btn-sm btn-outline-primary btn-edit">Editar</button>
            <button class="btn btn-sm btn-outline-danger btn-delete">Remover</button>
          </div>
        </div>
      </div>
    </div>
  `;
  div.querySelector('.btn-delete').onclick = async ()=> {
    await fetch(`/api/ingredients/${ing.id}`, { method: 'DELETE' });
    load();
  };
  div.querySelector('.btn-edit').onclick = ()=> {
    document.getElementById('ingId').value = ing.id;
    document.getElementById('ingName').value = ing.name;
    document.getElementById('ingAmount').value = ing.amount || '';
    document.getElementById('ingTags').value = (ing.tags||[]).join(',');
    modalForm.show();
  };
  return div;
}

async function load(q){
  const items = await fetchIngredients(q);
  $cards.innerHTML = '';
  items.forEach(i => $cards.appendChild(renderCard(i)));
}

let to;
search.addEventListener('input', ()=> {
  clearTimeout(to);
  to = setTimeout(()=> load(search.value), 300);
});

document.getElementById('btnAdd').addEventListener('click', ()=> {
  document.getElementById('formIngredient').reset();
  document.getElementById('ingId').value = '';
  modalForm.show();
});

document.getElementById('formIngredient').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = document.getElementById('ingId').value;
  const name = document.getElementById('ingName').value.trim();
  const amount = document.getElementById('ingAmount').value.trim();
  const tags = document.getElementById('ingTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  if (id) {
    await fetch(`/api/ingredients/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, amount, tags })
    });
  } else {
    await fetch('/api/ingredients', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, amount, tags })
    });
  }
  modalForm.hide();
  load();
});

document.getElementById('btnAISuggest').addEventListener('click', async ()=>{
  const items = await fetchIngredients();
  const container = document.getElementById('aiIngredients');
  container.innerHTML = items.map(i => `
    <div class="form-check">
      <input class="form-check-input ai-check" type="checkbox" value="${i.name}" id="ai-${i.id}">
      <label class="form-check-label" for="ai-${i.id}">${i.name} <small class="text-muted">${i.amount||''}</small></label>
    </div>
  `).join('');
  document.getElementById('aiResult').textContent = '';
  modalAI.show();
});

document.getElementById('generateAI').addEventListener('click', async ()=>{
  const checked = Array.from(document.querySelectorAll('.ai-check:checked')).map(i=>i.value);
  if (!checked.length) { alert('Selecione ao menos um ingrediente.'); return; }

  const aiResult = document.getElementById('aiResult');
  aiResult.innerHTML = '<p><em>Gerando sugestões, aguarde...</em></p>';

  const res = await fetch('/api/ai/suggest', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ ingredientNames: checked })
  });
  const data = await res.json();

  try {
    let text = data.result?.text || '';
    text = text.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(text);
    aiResult.innerHTML = renderAIResult(parsed);
  } catch (err) {
    console.error('Erro ao interpretar resposta da IA:', err);
    aiResult.textContent = 'Erro ao interpretar resposta da IA. Veja o console.';
  }
});

function renderAIResult(parsed) {
  if (!parsed.recipes) return '<p>Nenhuma receita encontrada.</p>';

  return `
    <h5>Sugestões de Receitas:</h5>
    <div class="list-group mb-3">
      ${parsed.recipes.map(r => `
        <div class="list-group-item">
          <h6 class="mb-1">${r.name}</h6>
          <p><strong>Ingredientes:</strong> ${r.ingredients.join(', ')}</p>
          <p><strong>Modo de preparo:</strong></p>
          <ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
          <p><span class="badge bg-success">Vegan: ${r.vegan ? 'Sim' : 'Não'}</span>
          <span class="badge bg-info text-dark">Sem glúten: ${r.gluten_free ? 'Sim' : 'Não'}</span></p>
        </div>
      `).join('')}
    </div>

    <h6>Substituições sugeridas:</h6>
    <ul>${Object.entries(parsed.substitutions || {}).map(([k, v]) => `<li>${k} → ${v}</li>`).join('')}</ul>
  `;
}

load();
