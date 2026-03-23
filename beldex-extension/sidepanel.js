// ── helpers ──────────────────────────────────────────────────
const g = id => document.getElementById(id);
const s = (id, v) => { const e = g(id); if (e) e.textContent = v; };
const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

let priceUSD = 0, priceINR = 0, currency = 'usd';
let marketData = null;
let chart = null, series = null, chartType = 'area';
let currentDays = 7;

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

// ── CURRENCY SWITCH ──────────────────────────────────────────
document.querySelectorAll('.csw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currency = btn.dataset.cur;
    document.querySelectorAll('.csw-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    updatePriceDisplay();
    fetchChartData(currentDays);
  });
});

function updatePriceDisplay() {
  const p = currency === 'inr' ? priceINR : priceUSD;
  if (!p) return;
  s('sp-price', fp(p, currency));
  const inrRow = g('sp-inr-row');
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
    s('sp-mcap', fc(mcap, cur));
    s('sp-vol', fc(vol, cur));
    s('sp-h24', fp(h24, cur));
    s('sp-l24', fp(l24, cur));
    s('sp-ath', fp(ath, cur));
    const sup = m.circulating_supply;
    if (sup) {
      if (cur === 'inr') {
        if (sup >= 1e7) s('sp-sup', (sup / 1e7).toFixed(2) + ' Cr BDX');
        else if (sup >= 1e5) s('sp-sup', (sup / 1e5).toFixed(2) + ' L BDX');
        else s('sp-sup', sup.toLocaleString('en-IN') + ' BDX');
      } else {
        s('sp-sup', (sup / 1e9).toFixed(2) + 'B BDX');
      }
    }
  }
}

// ── CHART ────────────────────────────────────────────────────
function initChart() {
  const container = g('chart-container');
  if (!container || typeof LightweightCharts === 'undefined') return;

  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: 300,
    layout: {
      background: { color: '#080f1a' },
      textColor: '#4a6080',
      fontFamily: 'Space Grotesk, sans-serif',
      fontSize: 10,
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.03)' },
      horzLines: { color: 'rgba(255,255,255,0.03)' },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(245,166,35,0.3)', width: 1, style: 2 },
      horzLine: { color: 'rgba(245,166,35,0.3)', width: 1, style: 2 },
    },
    timeScale: {
      borderColor: 'rgba(255,255,255,0.06)',
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderColor: 'rgba(255,255,255,0.06)',
    },
    handleScroll: { vertTouchDrag: false },
  });

  createSeries();

  // Resize observer
  const ro = new ResizeObserver(() => {
    chart.applyOptions({ width: container.clientWidth });
  });
  ro.observe(container);
}

function createSeries() {
  if (!chart) return;
  // Remove old series
  if (series) {
    chart.removeSeries(series);
    series = null;
  }

  if (chartType === 'area') {
    series = chart.addAreaSeries({
      topColor: 'rgba(245, 166, 35, 0.35)',
      bottomColor: 'rgba(245, 166, 35, 0.0)',
      lineColor: '#f5a623',
      lineWidth: 2,
    });
  } else {
    series = chart.addCandlestickSeries({
      upColor: '#06d6a0',
      downColor: '#ef476f',
      borderUpColor: '#06d6a0',
      borderDownColor: '#ef476f',
      wickUpColor: '#06d6a0',
      wickDownColor: '#ef476f',
    });
  }
}

