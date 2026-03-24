chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clear('bdx-refresh', () => {
    chrome.alarms.create('bdx-refresh', { periodInMinutes: 5 });
  });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'bdx-refresh') refreshPrice();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'openSidePanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id }).catch(() => {});
      }
    });
  }
  return true;
});

async function refreshPrice() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=beldex&vs_currencies=usd,inr&include_24hr_change=true', {
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) return;
    const d = await r.json();
    const price = d.beldex?.usd;
    const change = d.beldex?.usd_24h_change || 0;
    if (price) {
      chrome.storage.local.set({
        priceCache: { usd: price, inr: d.beldex?.inr, chg: change, ts: Date.now() }
      });
    }
  } catch (e) {
    console.warn('[BDX] refreshPrice failed:', e.message);
  }
}
