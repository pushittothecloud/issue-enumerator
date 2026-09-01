// Combinator MVP — vanilla JS, localStorage-backed.

const STORAGE_KEY = 'combinator:v1';

const state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  return { issues: [], assets: [], attempts: [] };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function findIssue(id) { return state.issues.find(i => i.id === id); }
function findAsset(id) { return state.assets.find(a => a.id === id); }

// ---------- Tab switching ----------

const views = ['pool', 'shuffle', 'enumerate', 'inspire'];
document.querySelectorAll('#tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.view;
    views.forEach(name => {
      document.getElementById('view-' + name).hidden = name !== v;
    });
    document.querySelectorAll('#tabs button').forEach(b =>
      b.classList.toggle('active', b === btn)
    );
    if (v === 'enumerate') renderEnumerate();
    if (v === 'inspire') renderInspire();
  });
});

// ---------- Pool: add & list ----------

document.getElementById('add-issue').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const text = f.text.value.trim();
  if (!text) return;
  state.issues.push({
    id: uid(),
    text,
    type: f.type.value.trim(),
    frequency: f.frequency.value,
    where: f.where.value.trim(),
    created: new Date().toISOString(),
  });
  save();
  f.reset();
  renderPool();
});

document.getElementById('add-asset').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const text = f.text.value.trim();
  if (!text) return;
  state.assets.push({
    id: uid(),
    text,
    kind: f.kind.value,
    created: new Date().toISOString(),
  });
  save();
  f.reset();
  renderPool();
});

function renderPool() {
  const issueList = document.getElementById('issue-list');
  const assetList = document.getElementById('asset-list');
  issueList.innerHTML = '';
  assetList.innerHTML = '';

  state.issues.forEach(issue => {
    const li = document.createElement('li');
    li.className = 'pool-item';
    li.innerHTML = `
      <div class="item-text"></div>
      <div class="item-meta">
        <span class="badge ${issue.frequency}">${issue.frequency}</span>
        ${issue.type ? `<span class="badge">${escapeHtml(issue.type)}</span>` : ''}
        ${issue.where ? `<span>@ ${escapeHtml(issue.where)}</span>` : ''}
      </div>
      <div class="item-actions">
        <button data-action="delete">delete</button>
      </div>
    `;
    li.querySelector('.item-text').textContent = issue.text;
    li.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!confirm('Delete this issue?')) return;
      state.issues = state.issues.filter(x => x.id !== issue.id);
      state.attempts = state.attempts.filter(a => a.issueId !== issue.id);
      save();
      renderPool();
    });
    issueList.appendChild(li);
  });

  state.assets.forEach(asset => {
    const li = document.createElement('li');
    li.className = 'pool-item';
    li.innerHTML = `
      <div class="item-text"></div>
      <div class="item-meta">
        <span class="badge">${asset.kind}</span>
      </div>
      <div class="item-actions">
        <button data-action="delete">delete</button>
      </div>
    `;
    li.querySelector('.item-text').textContent = asset.text;
    li.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!confirm('Delete this asset?')) return;
      state.assets = state.assets.filter(x => x.id !== asset.id);
      state.attempts = state.attempts.filter(a => a.assetId !== asset.id);
      save();
      renderPool();
    });
    assetList.appendChild(li);
  });

  if (!state.issues.length) issueList.innerHTML = '<li class="hint">No issues yet.</li>';
  if (!state.assets.length) assetList.innerHTML = '<li class="hint">No assets yet.</li>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------- Pair card (shared by Shuffle & Enumerate) ----------

function attemptsFor(issueId, assetId) {
  return state.attempts.filter(a => a.issueId === issueId && a.assetId === assetId);
}

function latestRating(issueId, assetId) {
  const list = attemptsFor(issueId, assetId).filter(a => a.rating);
  return list.length ? list[list.length - 1].rating : null;
}

