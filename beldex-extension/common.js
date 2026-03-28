// ── Shared helpers for popup & sidepanel ─────────────────────
const g = id => document.getElementById(id);
const s = (id, v) => { const e = g(id); if (e) e.textContent = v; };
const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });

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

// ── API constants ────────────────────────────────────────────
const BDX_API_URL = 'https://bdx-companion-api.vercel.app/api/explorer';
const BDX_API_KEY = 'bdx-comp-2024-s3cur3-k3y';
const CG_BASE = 'https://api.coingecko.com/api/v3';
const FETCH_TIMEOUT = 10000;
const CACHE_TTL = 300000; // 5 min — matches background alarm interval
