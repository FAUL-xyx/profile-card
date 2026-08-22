/**
 * editor.js — admin dashboard controller
 * ------------------------------------------------------------------
 * The live-preview iframe (index.html) updates itself: it already
 * listens for the browser's native `storage` event in app.js, and
 * every DB.persist() call in this file writes to the same
 * localStorage key, which fires that event in the iframe's context.
 * No manual postMessage plumbing needed.
 * ------------------------------------------------------------------
 */
(function () {
  const THEME_PRESETS = [
    { key: 'luxury-gold', name: 'Luxury Gold', primary: '#C9A24B', accent: '#E8C97A', background: '#0B0B0B' },
    { key: 'midnight', name: 'Midnight', primary: '#7C9CBF', accent: '#A8C4E0', background: '#0B0F14' },
    { key: 'platinum', name: 'Platinum', primary: '#C7C7C7', accent: '#EDEDED', background: '#121212' },
    { key: 'cyber', name: 'Cyber', primary: '#6EE7B7', accent: '#22D3EE', background: '#090909' },
    { key: 'minimal', name: 'Minimal', primary: '#D8D2C4', accent: '#FFFFFF', background: '#101010' },
    { key: 'corporate', name: 'Corporate', primary: '#7C93C9', accent: '#A9BEE8', background: '#0C0E14' }
  ];

  const GAME_PRESETS = ['Mobile Legends', 'Free Fire', 'PUBG Mobile', 'Roblox', 'Minecraft', 'Steam', 'Valorant', 'Genshin Impact', 'Other'];
  const SOCIAL_PRESETS = [
    { platform: 'instagram', label: 'Instagram', icon: 'instagram' },
    { platform: 'github', label: 'GitHub', icon: 'github' },
    { platform: 'tiktok', label: 'TikTok', icon: 'music-2' },
    { platform: 'youtube', label: 'YouTube', icon: 'youtube' },
    { platform: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
    { platform: 'telegram', label: 'Telegram', icon: 'send' },
    { platform: 'discord', label: 'Discord', icon: 'gamepad-2' },
    { platform: 'facebook', label: 'Facebook', icon: 'facebook' },
    { platform: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { platform: 'website', label: 'Website', icon: 'globe' },
    { platform: 'custom', label: 'Custom', icon: 'link-2' }
  ];

  let activeLinkModalId = null; // null = "add" mode
  let activeLinkModalCategory = 'social';

  // ============================= GATE =============================
  function initGate() {
    const gate = document.getElementById('gate');
    const adminRoot = document.getElementById('adminRoot');
    const input = document.getElementById('gateInput');
    const btn = document.getElementById('gateBtn');
    const error = document.getElementById('gateError');
    const subtitle = document.getElementById('gateSubtitle');

    const hasPin = window.Auth.hasPin();
    subtitle.textContent = hasPin
      ? 'Masukkan PIN untuk membuka dashboard.'
      : 'Buat PIN 4-6 digit untuk melindungi dashboard ini.';

    if (hasPin && window.Auth.isUnlocked()) {
      enter();
      return;
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

    function submit() {
      const val = input.value.trim();
      if (val.length < 4) {
        error.textContent = 'PIN minimal 4 digit.';
        return;
      }
      if (!hasPin) {
        window.Auth.setPin(val);
        window.Auth.unlock();
        enter();
        return;
      }
      if (window.Auth.checkPin(val)) {
        window.Auth.unlock();
        enter();
      } else {
        error.textContent = 'PIN salah, coba lagi.';
        input.value = '';
      }
    }

    function enter() {
      gate.hidden = true;
      adminRoot.hidden = false;
      initDashboard();
    }
  }

  // ============================= NAV =============================
  function initNav() {
    const items = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.panel');

    function goto(name) {
      items.forEach(i => i.classList.toggle('is-active', i.dataset.panel === name));
      panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === name));
    }

    items.forEach(i => i.addEventListener('click', () => goto(i.dataset.panel)));
    document.querySelectorAll('[data-goto]').forEach(el =>
      el.addEventListener('click', () => goto(el.dataset.goto))
    );

    document.getElementById('lockBtn').addEventListener('click', () => {
      window.Auth.lock();
      window.location.reload();
    });

    document.getElementById('mobilePreviewToggle').addEventListener('click', () => {
      document.querySelector('.admin__preview').classList.toggle('is-mobile-open');
    });
  }

  // ============================= PROFILE =============================
  function initProfile() {
    const ids = ['name', 'username', 'title', 'bio', 'avatar', 'logo', 'email', 'whatsapp', 'status'];
    const data = window.DB.get().profile;
    ids.forEach(key => {
      const el = document.getElementById(`f_${key}`);
      if (el) el.value = data[key] || '';
    });

    ids.forEach(key => {
      const el = document.getElementById(`f_${key}`);
      if (!el) return;
      el.addEventListener('input', debounce(() => {
        window.DB.updateProfile({ [key]: el.value });
        refreshDashboardStats();
      }, 150));
    });
  }

  // ============================= LINKS / GAMING =============================
  function renderLinksLists() {
    const all = [...window.DB.get().links].sort((a, b) => a.order - b.order);
    renderList(document.getElementById('linksList'), all.filter(l => l.category !== 'game'));
    renderList(document.getElementById('gamesList'), all.filter(l => l.category === 'game'));
    refreshDashboardStats();
  }

  function renderList(ul, links) {
    if (!ul) return;
    ul.innerHTML = links.map(l => linkRowHtml(l)).join('') ||
      `<li class="link-row" style="justify-content:center;color:var(--color-text-muted);font-size:13px;">Belum ada item. Klik "+ Add" untuk menambah.</li>`;

    ul.querySelectorAll('[data-toggle-id]').forEach(input =>
      input.addEventListener('change', () => {
        window.DB.updateLink(input.dataset.toggleId, { enabled: input.checked });
        refreshDashboardStats();
      })
    );
    ul.querySelectorAll('[data-edit-id]').forEach(btn =>
      btn.addEventListener('click', () => openLinkModal(btn.dataset.editId))
    );

    if (typeof Sortable !== 'undefined' && !ul._sortableBound) {
      ul._sortableBound = true;
      Sortable.create(ul, {
        handle: '.link-row__drag',
        animation: 180,
        onEnd: () => {
          const ids = [...ul.children].map(li => li.dataset.linkRowId).filter(Boolean);
          // merge new order for this list with the other list's existing order
          const other = ul.id === 'linksList' ? document.getElementById('gamesList') : document.getElementById('linksList');
          const otherIds = other ? [...other.children].map(li => li.dataset.linkRowId).filter(Boolean) : [];
          window.DB.reorderLinks(ul.id === 'linksList' ? [...ids, ...otherIds] : [...otherIds, ...ids]);
        }
      });
    }
  }

  function linkRowHtml(l) {
    const meta = window.CardsUI.linkMeta(l);
    return `
      <li class="link-row" data-link-row-id="${l.id}">
        <span class="link-row__drag" aria-hidden="true">⠿</span>
        <span class="link-row__icon">${window.CardsUI.iconSvg(l.icon)}</span>
        <span class="link-row__body">
          <div class="link-row__label">${window.CardsUI.escapeHtml(meta.label)}</div>
          <div class="link-row__meta">${window.CardsUI.escapeHtml(meta.sub || l.url || '')}</div>
        </span>
        <span class="link-row__actions">
          <label class="toggle">
            <input type="checkbox" data-toggle-id="${l.id}" ${l.enabled ? 'checked' : ''}>
            <span class="toggle__track"></span>
          </label>
          <button class="row-edit-btn" data-edit-id="${l.id}">✎</button>
        </span>
      </li>`;
  }

  function openLinkModal(id, defaultCategory = 'social') {
    activeLinkModalId = id || null;
    const link = id ? window.DB.get().links.find(l => l.id === id) : null;
    activeLinkModalCategory = link ? link.category : defaultCategory;

    document.getElementById('linkModalTitle').textContent = id ? 'Edit Link' : (defaultCategory === 'game' ? 'Add Game' : 'Add Link');
    document.getElementById('deleteLinkBtn').style.display = id ? 'block' : 'none';

    const fields = document.getElementById('linkModalFields');
    if (activeLinkModalCategory === 'game') {
      fields.innerHTML = `
        <label class="field field--full"><span>Game</span>
          <select id="m_game">${GAME_PRESETS.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Username</span><input type="text" id="m_username"></label>
        <label class="field"><span>Game ID</span><input type="text" id="m_gameid"></label>
        <label class="field"><span>Server</span><input type="text" id="m_server"></label>
        <label class="field"><span>Link profil (opsional)</span><input type="text" id="m_url" placeholder="https://…"></label>
      `;
      if (link) {
        document.getElementById('m_game').value = link.label || GAME_PRESETS[0];
        document.getElementById('m_username').value = link.username || '';
        document.getElementById('m_gameid').value = link.gameId || '';
        document.getElementById('m_server').value = link.server || '';
        document.getElementById('m_url').value = link.url || '';
      }
    } else {
      fields.innerHTML = `
        <label class="field field--full"><span>Platform</span>
          <select id="m_platform">${SOCIAL_PRESETS.map(p => `<option value="${p.platform}" data-icon="${p.icon}">${p.label}</option>`).join('')}</select>
        </label>
        <label class="field field--full"><span>Nama tampilan</span><input type="text" id="m_label"></label>
        <label class="field"><span>Username</span><input type="text" id="m_username"></label>
        <label class="field"><span>URL</span><input type="text" id="m_url" placeholder="https://…"></label>
        <label class="field field--full"><span>Deskripsi singkat</span><input type="text" id="m_description"></label>
      `;
      const platformSelect = document.getElementById('m_platform');
      platformSelect.addEventListener('change', () => {
        const opt = platformSelect.selectedOptions[0];
        const preset = SOCIAL_PRESETS.find(p => p.platform === opt.value);
        if (preset && !link) document.getElementById('m_label').value = preset.label;
      });
      if (link) {
        platformSelect.value = link.platform || 'custom';
        document.getElementById('m_label').value = link.label || '';
        document.getElementById('m_username').value = link.username || '';
        document.getElementById('m_url').value = link.url || '';
        document.getElementById('m_description').value = link.description || '';
      } else {
        document.getElementById('m_label').value = 'Instagram';
      }
    }

    document.getElementById('linkModal').classList.add('is-open');
  }

  function closeLinkModal() {
    document.getElementById('linkModal').classList.remove('is-open');
    activeLinkModalId = null;
  }

  function saveLinkModal() {
    if (activeLinkModalCategory === 'game') {
      const game = document.getElementById('m_game').value;
      const payload = {
        category: 'game',
        platform: game.toLowerCase().replace(/\s+/g, ''),
        label: game,
        username: document.getElementById('m_username').value,
        gameId: document.getElementById('m_gameid').value,
        server: document.getElementById('m_server').value,
        url: document.getElementById('m_url').value,
        icon: guessGameIcon(game)
      };
      applyLinkSave(payload);
    } else {
      const platformEl = document.getElementById('m_platform');
      const icon = platformEl.selectedOptions[0].dataset.icon || 'link-2';
      const payload = {
        category: 'custom',
        platform: platformEl.value,
        label: document.getElementById('m_label').value || 'Link',
        username: document.getElementById('m_username').value,
        url: document.getElementById('m_url').value,
        description: document.getElementById('m_description').value,
        icon
      };
      applyLinkSave(payload);
    }
    closeLinkModal();
  }

  function guessGameIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('mobile legends')) return 'swords';
    if (n.includes('free fire')) return 'crosshair';
    if (n.includes('pubg')) return 'target';
    if (n.includes('roblox')) return 'box';
    if (n.includes('minecraft')) return 'pickaxe';
    if (n.includes('steam')) return 'gamepad';
    if (n.includes('valorant')) return 'crosshair';
    if (n.includes('genshin')) return 'sparkles';
    return 'gamepad-2';
  }

  function applyLinkSave(payload) {
    if (activeLinkModalId) {
      window.DB.updateLink(activeLinkModalId, payload);
    } else {
      window.DB.addLink({ ...payload, enabled: true });
    }
    renderLinksLists();
  }

  function deleteLinkModal() {
    if (activeLinkModalId) {
      window.DB.removeLink(activeLinkModalId);
      renderLinksLists();
    }
    closeLinkModal();
  }

  function initLinksPanels() {
    document.getElementById('addLinkBtn').addEventListener('click', () => openLinkModal(null, 'social'));
    document.getElementById('addGameBtn').addEventListener('click', () => openLinkModal(null, 'game'));
    document.getElementById('saveLinkBtn').addEventListener('click', saveLinkModal);
    document.getElementById('deleteLinkBtn').addEventListener('click', deleteLinkModal);
    document.querySelectorAll('[data-close-linkmodal]').forEach(el => el.addEventListener('click', closeLinkModal));
    renderLinksLists();
  }

  // ============================= APPEARANCE =============================
  function initAppearance() {
    const theme = window.DB.get().theme;
    const grid = document.getElementById('presetGrid');
    grid.innerHTML = THEME_PRESETS.map(p => `
      <div class="preset-card ${theme.preset === p.key ? 'is-selected' : ''}" data-preset-key="${p.key}">
        <div class="preset-card__swatch" style="background:linear-gradient(135deg, ${p.accent}, ${p.primary})"></div>
        <div class="preset-card__name">${p.name}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const preset = THEME_PRESETS.find(p => p.key === card.dataset.presetKey);
        window.DB.updateTheme({ preset: preset.key, primary: preset.primary, accent: preset.accent, background: preset.background });
        grid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        syncAppearanceInputs();
      });
    });

    syncAppearanceInputs();

    ['primary', 'accent', 'background'].forEach(key => {
      document.getElementById(`f_${key}`).addEventListener('input', e => window.DB.updateTheme({ [key]: e.target.value }));
    });
    ['radius', 'shadow', 'tilt'].forEach(key => {
      const el = document.getElementById(`f_${key}`);
      el.addEventListener('input', () => {
        document.getElementById(`v_${key}`).textContent = key === 'radius' ? `${el.value}px` : `${el.value}%`;
        window.DB.updateTheme({ [key]: Number(el.value) });
      });
    });
    document.getElementById('f_animation').addEventListener('change', e => window.DB.updateTheme({ animation: e.target.value }));
  }

  function syncAppearanceInputs() {
    const theme = window.DB.get().theme;
    document.getElementById('f_primary').value = theme.primary;
    document.getElementById('f_accent').value = theme.accent;
    document.getElementById('f_background').value = theme.background;
    document.getElementById('f_radius').value = theme.radius;
    document.getElementById('v_radius').textContent = `${theme.radius}px`;
    document.getElementById('f_shadow').value = theme.shadow;
    document.getElementById('v_shadow').textContent = `${theme.shadow}%`;
    document.getElementById('f_tilt').value = theme.tilt;
    document.getElementById('v_tilt').textContent = `${theme.tilt}%`;
    document.getElementById('f_animation').value = theme.animation;
  }

  // ============================= ANALYTICS =============================
  function renderAnalytics() {
    const { analytics, links } = window.DB.get();
    document.getElementById('a_views').textContent = analytics.views || 0;
    document.getElementById('a_shares').textContent = analytics.shares || 0;
    const totalClicks = Object.values(analytics.clicks || {}).reduce((a, b) => a + b, 0);
    document.getElementById('a_clicks').textContent = totalClicks;

    const rows = links
      .map(l => ({ l, count: (analytics.clicks || {})[l.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const list = document.getElementById('analyticsList');
    list.innerHTML = rows.length
      ? rows.map(r => `<li class="analytics-row"><span>${window.CardsUI.escapeHtml(r.l.label)}</span><span class="analytics-row__count">${r.count}</span></li>`).join('')
      : `<li class="analytics-row"><span>Belum ada data klik.</span></li>`;
  }

  function refreshDashboardStats() {
    const { analytics, links } = window.DB.get();
    document.getElementById('statViews').textContent = analytics.views || 0;
    const totalClicks = Object.values(analytics.clicks || {}).reduce((a, b) => a + b, 0);
    document.getElementById('statClicks').textContent = totalClicks;
    document.getElementById('statLinks').textContent = links.filter(l => l.enabled).length;
    document.getElementById('statShares').textContent = analytics.shares || 0;
    renderAnalytics();
  }

  // ============================= SETTINGS =============================
  function initSettings() {
    document.getElementById('savePinBtn').addEventListener('click', () => {
      const val = document.getElementById('s_newpin').value.trim();
      if (val.length < 4) { alert('PIN minimal 4 digit.'); return; }
      window.Auth.setPin(val);
      document.getElementById('s_newpin').value = '';
      alert('PIN berhasil diperbarui.');
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(window.DB.get(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${window.DB.get().profile.username || 'profile'}-card.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('importInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          window.DB.replace(parsed);
          location.reload();
        } catch {
          alert('File JSON tidak valid.');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('Kembalikan semua data ke contoh bawaan? Tindakan ini tidak bisa dibatalkan.')) {
        window.DB.reset();
        location.reload();
      }
    });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function initDashboard() {
    initNav();
    initProfile();
    initLinksPanels();
    initAppearance();
    initSettings();
    refreshDashboardStats();
  }

  document.addEventListener('DOMContentLoaded', initGate);
})();
