(function () {
  if (document.getElementById('bdx-alert')) return;
  const isWithdraw = /withdraw|send|transfer/i.test(window.location.href + document.title);
  if (!isWithdraw) return;

  const host = window.location.hostname;
  const names = {
    'binance.com':'Binance','coinbase.com':'Coinbase','kucoin.com':'KuCoin',
    'bybit.com':'Bybit','okx.com':'OKX','gate.io':'Gate.io',
    'mexc.com':'MEXC','bitget.com':'Bitget','crypto.com':'Crypto.com'
  };
  let name = null;
  for (const [d, n] of Object.entries(names)) {
    if (host.includes(d)) { name = n; break; }
  }
  if (!name) return;

  const div = document.createElement('div');
  div.id = 'bdx-alert';
  div.style.cssText = 'position:fixed;bottom:20px;right:20px;width:290px;background:#080f1a;border:1px solid rgba(245,166,35,0.3);border-radius:12px;padding:14px 16px;z-index:2147483647;font-family:system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.6)';
  div.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:12px;font-weight:700;color:#e2ecf8"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>Beldex Privacy Tip</span><button id="bdx-close" style="background:none;border:none;color:#4a6080;cursor:pointer;font-size:18px;line-height:1;padding:0">\u00d7</button></div><p style="font-size:11px;color:#4a6080;line-height:1.5;margin-bottom:10px">Withdrawing from <strong style="color:#f5a623">' + name + '</strong>? Your transaction is publicly visible. Withdraw to <strong style="color:#e2ecf8">Beldex</strong> for untraceable transfers.</p><button id="bdx-learn" style="width:100%;background:linear-gradient(135deg,#f5a623,#ffd166);color:#000;border:none;border-radius:6px;padding:8px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.04em">LEARN ABOUT BELDEX \u2192</button><div style="display:flex;justify-content:center;gap:12px;margin-top:8px"><a id="bdx-lk-site" href="#" style="font-size:9px;color:#4a6080;text-decoration:none">Beldex.io</a><a id="bdx-lk-bchat" href="#" style="font-size:9px;color:#4a6080;text-decoration:none">BChat</a><a id="bdx-lk-explorer" href="#" style="font-size:9px;color:#4a6080;text-decoration:none">Explorer</a></div>';
  document.body.appendChild(div);

  document.getElementById('bdx-close').onclick = () => div.remove();
  document.getElementById('bdx-learn').onclick = () => window.open('https://beldex.io', '_blank');
  document.getElementById('bdx-lk-site').onclick = (e) => { e.preventDefault(); window.open('https://beldex.io', '_blank'); };
  document.getElementById('bdx-lk-bchat').onclick = (e) => { e.preventDefault(); window.open('https://bchat.beldex.io', '_blank'); };
  document.getElementById('bdx-lk-explorer').onclick = (e) => { e.preventDefault(); window.open('https://explorer.beldex.io', '_blank'); };
  setTimeout(() => { if (div.parentNode) div.remove(); }, 25000);
})();
