chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('bdx-refresh', { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'bdx-refresh') refreshPrice();
});

async function refreshPrice() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=beldex&vs_currencies=usd,inr&include_24hr_change=true');
    if (!r.ok) return;
    const d = await r.json();
    const price = d.beldex?.usd;
    const change = d.beldex?.usd_24h_change || 0;
    if (price) {
      chrome.storage.local.set({
        priceCache: { usd: price, inr: d.beldex?.inr, chg: change, ts: Date.now() }
      });
    }
  } catch (e) {}
}
