(() => {
  const DATA = JSON.parse(document.getElementById('data').textContent);
  const $ = (id) => document.getElementById(id);
  let lang = localStorage.getItem('pl.lang') || ((navigator.language || 'es').startsWith('es') ? 'es' : 'en');
  const qlang = new URLSearchParams(location.search).get('lang');
  if (qlang === 'en' || qlang === 'es') lang = qlang;
  const t = (k) => DATA.copy[lang][k];
  const L = (o) => (typeof o === 'string' ? o : o[lang]);
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('pl.v4') || '{}'); } catch { return {}; } },
    set(p) { localStorage.setItem('pl.v4', JSON.stringify({ ...this.get(), ...p })); },
  };
  function go(view) {
    document.querySelectorAll('.view').forEach((el) => el.classList.toggle('on', el.id === view));
    document.querySelectorAll('nav.tab button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    window.scrollTo(0, 0);
    if (view === 'cases') renderTracks();
    if (view === 'nums') { renderCap(); renderTrade(); }
    if (view === 'fire') renderInc();
  }
  const labels = {
    title: 'title', lead: 'lead', goFire: 'start', goCases: 'cases',
    casesTitle: 'cases', casesLead: 'casesLead', numsTitle: 'nums',
    fireTitle: 'fire', footer: 'footer', next: 'next', backCases: 'cases',
    nextInc: 'next', lDau: 'dau', lRpu: 'rpu', lPeak: 'peak',
    lReads: 'reads', lPay: 'pay', lCons: 'cons', lReps: 'reps',
    lTtl: 'ttl', lRegs: 'regs', lQueue: 'queue',
  };
  function paint() {
    document.documentElement.lang = lang;
    localStorage.setItem('pl.lang', lang);
    Object.entries(labels).forEach(([id, key]) => { const el = $(id); if (el) el.textContent = t(key); });
    const fl = $('fireLead'); if (fl) fl.textContent = t('pick');
    document.querySelectorAll('[data-k]').forEach((el) => { el.textContent = t(el.dataset.k); });
    document.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    const done = new Set(store.get().cases || []);
    $('progress').textContent = `${done.size}/${Object.keys(DATA.cases).length}`;
    $('principles').innerHTML = DATA.principles[lang]
      .map(([a, b, c]) => `<details><summary>${a}</summary><div class="body">${b}<div class="trap">${c}</div></div></details>`)
      .join('');
    if ($('cS')) renderTrade();
  }
  let dau = 100000;
  function fmt(n) {
    return n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n));
  }
  function renderCap() {
    if (!$('rpu')) return;
    const rpu = +$('rpu').value, peak = +$('peak').value, reads = +$('reads').value, pay = +$('pay').value;
    $('dauV').textContent = fmt(dau);
    $('rpuV').textContent = rpu;
    $('peakV').textContent = peak + '×';
    $('readV').textContent = reads + '%';
    $('payV').textContent = pay;
    const qpsAvg = (dau * rpu) / 86400;
    const qps = qpsAvg * peak;
    const w = qps * (1 - reads / 100);
    const r = qps * (reads / 100);
    const egress = (dau * rpu * pay * 1024) / (1024 ** 3);
    const nodes = Math.max(2, Math.ceil(qps / 400));
    $('capOut').innerHTML = [
      ['QPS pico', fmt(qps) + '/s'],
      ['Writes pico', fmt(w) + '/s'],
      ['Reads pico', fmt(r) + '/s'],
      ['Egress / día', egress.toFixed(2) + ' GB'],
      ['Nodos ~400 rps', nodes + '+'],
    ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
    let a = qps < 80 ? (lang === 'es' ? 'Monolito modular + Postgres + Redis.' : 'Modular monolith + Postgres + Redis.') : qps < 2000 ? (lang === 'es' ? 'Stateless, réplicas, cache, cola.' : 'Stateless, replicas, cache, queue.') : (lang === 'es' ? 'Shard, CDN, multi-AZ, backpressure.' : 'Shard, CDN, multi-AZ, backpressure.');
    if (w > 200) a += lang === 'es' ? ' El writer ya duele.' : ' The writer already hurts.';
    if (egress > 50) a += lang === 'es' ? ' Egress duele: CDN.' : ' Egress hurts: CDN.';
    $('capAdvice').innerHTML = `<p class="kicker">${t('verdict')}</p><p class="muted">${a}</p>`;
  }
  function renderTrade() {
    if (!$('cS')) return;
    const c = +$('cS').value, rep = +$('repS').value, ttl = +$('ttlS').value, reg = +$('regS').value, q = +$('qS').value;
    $('cV').textContent = [t('cEv'), t('cRy'), t('cSt')][c];
    $('repV').textContent = rep; $('ttlV').textContent = ttl; $('regV').textContent = reg; $('qV').textContent = q ? t('yes') : t('noq');
    let lat = 40, avail = 99.5, fresh = 95, cost = 2;
    if (c === 1) { lat += 15; fresh = 99; cost += 1; }
    if (c === 2) { lat += 45; fresh = 100; avail -= 0.15; cost += 2; }
    lat += Math.max(0, 2 - rep) * 8; avail += Math.min(rep, 4) * 0.1; cost += rep * 0.4;
    if (ttl === 0) { lat += 25; } else { lat -= Math.min(25, ttl / 20); fresh -= Math.min(20, ttl / 40); }
    if (reg > 1) { avail += 0.25 * (reg - 1); cost += 3 * (reg - 1); lat += c === 2 ? 40 : 8; }
    if (!q) { lat += 30; avail -= 0.2; } else cost += 0.5;
    $('tradeStats').innerHTML = [
      ['p99', Math.max(12, Math.round(lat)) + ' ms'],
      [lang === 'es' ? 'Disponibilidad' : 'Availability', Math.min(99.99, Math.max(98.5, avail)).toFixed(2) + '%'],
      [lang === 'es' ? 'Frescura' : 'Freshness', Math.max(70, Math.min(100, Math.round(fresh))) + '%'],
      [lang === 'es' ? 'Costo' : 'Cost', '×' + Math.max(1, cost).toFixed(1)],
    ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
  }
  let track = null, casePicked = false;
  function renderTracks() {
    $('trackList').hidden = false; $('play').hidden = true; casePicked = false;
    const done = new Set(store.get().cases || []);
    $('trackList').innerHTML = Object.entries(DATA.cases).map(([k, c]) => `<button class="row" data-case="${k}"><span><b>${c[lang]}</b><p>${L(c.blurb)}</p></span><span class="${done.has(k) ? 'done' : ''}">${done.has(k) ? t('done') : ''}</span></button>`).join('');
  }
  function openCase(k) {
    track = k; casePicked = false;
    const c = DATA.cases[k]; const s = c.steps[0];
    $('trackList').hidden = true; $('play').hidden = false;
    $('qcard').innerHTML = `<p class="kicker">${c[lang]}</p><h2>${L(s.q)}</h2><p class="muted">${s.arch}</p>`;
    $('opts').innerHTML = s.opts.map((o, i) => `<button class="opt" data-i="${i}">${L(o.t)}</button>`).join('');
    $('fb').textContent = ''; $('snip').hidden = true; $('notes').hidden = true;
    $('next').disabled = true; $('next').textContent = t('pick');
  }
  function showNotes() {
    const c = DATA.cases[track];
    $('notes').hidden = false;
    $('notes').innerHTML = `<details open><summary>${t('tech')}</summary><div class="body">${L(c.tech)}</div></details><details><summary>${t('example')}</summary><div class="body">${L(c.example)}</div></details>`;
  }
  let fi = 0, firePicked = false;
  function renderInc() {
    firePicked = false;
    const list = DATA.incidents;
    const f = list[fi % list.length];
    $('inc').innerHTML = `<p class="kicker">${(fi % list.length) + 1}/${list.length}</p><h2>${L(f.t)}</h2><p class="muted">${L(f.q)}</p>${f.opts.map((o, i) => `<button class="opt" data-i="${i}">${L(o.t)}</button>`).join('')}<p class="fb" id="ifb"></p>`;
    $('nextInc').disabled = true; $('nextInc').textContent = t('pick');
  }
  document.querySelector('.seg').onclick = (e) => {
    const b = e.target.closest('[data-lang]'); if (!b) return;
    lang = b.dataset.lang; paint();
    if ($('cases').classList.contains('on')) renderTracks();
    if ($('nums').classList.contains('on')) { renderCap(); renderTrade(); }
    if ($('fire').classList.contains('on')) renderInc();
  };
  document.querySelector('nav.tab').onclick = (e) => { const b = e.target.closest('[data-view]'); if (b) go(b.dataset.view); };
  $('logo').onclick = () => go('home');
  $('goFire').onclick = () => go('fire');
  $('goCases').onclick = () => go('cases');
  ['rpu','peak','reads','pay'].forEach((id) => { if ($(id)) $(id).oninput = renderCap; });
  ['cS','repS','ttlS','regS','qS'].forEach((id) => { if ($(id)) $(id).oninput = renderTrade; });
  document.querySelectorAll('[data-dau]').forEach((b) => {
    b.onclick = () => { dau = +b.dataset.dau; document.querySelectorAll('[data-dau]').forEach((x) => x.classList.toggle('on', x === b)); renderCap(); };
  });
  $('trackList').onclick = (e) => { const b = e.target.closest('[data-case]'); if (b) openCase(b.dataset.case); };
  $('opts').onclick = (e) => {
    const b = e.target.closest('.opt'); if (!b || !track) return;
    const o = DATA.cases[track].steps[0].opts[+b.dataset.i];
    [...$('opts').children].forEach((x) => x.classList.remove('ok','bad'));
    b.classList.add(o.ok ? 'ok' : 'bad');
    $('fb').textContent = (o.ok ? t('well') : t('no')) + L(o.why);
    $('snip').hidden = false; $('snip').textContent = DATA.cases[track].steps[0].snip;
    showNotes(); casePicked = true; $('next').disabled = false; $('next').textContent = t('done');
  };
  $('next').onclick = () => {
    if (!casePicked) return;
    const done = new Set(store.get().cases || []); done.add(track); store.set({ cases: [...done] }); paint(); renderTracks();
  };
  $('backCases').onclick = renderTracks;
  $('inc').onclick = (e) => {
    const b = e.target.closest('.opt'); if (!b) return;
    const o = DATA.incidents[fi % DATA.incidents.length].opts[+b.dataset.i];
    $('inc').querySelectorAll('.opt').forEach((x) => x.classList.remove('ok','bad'));
    b.classList.add(o.ok ? 'ok' : 'bad');
    const fb = document.getElementById('ifb'); if (fb) fb.textContent = (o.ok ? t('well') : t('no')) + L(o.why);
    firePicked = true; $('nextInc').disabled = false; $('nextInc').textContent = t('next');
  };
  $('nextInc').onclick = () => { if (!firePicked) return; fi++; renderInc(); };
  paint();
})();
