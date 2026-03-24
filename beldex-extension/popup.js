// helpers (g, s, now, fp, fc, constants) loaded from common.js

let priceUSD = 0, priceINR = 0, currency = 'usd';
let marketData = null;

// ── TABS ─────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('on'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
    item.classList.add('on');
    const panel = g('panel-' + tab);
    if (panel) panel.classList.add('on');
  });
});

// ── CURRENCY SWITCH ───────────────────────────────────────────
document.querySelectorAll('.csw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currency = btn.dataset.cur;
    document.querySelectorAll('.csw-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    updatePriceDisplay();
  });
});

function updatePriceDisplay() {
  const p = currency === 'inr' ? priceINR : priceUSD;
  if (!p) return;
  s('price-main', fp(p, currency));
  const inrRow = g('price-inr-row');
  if (currency === 'usd' && priceINR) {
    if (inrRow) inrRow.textContent = '₹' + priceINR.toFixed(4) + ' INR';
  } else if (currency === 'inr' && priceUSD) {
    if (inrRow) inrRow.textContent = '$' + fp(priceUSD, 'usd').replace('$', '') + ' USD';
  }
  if (marketData) {
    const m = marketData;
    const cur = currency;
    const mcap = cur === 'inr' ? m.market_cap.inr : m.market_cap.usd;
    const vol = cur === 'inr' ? m.total_volume.inr : m.total_volume.usd;
    const h24 = cur === 'inr' ? m.high_24h.inr : m.high_24h.usd;
    const l24 = cur === 'inr' ? m.low_24h.inr : m.low_24h.usd;
    const ath = cur === 'inr' ? m.ath.inr : m.ath.usd;
    s('p-mcap', fc(mcap, cur));
    s('p-vol', fc(vol, cur));
    s('p-h24', fp(h24, cur));
    s('p-l24', fp(l24, cur));
    s('p-ath', fp(ath, cur));
    const sup = m.circulating_supply;
    if (sup) {
      if (cur === 'inr') {
        if (sup >= 1e7) s('p-sup', (sup / 1e7).toFixed(2) + ' Cr BDX');
        else if (sup >= 1e5) s('p-sup', (sup / 1e5).toFixed(2) + ' L BDX');
        else s('p-sup', sup.toLocaleString('en-IN') + ' BDX');
      } else {
        s('p-sup', (sup / 1e9).toFixed(2) + 'B BDX');
      }
    }
  }
}

// ── BNS CHECK ────────────────────────────────────────────────
const bnsInput = g('bns-input');
if (bnsInput) {
  bnsInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') checkBNS();
  });
}

const bnsBtn = g('bns-btn');
if (bnsBtn) {
  bnsBtn.addEventListener('click', checkBNS);
}