function buildPairCard(issue, asset) {
  const tpl = document.getElementById('tpl-pair-card');
  const node = tpl.content.firstElementChild.cloneNode(true);

  const issueCell = node.querySelector('.issue-cell');
  issueCell.querySelector('.cell-text').textContent = issue.text;
  issueCell.querySelector('.cell-meta').innerHTML = `
    <span class="badge ${issue.frequency}">${issue.frequency}</span>
    ${issue.type ? `<span class="badge">${escapeHtml(issue.type)}</span>` : ''}
    ${issue.where ? `<span>@ ${escapeHtml(issue.where)}</span>` : ''}
  `;

  const assetCell = node.querySelector('.asset-cell');
  assetCell.querySelector('.cell-text').textContent = asset.text;
  assetCell.querySelector('.cell-meta').innerHTML =
    `<span class="badge">${asset.kind}</span>`;

  const currentRating = latestRating(issue.id, asset.id);
  node.querySelectorAll('.pair-actions button').forEach(btn => {
    if (btn.dataset.rating === currentRating) btn.classList.add('rated');
    btn.addEventListener('click', () => {
      state.attempts.push({
        id: uid(),
        issueId: issue.id,
        assetId: asset.id,
        rating: btn.dataset.rating,
        date: new Date().toISOString(),
      });
      save();
      node.querySelectorAll('.pair-actions button').forEach(b =>
        b.classList.toggle('rated', b === btn)
      );
      renderPriorAttempts(node, issue.id, asset.id);
    });
  });

  node.querySelector('.save-attempt').addEventListener('click', () => {
    const how = node.querySelector('.how').value.trim();
    const outcome = node.querySelector('.outcome').value.trim();
    if (!how && !outcome) return;
    state.attempts.push({
      id: uid(),
      issueId: issue.id,
      assetId: asset.id,
      how,
      outcome,
      date: new Date().toISOString(),
    });
    save();
    node.querySelector('.how').value = '';
    node.querySelector('.outcome').value = '';
    renderPriorAttempts(node, issue.id, asset.id);
  });

  renderPriorAttempts(node, issue.id, asset.id);
  return node;
}

function renderPriorAttempts(node, issueId, assetId) {
  const container = node.querySelector('.prior-attempts');
  const list = attemptsFor(issueId, assetId);
  if (!list.length) { container.innerHTML = ''; return; }
  container.innerHTML = '<div class="cell-label">History</div>' +
    list.map(a => {
      const bits = [];
      if (a.rating) bits.push(`rated <b>${a.rating}</b>`);
      if (a.how) bits.push(`how: ${escapeHtml(a.how)}`);
      if (a.outcome) bits.push(`outcome: ${escapeHtml(a.outcome)}`);
      const when = new Date(a.date).toLocaleDateString();
      return `<div class="attempt">${when} — ${bits.join(' · ')}</div>`;
    }).join('');
}

// ---------- Shuffle (Module A) ----------

document.getElementById('shuffle-btn').addEventListener('click', doShuffle);

