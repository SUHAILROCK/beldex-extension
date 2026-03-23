(function () {
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

  function tryShow() {
    if (document.getElementById('bdx-alert')) return;
    const isWithdraw = /withdraw|send|transfer/i.test(window.location.href + document.title);
    if (!isWithdraw) return;
    showAlert();
  }

  function showAlert() {
    const div = document.createElement('div');
    div.id = 'bdx-alert';
    div.style.cssText = 'position:fixed;bottom:20px;right:20px;width:290px;background:#080f1a;border:1px solid rgba(245,166,35,0.3);border-radius:12px;padding:14px 16px;z-index:2147483647;font-family:system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.6)';

    // Header row
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';

    const title = document.createElement('span');
    title.style.cssText = 'font-size:12px;font-weight:700;color:#e2ecf8';
    title.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px"><rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>';
    title.appendChild(document.createTextNode('Beldex Privacy Tip'));

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:#4a6080;cursor:pointer;font-size:18px;line-height:1;padding:0';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => div.remove());

    hdr.appendChild(title);
    hdr.appendChild(closeBtn);

    // Description
    const desc = document.createElement('p');
    desc.style.cssText = 'font-size:11px;color:#4a6080;line-height:1.5;margin-bottom:10px';
    desc.appendChild(document.createTextNode('Withdrawing from '));
    const exName = document.createElement('strong');
    exName.style.color = '#f5a623';
    exName.textContent = name;
    desc.appendChild(exName);
    desc.appendChild(document.createTextNode('? Your transaction is publicly visible. Withdraw to '));
    const bdxName = document.createElement('strong');
    bdxName.style.color = '#e2ecf8';
    bdxName.textContent = 'Beldex';
    desc.appendChild(bdxName);
    desc.appendChild(document.createTextNode(' for untraceable transfers.'));

    // CTA button
    const cta = document.createElement('button');
    cta.style.cssText = 'width:100%;background:linear-gradient(135deg,#f5a623,#ffd166);color:#000;border:none;border-radius:6px;padding:8px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.04em';
    cta.textContent = 'LEARN ABOUT BELDEX \u2192';
    cta.addEventListener('click', () => window.open('https://beldex.io', '_blank'));

    // Footer links
    const links = document.createElement('div');
    links.style.cssText = 'display:flex;justify-content:center;gap:12px;margin-top:8px';
    const linkData = [
      ['Beldex.io', 'https://beldex.io'],
      ['BChat', 'https://bchat.beldex.io'],
      ['Explorer', 'https://explorer.beldex.io']
    ];
    for (const [text, url] of linkData) {
      const a = document.createElement('a');
      a.textContent = text;
      a.href = '#';
      a.style.cssText = 'font-size:9px;color:#4a6080;text-decoration:none';
      a.addEventListener('click', (e) => { e.preventDefault(); window.open(url, '_blank'); });
      links.appendChild(a);
    }

    div.appendChild(hdr);
    div.appendChild(desc);
    div.appendChild(cta);
    div.appendChild(links);
    document.body.appendChild(div);

    setTimeout(() => { if (div.parentNode) div.remove(); }, 25000);
  }

  // Initial check
  tryShow();

  // SPA navigation detection — exchanges are single-page apps
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      tryShow();
    }
  });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', tryShow);
})();
