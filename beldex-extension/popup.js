// ── helpers ──────────────────────────────────────────────────
const g = id => document.getElementById(id);
const s = (id, v) => { const e = g(id); if (e) e.textContent = v; };
const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

let priceUSD = 0, priceINR = 0, currency = 'usd';
let marketData = null; // store full market data for currency switching

function fp(n, cur) {
  cur = cur || 'usd';
  if (!n && n !== 0) return '—';
  const sym = cur === 'inr' ? '₹' : '$';
  const locale = cur === 'inr' ? 'en-IN' : 'en-US';
  if (n < 0.001) return sym + n.toFixed(6);
  if (n < 0.01)  return sym + n.toFixed(5);
  if (n < 1)     return sym + n.toFixed(4);
  return sym + n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fc(n, cur) {
  if (!n) return '—';
  if (cur === 'inr') {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
    return '₹' + n.toLocaleString('en-IN');
  }
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString('en-US');
}

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
  // Update stats for current currency
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
      { signal: AbortSignal.timeout(10000) }
    );

    if (!r.ok) throw new Error('HTTP ' + r.status);
    const html = await r.text();

    if (html.includes('Not Available:')) {
      showResult('taken', fullName);
    } else if (html.includes('<label>Owner')) {
      // Has an owner — check Wallet row specifically
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

  // Set desc with a link — need innerHTML for the link
  const desc = g('bns-desc');
  if (desc) {
    desc.innerHTML = 'Could not auto-check. <a id="bns-explorer-link" href="#">Open explorer.beldex.io/bns →</a>';
    const link = g('bns-explorer-link');
    if (link) {
      link.addEventListener('click', e => {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://explorer.beldex.io/bns' });
      });
    }
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
    const r = await fetch(
      'https://api.coingecko.com/api/v3/coins/beldex?localization=false&tickers=false&community_data=false&developer_data=false'
    );
    if (!r.ok) throw new Error('CG ' + r.status);
    const d = await r.json();
    const m = d.market_data;

    priceUSD = m.current_price.usd;
    priceINR = m.current_price.inr || priceUSD * 84;
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
    // Load from cache
    chrome.storage.local.get('priceCache', ({ priceCache }) => {
      if (!priceCache) return;
      priceUSD = priceCache.usd;
      priceINR = priceCache.inr || priceCache.usd * 84;
      updatePriceDisplay();
      s('price-ts', 'cached · ' + new Date(priceCache.ts).toLocaleTimeString());
    });
  }
}

// ── NETWORK DATA ──────────────────────────────────────────────
async function fetchNetwork() {
  try {
    const r = await fetch('https://bdx-companion-api.vercel.app/api/explorer');
    if (!r.ok) throw new Error('API ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    const d = j.data;

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
    s('net-ts', now());

    chrome.storage.local.set({ netCache: { ...d, ts: Date.now() } });
  } catch (e) {
    // Load from cache
    chrome.storage.local.get('netCache', ({ netCache }) => {
      if (!netCache) return;
      if (netCache.blockHeight) s('n-height', netCache.blockHeight.toLocaleString());
      if (netCache.activeNodes)  s('n-nodes', netCache.activeNodes.toLocaleString());
      if (netCache.burnedBDX)    s('n-burned', (netCache.burnedBDX / 1e6).toFixed(3) + 'M BDX');
      if (netCache.totalBNS)     s('n-bns', netCache.totalBNS.toLocaleString());
      s('n-pool', (netCache.txPoolCount || 0).toString());
      if (netCache.blockchainSize) s('n-size', netCache.blockchainSize);
      if (netCache.baseFeeOutput)  s('n-fee', netCache.baseFeeOutput + ' BDX');
      if (netCache.flashFeeOutput) s('n-flash', netCache.flashFeeOutput + ' BDX');
      s('net-ts', 'cached');
      ['pip-height', 'pip-nodes', 'pip-burned', 'pip-bns', 'pip-pool'].forEach(dimPip);
    });
  }
}

function dimPip(id) {
  const e = g(id);
  if (e) { e.style.background = '#4a6080'; e.style.boxShadow = 'none'; }
}

// ── INIT ──────────────────────────────────────────────────────
fetchPrice();
fetchNetwork();
