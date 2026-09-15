(() => {
  const DATA = JSON.parse(document.getElementById('data').textContent);
  const $ = (id) => document.getElementById(id);
  let lang = localStorage.getItem('pl.lang') || ((navigator.language || 'es').startsWith('es') ? 'es' : 'en');
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'es') lang = q;
  const t = (k) => DATA.copy[lang][k];
  const L = (o) => (typeof o === 'string' ? o : o[lang]);
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('pl.v3') || '{}'); } catch { return {}; } },
    set(p) { localStorage.setItem('pl.v3', JSON.stringify({ ...this.get(), ...p })); },
  };
  function go(view) {
    document.querySelectorAll('.view').forEach((el) => el.classList.toggle('on', el.id === view));
    document.querySelectorAll('nav.tab button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    if (view === 'cases') renderTracks();
    if (view === 'nums') renderCap();
    if (view === 'fire') renderInc();
  }
  function paint() {
    document.documentElement.lang = lang;
    localStorage.setItem('pl.lang', lang);
    ['sub','title','lead','goFire','goCases','casesTitle','casesLead','numsTitle','fireTitle','footer','next','backCases','nextInc'].forEach((id) => {
      const map = { sub:'sub', title:'title', lead:'lead', goFire:'start', goCases:'cases', casesTitle:'cases', casesLead:'casesLead', numsTitle:'nums', fireTitle:'fire', footer:'footer', next:'next', backCases:'cases', nextInc:'next' };
      $(id).textContent = t(map[id]);
    });
    $('lDau').textContent = t('dau'); $('lRpu').textContent = t('rpu'); $('lPeak').textContent = t('peak');
    document.querySelectorAll('[data-k]').forEach((el) => { el.textContent = t(el.dataset.k); });
    document.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    const done = new Set(store.get().cases || []);
    $('progress').textContent = done.size + '/' + Object.keys(DATA.cases).length;
    $('principles').innerHTML = DATA.principles[lang].map(([a,b,c]) => `<details><summary>${a}</summary><div class="body">${b}<div class="trap">${c}</div></div></details>`).join('');
  }
  let dau = 100000;
  function renderCap() {
    const rpu = +$('rpu').value, peak = +$('peak').value;
    $('dauV').textContent = dau >= 1e6 ? dau/1e6 + 'M' : dau/1e3 + 'K';
    $('rpuV').textContent = rpu; $('peakV').textContent = peak + '×';
    const qps = (dau * rpu / 86400) * peak;
    const nodes = Math.max(2, Math.ceil(qps / 400));
    $('capOut').innerHTML = `<div class="stat"><b>${qps.toFixed(0)}/s</b><span>QPS</span></div><div class="stat"><b>${nodes}+</b><span>nodes</span></div>`;
    const msg = qps < 80 ? (lang==='es'?'Monolito + Postgres + Redis.':'Monolith + Postgres + Redis.') : qps < 2000 ? (lang==='es'?'Stateless, réplicas, cache, cola.':'Stateless, replicas, cache, queue.') : (lang==='es'?'Shard, CDN, multi-AZ.':'Shard, CDN, multi-AZ.');
    $('capAdvice').innerHTML = `<p class="kicker">${t('verdict')}</p><p class="muted">${msg}</p>`;
  }
  function renderTracks() {
    $('trackList').hidden = false; $('play').hidden = true;
    const done = new Set(store.get().cases || []);
    $('trackList').innerHTML = Object.entries(DATA.cases).map(([k,c]) => `<button class="row" data-case="${k}"><span><b>${c[lang]}</b><p>${L(c.blurb)}</p></span><span class="${done.has(k)?'done':''}">${done.has(k)?t('done'):'›'}</span></button>`).join('');
  }
  let track = null;
  function openCase(k) {
    track = k; const s = DATA.cases[k].steps[0];
    $('trackList').hidden = true; $('play').hidden = false;
    $('qcard').innerHTML = `<p class="kicker">${DATA.cases[k][lang]}</p><h2>${L(s.q)}</h2><p class="muted">${s.arch}</p>`;
    $('opts').innerHTML = s.opts.map((o,i) => `<button class="opt" data-i="${i}">${L(o.t)}</button>`).join('');
    $('fb').textContent = ''; $('snip').hidden = true;
  }
  let fi = 0;
  function renderInc() {
    const f = DATA.incidents[fi % DATA.incidents.length];
    $('inc').innerHTML = `<p class="kicker">${(fi%DATA.incidents.length)+1}/${DATA.incidents.length}</p><h2>${L(f.t)}</h2><p class="muted">${L(f.q)}</p>${f.opts.map((o,i)=>`<button class="opt" data-i="${i}">${L(o.t)}</button>`).join('')}<p class="fb" id="ifb"></p>`;
  }
  document.querySelector('.seg').onclick = (e) => { const b = e.target.closest('[data-lang]'); if (!b) return; lang = b.dataset.lang; paint(); };
  document.querySelector('nav.tab').onclick = (e) => { const b = e.target.closest('[data-view]'); if (b) go(b.dataset.view); };
  $('logo').onclick = () => go('home');
  $('goFire').onclick = () => go('fire');
  $('goCases').onclick = () => go('cases');
  $('rpu').oninput = renderCap; $('peak').oninput = renderCap;
  document.querySelectorAll('[data-dau]').forEach((b) => b.onclick = () => { dau = +b.dataset.dau; document.querySelectorAll('[data-dau]').forEach((x) => x.classList.toggle('on', x===b)); renderCap(); });
  $('trackList').onclick = (e) => { const b = e.target.closest('[data-case]'); if (b) openCase(b.dataset.case); };
  $('opts').onclick = (e) => {
    const b = e.target.closest('.opt'); if (!b || !track) return;
    const o = DATA.cases[track].steps[0].opts[+b.dataset.i];
    [...$('opts').children].forEach((x) => x.classList.remove('ok','bad'));
    b.classList.add(o.ok ? 'ok' : 'bad');
    $('fb').textContent = (o.ok ? t('well') : t('no')) + L(o.why);
    if (o.ok) { $('snip').hidden = false; $('snip').textContent = DATA.cases[track].steps[0].snip; }
  };
  $('next').onclick = () => { if (track) { const done = new Set(store.get().cases || []); done.add(track); store.set({ cases: [...done] }); paint(); } renderTracks(); };
  $('backCases').onclick = renderTracks;
  $('inc').onclick = (e) => {
    const b = e.target.closest('.opt'); if (!b) return;
    const o = DATA.incidents[fi % DATA.incidents.length].opts[+b.dataset.i];
    $('inc').querySelectorAll('.opt').forEach((x) => x.classList.remove('ok','bad'));
    b.classList.add(o.ok ? 'ok' : 'bad');
    const fb = document.getElementById('ifb'); if (fb) fb.textContent = (o.ok ? t('well') : t('no')) + L(o.why);
  };
  $('nextInc').onclick = () => { fi++; renderInc(); };
  paint();
})();
