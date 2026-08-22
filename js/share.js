/**
 * share.js
 * ------------------------------------------------------------------
 * Everything related to getting the profile URL out into the world:
 * copy link, QR code render + download, native share sheet, and
 * direct WhatsApp/Telegram share links.
 * ------------------------------------------------------------------
 */

const ShareSheet = (() => {
  function profileUrl() {
    const username = (window.DB.get().profile.username || 'me').trim() || 'me';
    // In this static prototype there's no router, so we express the
    // "domain.com/username" concept as a query param on index.html.
    const url = new URL(window.location.href.split('?')[0]);
    url.searchParams.set('u', username);
    return url.toString();
  }

  function open() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    modal.classList.add('is-open');
    document.getElementById('shareUrlText').textContent = profileUrl();
    renderQr();
    if (window.DB) window.DB.trackShare();
  }

  function close() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('is-open');
  }

  async function copyLink() {
    const url = profileUrl();
    try {
      await navigator.clipboard.writeText(url);
      flashCopied();
    } catch {
      // Fallback for browsers/contexts without Clipboard API permission
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flashCopied();
    }
  }

  function flashCopied() {
    const btn = document.getElementById('copyLinkBtn');
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('is-success');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('is-success');
    }, 1600);
  }

  function renderQr() {
    const el = document.getElementById('qrCanvas');
    if (!el || typeof QRCode === 'undefined') return;
    el.innerHTML = '';
    // eslint-disable-next-line no-new
    new QRCode(el, {
      text: profileUrl(),
      width: 176,
      height: 176,
      colorDark: '#0B0B0B',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function downloadQr() {
    const el = document.getElementById('qrCanvas');
    const canvas = el && el.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    const username = window.DB.get().profile.username || 'profile';
    link.download = `${username}-qrcode.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function shareWhatsapp() {
    const text = encodeURIComponent(`Check out my digital business card: ${profileUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }

  function shareTelegram() {
    const url = encodeURIComponent(profileUrl());
    const text = encodeURIComponent('Check out my digital business card');
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener');
  }

  async function nativeShare() {
    const data = {
      title: window.DB.get().profile.name,
      text: 'Check out my digital business card',
      url: profileUrl()
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        window.DB.trackShare();
      } catch {
        /* user cancelled — no-op */
      }
    } else {
      copyLink();
    }
  }

  return { open, close, copyLink, downloadQr, shareWhatsapp, shareTelegram, nativeShare, profileUrl };
})();

window.ShareSheet = ShareSheet;
