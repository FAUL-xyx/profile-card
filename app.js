/**
 * app.js — public profile page controller
 * ------------------------------------------------------------------
 */
(function () {
  const heroSection = document.getElementById('heroSection');
  const linkGrid = document.getElementById('linkGrid');
  const brandLogo = document.getElementById('brandLogo');

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  function applyTheme(theme) {
    const root = document.documentElement.style;
    root.setProperty('--color-primary', theme.primary);
    root.setProperty('--color-accent', theme.accent);
    root.setProperty('--color-bg', theme.background);
    root.setProperty('--radius', `${theme.radius}px`);
    root.setProperty('--shadow-intensity', theme.shadow / 100);
    document.body.dataset.preset = theme.preset;
  }

  function render(data) {
    applyTheme(data.theme);

    heroSection.innerHTML = window.CardsUI.renderHeroCard(data);

    const sorted = [...data.links].filter(l => l.enabled).sort((a, b) => a.order - b.order);
    linkGrid.innerHTML = sorted.map((l, i) => window.CardsUI.renderLinkCard(l, i)).join('');

    bindLinkClicks(sorted);
    bindHeroActions();

    window.Motion.attachTilt(document);
  }

  function bindLinkClicks(links) {
    linkGrid.querySelectorAll('.link-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.linkId;
        const link = links.find(l => l.id === id);
        if (!link) return;
        window.DB.trackClick(id);
        el.classList.add('is-pressed');
        setTimeout(() => {
          const href = window.CardsUI.linkHref(link);
          if (href && href !== '#') window.open(href, '_blank', 'noopener');
        }, 140);
      });
    });
  }

  function bindHeroActions() {
    const connectBtn = document.getElementById('connectBtn');
    const shareBtn = document.getElementById('shareBtn');
    const heroShareBtn = document.getElementById('heroShareBtn');

    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        const { email, whatsapp } = window.DB.get().profile;
        if (whatsapp) {
          window.open(`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`, '_blank', 'noopener');
        } else if (email) {
          window.location.href = `mailto:${email}`;
        }
      });
    }
    [shareBtn, heroShareBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => window.ShareSheet.open());
    });
  }

  function bindModal() {
    document.querySelectorAll('[data-close-modal]').forEach(el =>
      el.addEventListener('click', () => window.ShareSheet.close())
    );
    document.getElementById('copyLinkBtn').addEventListener('click', () => window.ShareSheet.copyLink());
    document.getElementById('downloadQrBtn').addEventListener('click', () => window.ShareSheet.downloadQr());
    document.getElementById('waShareBtn').addEventListener('click', () => window.ShareSheet.shareWhatsapp());
    document.getElementById('tgShareBtn').addEventListener('click', () => window.ShareSheet.shareTelegram());
    document.getElementById('nativeShareBtn').addEventListener('click', () => window.ShareSheet.nativeShare());
  }

  function init() {
    const data = window.DB.get();
    render(data);
    bindModal();
    window.DB.trackView();

    // Intro sequence (runs once on first paint)
    window.Motion.playIntro({
      bg: document.body,
      logo: brandLogo,
      name: document.querySelector('.hero-card__name'),
      hero: document.getElementById('heroCard'),
      socialWrap: linkGrid
    });

    // Keep this tab in sync if data changes elsewhere (e.g. admin open
    // in another tab) — mirrors what the live-preview iframe relies on.
    window.addEventListener('storage', (e) => {
      if (e.key === 'dbc_data_v1') {
        window.DB._data = window.DB.load();
        render(window.DB.get());
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