async function fetchChartData(days) {
  currentDays = days;
  const loading = g('chart-loading');
  if (loading) loading.classList.remove('hide');

  try {
    const cur = currency;
    const url = `https://api.coingecko.com/api/v3/coins/beldex/market_chart?vs_currency=${cur}&days=${days}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('CG chart ' + r.status);
    const d = await r.json();

    if (!chart) initChart();
    if (!series) createSeries();

    if (chartType === 'area') {
      // Line/area data: [[timestamp, price], ...]
      const data = d.prices.map(([t, v]) => ({
        time: Math.floor(t / 1000),
        value: v,
      }));
      series.setData(data);
    } else {
      // Build OHLC candles from price data
      const candles = buildCandles(d.prices, days);
      series.setData(candles);
    }

    chart.timeScale().fitContent();

    // Cache
    chrome.storage.local.set({ chartCache: { days, cur, data: d, ts: Date.now() } });
  } catch (e) {
    // Try cache
    chrome.storage.local.get('chartCache', ({ chartCache }) => {
      if (!chartCache || chartCache.days !== days) return;
      if (!chart) initChart();
      if (!series) createSeries();
      if (chartType === 'area') {
        const data = chartCache.data.prices.map(([t, v]) => ({
          time: Math.floor(t / 1000),
          value: v,
        }));
        series.setData(data);
      }
      chart.timeScale().fitContent();
    });
  }

  if (loading) loading.classList.add('hide');
}

function buildCandles(prices, days) {
  // Group prices into candle intervals
  const interval = days <= 1 ? 3600 : days <= 7 ? 14400 : days <= 30 ? 86400 : 604800;
  const buckets = {};

  for (const [t, v] of prices) {
    const sec = Math.floor(t / 1000);
    const bucket = Math.floor(sec / interval) * interval;
    if (!buckets[bucket]) {
      buckets[bucket] = { time: bucket, open: v, high: v, low: v, close: v };
    } else {
      const c = buckets[bucket];
      c.high = Math.max(c.high, v);
      c.low = Math.min(c.low, v);
      c.close = v;
    }
  }

  return Object.values(buckets).sort((a, b) => a.time - b.time);
}

// ── RANGE BUTTONS ────────────────────────────────────────────
document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    fetchChartData(parseInt(btn.dataset.days));
  });
});

// ── CHART TYPE BUTTONS ───────────────────────────────────────
g('ct-area').addEventListener('click', () => {
  if (chartType === 'area') return;
  chartType = 'area';
  g('ct-area').classList.add('on');
  g('ct-candle').classList.remove('on');
  createSeries();
  fetchChartData(currentDays);
});

g('ct-candle').addEventListener('click', () => {
  if (chartType === 'candle') return;
  chartType = 'candle';
  g('ct-candle').classList.add('on');
  g('ct-area').classList.remove('on');
  createSeries();
  fetchChartData(currentDays);
});

// ── COINGECKO PRICE ──────────────────────────────────────────
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
    const badge = g('sp-chg');
    if (badge) {
      badge.className = 'sp-change ' + (chg > 0 ? 'up' : chg < 0 ? 'dn' : 'nt');
      badge.textContent = (chg >= 0 ? '▲ +' : '▼ ') + Math.abs(chg).toFixed(2) + '%  24H';
    }

    s('sp-sup', (m.circulating_supply / 1e9).toFixed(2) + 'B BDX');
    s('sp-ts', now());

    updatePriceDisplay();
  } catch (e) {
    chrome.storage.local.get('priceCache', ({ priceCache }) => {
      if (!priceCache) return;
      priceUSD = priceCache.usd;
      priceINR = priceCache.inr || priceCache.usd * 84;
      updatePriceDisplay();
      s('sp-ts', 'cached');
    });
  }
}

// ── NETWORK DATA ─────────────────────────────────────────────
async function fetchNetwork() {
  try {
    const r = await fetch('https://bdx-companion-api.vercel.app/api/explorer', {
      headers: { 'x-api-key': 'bdx-comp-2024-s3cur3-k3y' }
    });
    if (!r.ok) throw new Error('API ' + r.status);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    const d = j.data;

    if (d.blockHeight) s('sp-height', d.blockHeight.toLocaleString());
    if (d.activeNodes) s('sp-nodes', d.activeNodes.toLocaleString());
    if (d.burnedBDX)   s('sp-burned', (d.burnedBDX / 1e6).toFixed(3) + 'M BDX');
    if (d.totalBNS)    s('sp-bns', d.totalBNS.toLocaleString());
    s('sp-pool', (d.txPoolCount || 0).toString());
    if (d.baseFeeOutput) s('sp-fee', d.baseFeeOutput + ' BDX');
    s('sp-net-ts', now());
  } catch (e) {
    chrome.storage.local.get('netCache', ({ netCache }) => {
      if (!netCache) return;
      if (netCache.blockHeight) s('sp-height', netCache.blockHeight.toLocaleString());
      if (netCache.activeNodes) s('sp-nodes', netCache.activeNodes.toLocaleString());
      if (netCache.burnedBDX)   s('sp-burned', (netCache.burnedBDX / 1e6).toFixed(3) + 'M BDX');
      if (netCache.totalBNS)    s('sp-bns', netCache.totalBNS.toLocaleString());
      s('sp-pool', (netCache.txPoolCount || 0).toString());
      if (netCache.baseFeeOutput) s('sp-fee', netCache.baseFeeOutput + ' BDX');
      s('sp-net-ts', 'cached');
    });
  }
}

// ── INIT ─────────────────────────────────────────────────────
fetchPrice();
fetchNetwork();
fetchChartData(7);
