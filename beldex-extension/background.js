// ── Constants (duplicated here since service workers can't load common.js) ──
const CG_URL  = 'https://api.coingecko.com/api/v3';
const NET_API  = 'https://bdx-companion-api.vercel.app/api/explorer';
const NET_KEY  = 'bdx-comp-2024-s3cur3-k3y';
const TIMEOUT  = 10000;

// ── Lifecycle ─────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener((details) => {
  chrome.alarms.clear('bdx-refresh', () => {
    chrome.alarms.create('bdx-refresh', { periodInMinutes: 5 });
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  // Only warm cache on first install, not every update
  if (details.reason === 'install') refreshAll();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.clear('bdx-refresh', () => {
    chrome.alarms.create('bdx-refresh', { periodInMinutes: 5 });
  });
  refreshAll();
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'bdx-refresh') refreshAll();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openSidePanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.sidePanel.open({ tabId: tabs[0].id }).catch(() => {});
    });
  }
  return true;
});

// ── Parallel pre-fetch: price + market data + network ─────────
async function refreshAll() {
  const ts = Date.now();

  // Fire all 3 requests simultaneously — each settles independently
  const [priceR, marketR, netR] = await Promise.allSettled([
    fetch(`${CG_URL}/simple/price?ids=beldex&vs_currencies=usd,inr&include_24hr_change=true`, {
      signal: AbortSignal.timeout(TIMEOUT)
    }).then(r => r.ok ? r.json() : Promise.reject('price-http-' + r.status)),

    fetch(`${CG_URL}/coins/beldex?localization=false&tickers=false&community_data=false&developer_data=false`, {
      signal: AbortSignal.timeout(TIMEOUT)
    }).then(r => r.ok ? r.json() : Promise.reject('market-http-' + r.status)),

    fetch(NET_API, {
      headers: { 'x-api-key': NET_KEY },
      signal: AbortSignal.timeout(TIMEOUT)
    }).then(r => r.ok ? r.json() : Promise.reject('net-http-' + r.status))
  ]);

  // Cache price
  if (priceR.status === 'fulfilled') {
    const d = priceR.value;
    if (d.beldex?.usd) {
      chrome.storage.local.set({
        priceCache: { usd: d.beldex.usd, inr: d.beldex.inr, chg: d.beldex.usd_24h_change || 0, ts }
      });
    }
  } else {
    console.warn('[BDX] price fetch failed:', priceR.reason);
  }

  // Cache full market data (market cap, vol, high/low, ATH, supply)
  if (marketR.status === 'fulfilled') {
    const d = marketR.value;
    if (d.market_data) {
      chrome.storage.local.set({ marketCache: { data: d.market_data, ts } });
    }
  } else {
    console.warn('[BDX] market fetch failed:', marketR.reason);
  }

  // Cache network stats
  if (netR.status === 'fulfilled') {
    const j = netR.value;
    if (j.ok) {
      chrome.storage.local.set({ netCache: { ...j.data, ts } });
    }
  } else {
    console.warn('[BDX] network fetch failed:', netR.reason);
  }
}