async function checkBNS() {
  const input = g('bns-input');
  const rawName = (input ? input.value : '').trim().toLowerCase();
  const name = rawName.replace(/[^a-z0-9\-_]/g, '');
  if (!name) { if (input) input.focus(); return; }

  const btn = g('bns-btn');
  const result = g('bns-result');
  if (btn) { btn.disabled = true; btn.textContent = 'CHECKING...'; }
  if (result) { result.className = 'bns-result'; result.style.display = 'none'; }

  const fullName = name + '.bdx';

  try {
    const r = await fetch(
      `https://explorer.beldex.io/bns/${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT) }
    );

    if (!r.ok) throw new Error('HTTP ' + r.status);
    const html = await r.text();

    if (html.includes('Not Available:')) {
      showResult('taken', fullName);
    } else if (html.includes('<label>Owner')) {
      const walletTaken = /Wallet[\s\S]*?Available:<\/label>\s*No/i.test(html);
      showResult(walletTaken ? 'taken' : 'avail', fullName);
    } else if (html.includes('Available:</label> Yes')) {
      showResult('avail', fullName);
    } else {
      showFallback(fullName);
    }
  } catch (e) {
    showFallback(fullName);
  }

  if (btn) { btn.disabled = false; btn.textContent = 'CHECK AVAILABILITY →'; }
}

function showResult(state, fullName) {
  const result = g('bns-result');
  if (!result) return;
  result.className = 'bns-result show ' + state;
  result.style.display = 'block';

  if (state === 'avail') {
    s('bns-title', '✓ ' + fullName + ' is available');
    s('bns-desc', 'This name is free to register. Open your Beldex wallet and go to BNS to claim it. Registration permanently burns BDX from supply.');
  } else {
    s('bns-title', '✗ ' + fullName + ' is taken');
    s('bns-desc', 'This name is already registered. Try a different name, add numbers, or try another extension.');
  }
}

function showFallback(fullName) {
  const result = g('bns-result');
  if (!result) return;
  result.className = 'bns-result show error';
  result.style.display = 'block';
  s('bns-title', 'Check ' + fullName + ' on explorer');

  // Use DOM APIs instead of innerHTML (XSS-safe)
  const desc = g('bns-desc');
  if (desc) {
    desc.textContent = 'Could not auto-check. ';
    const link = document.createElement('a');
    link.textContent = 'Open explorer.beldex.io/bns →';
    link.href = '#';
    link.style.color = 'var(--purple)';
    link.style.textDecoration = 'none';
    link.addEventListener('click', e => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://explorer.beldex.io/bns' });
    });
    desc.appendChild(link);
  }
}

// ── LINKS ─────────────────────────────────────────────────────
document.querySelectorAll('.lk[data-url]').forEach(lk => {
  lk.addEventListener('click', e => {
    e.preventDefault();
    const url = lk.dataset.url;
    if (url) chrome.tabs.create({ url });
  });
});

// ── COINGECKO ─────────────────────────────────────────────────
async function fetchPrice() {
  try {
    // Skip if cache is fresh (< 60s)
    const { priceCache } = await chrome.storage.local.get('priceCache');
    if (priceCache && (Date.now() - priceCache.ts < CACHE_TTL)) {
      priceUSD = priceCache.usd;
      priceINR = priceCache.inr || 0;
      updatePriceDisplay();
      s('price-ts', 'cached · ' + new Date(priceCache.ts).toLocaleTimeString());
      return;
    }

    const r = await fetch(
      CG_BASE + '/coins/beldex?localization=false&tickers=false&community_data=false&developer_data=false',
      { signal: AbortSignal.timeout(FETCH_TIMEOUT) }
    );
    if (!r.ok) throw new Error('CG ' + r.status);
    const d = await r.json();
    const m = d.market_data;

    priceUSD = m.current_price.usd;
    priceINR = m.current_price.inr || 0;
    marketData = m;

    const chg = m.price_change_percentage_24h || 0;
    const badge = g('price-chg');
    if (badge) {
      badge.className = 'ph-change ' + (chg > 0 ? 'up' : chg < 0 ? 'dn' : 'nt');
      badge.textContent = (chg >= 0 ? '▲ +' : '▼ ') + Math.abs(chg).toFixed(2) + '%  24H';
    }

    s('p-sup', (m.circulating_supply / 1e9).toFixed(2) + 'B BDX');
    s('price-ts', now());

    updatePriceDisplay();

    chrome.storage.local.set({ priceCache: { usd: priceUSD, inr: priceINR, chg, ts: Date.now() } });
  } catch (e) {
    chrome.storage.local.get('priceCache', ({ priceCache }) => {
      if (!priceCache) return;
      priceUSD = priceCache.usd;
      priceINR = priceCache.inr || 0;
      updatePriceDisplay();
      s('price-ts', 'cached · ' + new Date(priceCache.ts).toLocaleTimeString());
    });
  }
}

// ── NETWORK DATA ──────────────────────────────────────────────
async function fetchNetwork() {
  try {
    // Skip if cache is fresh
    const { netCache } = await chrome.storage.local.get('netCache');
    if (netCache && (Date.now() - netCache.ts < CACHE_TTL)) {
      renderNetwork(netCache);
      s('net-ts', 'cached');
      return;
    }

    const r = await fetch(BDX_API_URL, {
      headers: { 'x-api-key': BDX_API_KEY },
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });
    if (!r.ok) throw new Error('API ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    const d = j.data;

    renderNetwork(d);
    s('net-ts', now());

    chrome.storage.local.set({ netCache: { ...d, ts: Date.now() } });
  } catch (e) {
    chrome.storage.local.get('netCache', ({ netCache }) => {
      if (!netCache) return;
      renderNetwork(netCache);
      s('net-ts', 'cached');
      ['pip-height', 'pip-nodes', 'pip-burned', 'pip-bns', 'pip-pool'].forEach(dimPip);
    });
  }
}

function renderNetwork(d) {
  if (d.blockHeight)    s('n-height', d.blockHeight.toLocaleString());
  else                  dimPip('pip-height');

  if (d.activeNodes)    s('n-nodes', d.activeNodes.toLocaleString());
  else                  dimPip('pip-nodes');

  if (d.burnedBDX)      s('n-burned', (d.burnedBDX / 1e6).toFixed(3) + 'M BDX');
  else                  dimPip('pip-burned');

  if (d.totalBNS)       s('n-bns', d.totalBNS.toLocaleString());
  else                  dimPip('pip-bns');

  s('n-pool', (d.txPoolCount || 0).toString());

  if (d.blockchainSize) s('n-size', d.blockchainSize);
  if (d.baseFeeOutput)  s('n-fee', d.baseFeeOutput + ' BDX');
  if (d.flashFeeOutput) s('n-flash', d.flashFeeOutput + ' BDX');
}

function dimPip(id) {
  const e = g(id);
  if (e) { e.style.background = '#4a6080'; e.style.boxShadow = 'none'; }
}

// ── SPARKLINE ────────────────────────────────────────────────
async function fetchSparkline() {
  try {
    // Skip if cache is fresh
    const { sparkCache } = await chrome.storage.local.get('sparkCache');
    if (sparkCache && (Date.now() - sparkCache.ts < CACHE_TTL) && sparkCache.prices) {
      drawSparkline(sparkCache.prices);
      return;
    }

    const cur = currency;
    const r = await fetch(
      `${CG_BASE}/coins/beldex/market_chart?vs_currency=${cur}&days=7`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT) }
    );
    if (!r.ok) throw new Error('CG chart ' + r.status);
    const d = await r.json();
    drawSparkline(d.prices);
    chrome.storage.local.set({ sparkCache: { cur, prices: d.prices, ts: Date.now() } });
  } catch (e) {
    chrome.storage.local.get('sparkCache', ({ sparkCache }) => {
      if (sparkCache && sparkCache.prices) drawSparkline(sparkCache.prices);
    });
  }
}

function drawSparkline(prices) {
  const svg = g('sparkline-svg');
  if (!svg || !prices || prices.length < 2) return;

  const vals = prices.map(p => p[1]);
  const min = vals.reduce((a, b) => a < b ? a : b);
  const max = vals.reduce((a, b) => a > b ? a : b);
  const range = max - min || 1;
  const w = 344, h = 70, pad = 4;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const isUp = vals[vals.length - 1] >= vals[0];
  const color = isUp ? '#06d6a0' : '#ef476f';

  const areaPath = `M0,${h} L${points.join(' L')} L${w},${h} Z`;
  const linePath = `M${points.join(' L')}`;

  // Use safe DOM API for Mozilla compatibility
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');
  const lg = document.createElementNS(ns, 'linearGradient');
  lg.id = 'sfill'; lg.setAttribute('x1', '0'); lg.setAttribute('y1', '0'); lg.setAttribute('x2', '0'); lg.setAttribute('y2', '1');
  const s1 = document.createElementNS(ns, 'stop');
  s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.25');
  const s2 = document.createElementNS(ns, 'stop');
  s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
  lg.appendChild(s1); lg.appendChild(s2); defs.appendChild(lg);
  const p1 = document.createElementNS(ns, 'path');
  p1.setAttribute('d', areaPath); p1.setAttribute('fill', 'url(#sfill)');
  const p2 = document.createElementNS(ns, 'path');
  p2.setAttribute('d', linePath); p2.setAttribute('fill', 'none'); p2.setAttribute('stroke', color); p2.setAttribute('stroke-width', '1.5');
  svg.appendChild(defs); svg.appendChild(p1); svg.appendChild(p2);
}

// ── OPEN SIDE PANEL ──────────────────────────────────────────
function openSidePanel() {
  chrome.runtime.sendMessage({ action: 'openSidePanel' }).catch(() => {});
}

const chartBtn = g('open-chart-btn');
if (chartBtn) chartBtn.addEventListener('click', openSidePanel);

const spBtn = g('sp-toggle-btn');
if (spBtn) spBtn.addEventListener('click', openSidePanel);

// ── INIT ──────────────────────────────────────────────────────
fetchPrice();
fetchNetwork();
fetchSparkline();
