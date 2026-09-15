window.drawFlow = function (el, labels, asyncLabel) {
  if (!el) return;
  const n = (labels || []).filter(Boolean).slice(0, 5);
  if (!n.length) { el.innerHTML = ''; return; }
  const W = 640, H = 132, pad = 28, boxW = Math.min(108, (W - pad * 2) / n.length - 16);
  const y = 56, r = 14;
  const xs = n.map((_, i) => pad + boxW / 2 + i * ((W - pad * 2 - boxW) / Math.max(1, n.length - 1)));
  const path = xs.map((x, i) => (i ? 'L ' + x + ' ' + y : 'M ' + x + ' ' + y)).join(' ');
  const boxes = n.map((lab, i) => {
    const x = xs[i] - boxW / 2;
    return '<rect class="node-pulse" x="' + x + '" y="' + (y - 22) + '" width="' + boxW + '" height="44" rx="' + r + '" fill="#2c2c2e" stroke="rgba(100,210,255,.35)" stroke-width="1"/><text x="' + xs[i] + '" y="' + (y + 5) + '" text-anchor="middle" fill="#fff" font-size="12" font-family="-apple-system,system-ui,sans-serif">' + lab + '</text>';
  }).join('');
  const ride = "offset-path: path('" + path + "')";
  const asyncPath = asyncLabel && xs.length > 2
    ? 'M ' + xs[1] + ' ' + (y + 22) + ' C ' + xs[1] + ' 100, ' + xs[xs.length - 1] + ' 100, ' + xs[xs.length - 1] + ' ' + (y + 22)
    : '';
  el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
    '<path d="' + path + '" fill="none" stroke="rgba(100,210,255,.35)" stroke-width="2"/>' +
    (asyncPath ? '<path d="' + asyncPath + '" fill="none" stroke="rgba(255,214,10,.4)" stroke-width="1.5" stroke-dasharray="5 4"/>' : '') +
    boxes +
    '<circle class="pkt" r="5" fill="#64d2ff" style="' + ride + '"></circle>' +
    '<circle class="pkt b" r="4" fill="#7dd3fc" style="' + ride + '"></circle>' +
    (asyncPath ? '<circle class="pkt c" r="4" fill="#ffd60a" style="offset-path: path(\'' + asyncPath + '\')"></circle>' : '') +
    (asyncLabel ? '<text x="320" y="124" text-anchor="middle" fill="rgba(255,214,10,.8)" font-size="11">' + asyncLabel + '</text>' : '') +
    '</svg>';
};
window.nodesFromArch = function (arch) {
  return String(arch || '').split(/→|->|—/).map(function (s) { return s.trim(); }).filter(Boolean);
};
