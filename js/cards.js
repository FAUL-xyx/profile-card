/**
 * cards.js
 * ------------------------------------------------------------------
 * Pure rendering functions shared by the public page (app.js) and the
 * live preview pane inside the admin dashboard (editor.js). Given the
 * current data object, these build the DOM — no storage access here.
 * ------------------------------------------------------------------
 */

function iconSvg(name) {
  // Minimal inline icon set (no external icon request needed at runtime).
  // Falls back to a generic link glyph for anything not listed.
  const icons = {
    instagram: '<circle cx="12" cy="12" r="4"/><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.4c0-1 .3-1.6 1-2.2-3.3-.4-6.7-1.6-6.7-7A5.4 5.4 0 0 1 12 5.5a5 5 0 0 1 .1-3.4s1.1-.3 3.5 1.3a12 12 0 0 1 6.4 0C24.4 2 25.5 2.3 25.5 2.3" transform="translate(-6)"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
    'music-2': '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    youtube: '<rect x="2" y="6" width="20" height="12" rx="4"/><path d="M10 9.5v5l5-2.5-5-2.5z" fill="currentColor" stroke="none"/>',
    whatsapp: '<path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1.2 3.6A8.4 8.4 0 0 1 21 11.5z"/><path d="M8.5 9c.3 2.9 2.6 5.2 5.5 5.5"/>',
    'message-circle': '<path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1.2 3.6A8.4 8.4 0 0 1 21 11.5z"/>',
    telegram: '<path d="M22 3 2 11l6 2m14-10-4 17-8-6m12-11L8 13m0 0v6"/>',
    send: '<path d="M22 3 2 11l6 2m14-10-4 17-8-6m12-11L8 13m0 0v6"/>',
    discord: '<rect x="3" y="7" width="18" height="12" rx="6"/><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>',
    'gamepad-2': '<rect x="2" y="8" width="20" height="10" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
    gamepad: '<rect x="2" y="8" width="20" height="10" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14.5" r="1" fill="currentColor" stroke="none"/>',
    facebook: '<path d="M14 21v-7h2.5l.5-3H14V9c0-.9.3-1.5 1.7-1.5H17V4.8C16.6 4.7 15.6 4.6 14.5 4.6 12 4.6 10.3 6.1 10.3 8.7V11H8v3h2.3v7z"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 10v7M7 7v.01M11 17v-4.5c0-1.4 1-2.5 2.5-2.5s2.5 1.1 2.5 2.5V17M11 10.5V17"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
    twitter: '<path d="M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 0 0 1.8-2.2 8 8 0 0 1-2.5 1 4 4 0 0 0-6.9 3.6A11.4 11.4 0 0 1 3.9 4.9a4 4 0 0 0 1.3 5.4c-.6 0-1.2-.2-1.7-.5v.1a4 4 0 0 0 3.3 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.8 2.8A8 8 0 0 1 2 18.6a11.4 11.4 0 0 0 6.2 1.8c7.4 0 11.5-6.3 11.5-11.7v-.5c.8-.6 1.5-1.3 2.3-2.3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M6 3h4l1.5 5-2.5 1.5a13 13 0 0 0 6 6L16.5 13l5 1.5v4a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3z"/>',
    link: '<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/>',
    'link-2': '<path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/>',
    swords: '<path d="m14.5 4 5.5 5.5-9 9-2-2M4 4l6.5 6.5m3 3L20 20m-16 0 6-6"/>',
    crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    pickaxe: '<path d="M15 4c3 1 5.5 3.5 6 6-3 .5-6-1-8-3m-2 2L4 16l1 1 7-6.5M9 15l3 3"/>',
    sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>'
  };
  const path = icons[name] || icons.default || icons.link;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function statusLabel(status) {
  return { available: 'Available for work', busy: 'Currently busy', offline: 'Offline' }[status] || 'Available';
}

function renderHeroCard(data) {
  const { profile } = data;
  const initials = (profile.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `
    <div class="hero-card" id="heroCard" data-tilt>
      <div class="hero-card__layer hero-card__bg"></div>
      <div class="hero-card__layer hero-card__ornament" aria-hidden="true">
        <svg viewBox="0 0 400 240" preserveAspectRatio="none"><path d="M0 200 C 100 150, 300 250, 400 190" /></svg>
      </div>
      <div class="hero-card__content">
        <div class="hero-card__top">
          <div class="hero-card__avatar" data-depth="40">
            ${profile.avatar ? `<img src="${escapeAttr(profile.avatar)}" alt="${escapeAttr(profile.name)}">` : `<span>${escapeHtml(initials)}</span>`}
          </div>
          <button class="icon-btn hero-card__share" id="heroShareBtn" title="Share card" aria-label="Share card" data-depth="20">
            ${iconSvg('link-2')}
          </button>
        </div>
        <div class="hero-card__body" data-depth="30">
          <h1 class="hero-card__name">${escapeHtml(profile.name)}</h1>
          <p class="hero-card__title">${escapeHtml(profile.title)}</p>
          <p class="hero-card__bio">${escapeHtml(profile.bio)}</p>
        </div>
        <div class="hero-card__status" data-depth="20">
          <span class="status-dot status-dot--${escapeAttr(profile.status)}"></span>
          <span>${escapeHtml(statusLabel(profile.status))}</span>
        </div>
        <div class="hero-card__actions" data-depth="50">
          <button class="btn btn--primary" id="connectBtn">Connect</button>
          <button class="btn btn--ghost" id="shareBtn">Share Card</button>
        </div>
      </div>
    </div>
  `;
}

function renderLinkCard(link, index) {
  const meta = linkMeta(link);
  return `
    <button class="link-card" data-tilt data-link-id="${escapeAttr(link.id)}" data-category="${escapeAttr(link.category)}"
      style="--stagger:${index}">
      <span class="link-card__icon" data-depth="30">${iconSvg(link.icon || 'link-2')}</span>
      <span class="link-card__text" data-depth="15">
        <span class="link-card__label">${escapeHtml(meta.label)}</span>
        <span class="link-card__username">${escapeHtml(meta.sub)}</span>
        ${link.description ? `<span class="link-card__desc">${escapeHtml(link.description)}</span>` : ''}
      </span>
      <span class="link-card__arrow" data-depth="10" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </button>
  `;
}

function linkMeta(link) {
  if (link.category === 'game') {
    const sub = [link.username, link.gameId ? `ID: ${link.gameId}` : '', link.server ? `Server ${link.server}` : '']
      .filter(Boolean).join(' · ');
    return { label: link.label, sub };
  }
  return { label: link.label, sub: link.username || (link.url ? cleanUrl(link.url) : '') };
}

function cleanUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function linkHref(link) {
  if (link.category === 'game') {
    return link.url || '#';
  }
  return link.url || '#';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(str = '') {
  return escapeHtml(str);
}

window.CardsUI = {
  iconSvg, renderHeroCard, renderLinkCard, linkMeta, linkHref, statusLabel, escapeHtml
};