function doShuffle() {
  const stage = document.getElementById('shuffle-stage');
  const chronicOnly = document.getElementById('shuffle-chronic-only').checked;
  const preferUnrated = document.getElementById('shuffle-unrated').checked;

  let issues = state.issues;
  if (chronicOnly) issues = issues.filter(i => i.frequency === 'chronic');
  const assets = state.assets;

  if (!issues.length || !assets.length) {
    stage.innerHTML = '<p class="empty">Need at least one matching issue and one asset.</p>';
    return;
  }

  const pairs = [];
  for (const i of issues) for (const a of assets) pairs.push({ issue: i, asset: a });

  let pool = pairs;
  if (preferUnrated) {
    const unrated = pairs.filter(p => !latestRating(p.issue.id, p.asset.id));
    if (unrated.length) pool = unrated;
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  stage.innerHTML = '';
  stage.appendChild(buildPairCard(pick.issue, pick.asset));
}

// ---------- Enumerate (Module B) ----------

const enumAnchorType = document.getElementById('enum-anchor-type');
const enumAnchorSel = document.getElementById('enum-anchor');

enumAnchorType.addEventListener('change', renderEnumerate);
enumAnchorSel.addEventListener('change', renderEnumerateStage);

function renderEnumerate() {
  const type = enumAnchorType.value;
  const items = type === 'issue' ? state.issues : state.assets;
  enumAnchorSel.innerHTML = '';
  if (!items.length) {
    enumAnchorSel.innerHTML = '<option>(none)</option>';
    document.getElementById('enum-stage').innerHTML =
      `<p class="empty">Add at least one ${type} in the Pool tab.</p>`;
    return;
  }
  items.forEach(x => {
    const opt = document.createElement('option');
    opt.value = x.id;
    opt.textContent = x.text;
    enumAnchorSel.appendChild(opt);
  });
  renderEnumerateStage();
}

function renderEnumerateStage() {
  const stage = document.getElementById('enum-stage');
  stage.innerHTML = '';
  const anchorType = enumAnchorType.value;
  const anchorId = enumAnchorSel.value;
  if (!anchorId) return;

  const others = anchorType === 'issue' ? state.assets : state.issues;
  if (!others.length) {
    stage.innerHTML = `<p class="empty">Add ${anchorType === 'issue' ? 'assets' : 'issues'} first.</p>`;
    return;
  }

  others.forEach(other => {
    const issue = anchorType === 'issue' ? findIssue(anchorId) : other;
    const asset = anchorType === 'issue' ? other : findAsset(anchorId);
    stage.appendChild(buildPairCard(issue, asset));
  });
}

// ---------- Inspire ----------

const PROMPTS = {
  issues: {
    label: 'Find issues',
    items: [
      "What woke you up thinking about it last week?",
      "What do you keep avoiding?",
      "What takes longer than it should?",
      "What have you been meaning to fix for months?",
      "What annoys you every Monday?",
      "What breaks a recurring plan or routine?",
      "What did past-you struggle with that's back again?",
      "What do others complain about in your situation?",
      "What feels heavier than it looks on paper?",
      "What's the first thing you'd delegate if you could?",
      "What only shows up under stress?",
      "What's a friction you've stopped noticing?",
    ],
  },
  assets: {
    label: 'Take stock of assets',
    items: [
      "What skill did you use most this month?",
      "What tool have you paid for but underuse?",
      "Who do you know who's good at this kind of thing?",
      "What did you learn in a past job you no longer apply?",
      "What worked once and you forgot about?",
      "What resource sits idle in a drawer or tab?",
      "What can you borrow from a hobby?",
      "What did you build for something else that could be reused?",
      "What subscription could double for another purpose?",
      "What's a habit you already have that could carry more weight?",
      "What did you master and then abandon?",
      "What's your unfair advantage right now?",
    ],
  },
  pairing: {
    label: 'Explore a pairing',
    items: [
      "Where would this show up first?",
      "What's the smallest test you could run this week?",
      "Who else needs to be involved?",
      "What would block this in week one?",
      "How would you know it's working after a month?",
      "What version-zero could you do today, with nothing extra?",
      "What has to be true for this to work?",
      "What would this look like if it were easy?",
      "What's the opposite approach, and why not that?",
      "What's the failure mode?",
      "How does this deploy on a bad day, not a good one?",
      "What would you have to stop doing to make room?",
    ],
  },
  repurpose: {
    label: 'Repurpose from elsewhere',
    items: [
      "Has this issue been solved before in a different part of your life?",
      "What worked in a different domain (work → home, or reverse)?",
      "Can two of your existing tools combine into something new?",
      "What did a past version of you solve that current-you forgot?",
      "How would someone from a different profession approach this?",
      "What's a childhood strategy that might still apply?",
      "What did a friend do that you dismissed at the time?",
      "What if you approached this like a game / a recipe / a repair?",
      "What's an off-the-shelf solution you could bend to fit?",
      "What analogy from nature or sport applies here?",
    ],
  },
};

const inspireList = document.getElementById('inspire-list');
const inspireFilter = document.getElementById('inspire-filter');
const inspireRandomStage = document.getElementById('inspire-random-stage');

inspireFilter.addEventListener('change', renderInspire);
document.getElementById('inspire-random').addEventListener('click', showRandomPrompt);

function renderInspire() {
  const filter = inspireFilter.value;
  inspireList.innerHTML = '';
  Object.entries(PROMPTS).forEach(([key, cat]) => {
    if (filter !== 'all' && filter !== key) return;
    const section = document.createElement('div');
    section.className = 'inspire-cat';
    const h = document.createElement('h3');
    h.textContent = cat.label;
    section.appendChild(h);
    const ul = document.createElement('ul');
    ul.className = 'inspire-prompts';
    cat.items.forEach(text => {
      const li = document.createElement('li');
      li.className = 'prompt';
      li.textContent = text;
      li.title = 'Click to copy';
      li.addEventListener('click', () => copyPrompt(li, text));
      ul.appendChild(li);
    });
    section.appendChild(ul);
    inspireList.appendChild(section);
  });
}

function showRandomPrompt() {
  const filter = inspireFilter.value;
  const pool = [];
  Object.entries(PROMPTS).forEach(([key, cat]) => {
    if (filter !== 'all' && filter !== key) return;
    cat.items.forEach(text => pool.push({ text, cat: cat.label }));
  });
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  inspireRandomStage.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'prompt random-prompt';
  card.title = 'Click to copy';
  card.innerHTML = `<div class="cell-label">${escapeHtml(pick.cat)}</div><div class="prompt-text"></div>`;
  card.querySelector('.prompt-text').textContent = pick.text;
  card.addEventListener('click', () => copyPrompt(card, pick.text));
  inspireRandomStage.appendChild(card);
}

function copyPrompt(el, text) {
  navigator.clipboard?.writeText(text);
  const old = el.dataset.copied;
  el.classList.add('copied');
  clearTimeout(+old || 0);
  el.dataset.copied = setTimeout(() => el.classList.remove('copied'), 900);
}

// ---------- Export / Import ----------

document.getElementById('export-btn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `combinator-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-btn').addEventListener('click', () =>
  document.getElementById('import-file').click()
);

document.getElementById('import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data.issues || !data.assets) throw new Error('Missing fields');
    if (!confirm('Replace current data with imported file?')) return;
    state.issues = data.issues;
    state.assets = data.assets;
    state.attempts = data.attempts || [];
    save();
    renderPool();
    renderEnumerate();
  } catch (err) {
    alert('Import failed: ' + err.message);
  }
  e.target.value = '';
});

// ---------- Initial render ----------

renderPool();
