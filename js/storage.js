/**
 * storage.js
 * ------------------------------------------------------------------
 * Single source of truth for the Digital Business Card.
 *
 * This is a localStorage-backed prototype. Everything reads/writes
 * through the DB object below, so swapping localStorage for a real
 * backend later only means rewriting the methods in this file —
 * nothing in cards.js / app.js / editor.js needs to change, as long
 * as they keep calling DB.get() / DB.save() / DB.on().
 *
 * BACKEND MIGRATION NOTE (see README):
 *   - DB.load()/DB.persist() are the only two methods that talk to
 *     localStorage. Replace their internals with fetch() calls to
 *     your API (GET /api/profile, PUT /api/profile) and everything
 *     else keeps working.
 *   - Auth in this prototype is a plain-text demo PIN stored in
 *     localStorage purely to gate the /admin UI on a single device.
 *     It is NOT secure and must not be treated as real authentication.
 *     A real deployment needs server-side auth with hashed passwords.
 * ------------------------------------------------------------------
 */

const STORAGE_KEY = 'dbc_data_v1';
const AUTH_KEY = 'dbc_auth_v1';

const ICON_LIBRARY = {
  instagram: 'instagram', github: 'github', tiktok: 'music-2', youtube: 'youtube',
  whatsapp: 'message-circle', telegram: 'send', discord: 'gamepad-2', facebook: 'facebook',
  linkedin: 'linkedin', website: 'globe', twitter: 'twitter', x: 'twitter',
  email: 'mail', phone: 'phone', link: 'link', mobilelegends: 'swords',
  freefire: 'crosshair', pubg: 'target', roblox: 'box', minecraft: 'pickaxe',
  steam: 'gamepad', valorant: 'crosshair', genshin: 'sparkles', default: 'link-2'
};

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultData() {
  return {
    profile: {
      name: 'Alexa Winters',
      username: 'alexawinters',
      title: 'Creative Developer & Brand Strategist',
      bio: 'Building digital things that feel like they were made by hand.',
      avatar: '',
      logo: '',
      email: 'hello@alexawinters.com',
      whatsapp: '+62 812 3456 7890',
      status: 'available' // available | busy | offline
    },
    theme: {
      preset: 'luxury-gold',
      primary: '#C9A24B',
      accent: '#E8C97A',
      background: '#0B0B0B',
      radius: 22,
      shadow: 60,
      tilt: 70,
      animation: 'full' // full | reduced | off
    },
    links: [
      { id: uid('lnk'), category: 'social', platform: 'instagram', label: 'Instagram', username: '@alexawinters', url: 'https://instagram.com/', description: 'Follow my journey', icon: 'instagram', enabled: true, order: 0 },
      { id: uid('lnk'), category: 'social', platform: 'github', label: 'GitHub', username: 'alexawinters', url: 'https://github.com/', description: 'Open-source & side projects', icon: 'github', enabled: true, order: 1 },
      { id: uid('lnk'), category: 'social', platform: 'linkedin', label: 'LinkedIn', username: 'Alexa Winters', url: 'https://linkedin.com/', description: "Let's connect professionally", icon: 'linkedin', enabled: true, order: 2 },
      { id: uid('lnk'), category: 'social', platform: 'whatsapp', label: 'WhatsApp', username: '+62 812 3456 7890', url: 'https://wa.me/6281234567890', description: 'Chat with me directly', icon: 'whatsapp', enabled: true, order: 3 },
      { id: uid('lnk'), category: 'custom', platform: 'custom', label: 'Portfolio', username: '', url: 'https://example.com', description: 'Selected works, 2020–2026', icon: 'globe', enabled: true, order: 4 },
      { id: uid('lnk'), category: 'game', platform: 'mobilelegends', label: 'Mobile Legends', username: 'Faullll', gameId: '123456789', server: '1234', url: '', description: '', icon: 'swords', enabled: true, order: 5 }
    ],
    analytics: {
      views: 0,
      shares: 0,
      clicks: {} // { [linkId]: number }
    },
    meta: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    }
  };
}

class StorageEngine {
  constructor() {
    this._data = this.load();
    this._listeners = new Set();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = defaultData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      const parsed = JSON.parse(raw);
      // shallow-merge with defaults so new fields added in future
      // updates don't break existing saved data
      const base = defaultData();
      return {
        ...base,
        ...parsed,
        profile: { ...base.profile, ...(parsed.profile || {}) },
        theme: { ...base.theme, ...(parsed.theme || {}) },
        analytics: { ...base.analytics, ...(parsed.analytics || {}) },
        links: Array.isArray(parsed.links) ? parsed.links : base.links
      };
    } catch (e) {
      console.warn('storage: failed to parse saved data, resetting.', e);
      const fresh = defaultData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
  }

  persist() {
    this._data.meta.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    this._emit();
  }

  get() {
    return this._data;
  }

  /** Replace the whole data object (used by import). */
  replace(newData) {
    this._data = newData;
    this.persist();
  }

  reset() {
    this._data = defaultData();
    this.persist();
  }

  // ---- profile ----
  updateProfile(patch) {
    this._data.profile = { ...this._data.profile, ...patch };
    this.persist();
  }

  // ---- theme ----
  updateTheme(patch) {
    this._data.theme = { ...this._data.theme, ...patch };
    this.persist();
  }

  // ---- links ----
  addLink(link) {
    const order = this._data.links.length;
    const full = {
      id: uid('lnk'), category: 'custom', platform: 'custom', label: 'New Link',
      username: '', url: '', description: '', icon: 'link', enabled: true, order,
      ...link
    };
    this._data.links.push(full);
    this.persist();
    return full;
  }

  updateLink(id, patch) {
    const idx = this._data.links.findIndex(l => l.id === id);
    if (idx === -1) return;
    this._data.links[idx] = { ...this._data.links[idx], ...patch };
    this.persist();
  }

  removeLink(id) {
    this._data.links = this._data.links.filter(l => l.id !== id);
    this.persist();
  }

  reorderLinks(orderedIds) {
    const map = new Map(this._data.links.map(l => [l.id, l]));
    this._data.links = orderedIds
      .map((id, i) => {
        const l = map.get(id);
        if (!l) return null;
        return { ...l, order: i };
      })
      .filter(Boolean);
    this.persist();
  }

  // ---- analytics ----
  trackView() {
    this._data.analytics.views = (this._data.analytics.views || 0) + 1;
    this.persist();
  }

  trackClick(linkId) {
    if (!this._data.analytics.clicks) this._data.analytics.clicks = {};
    this._data.analytics.clicks[linkId] = (this._data.analytics.clicks[linkId] || 0) + 1;
    this.persist();
  }

  trackShare() {
    this._data.analytics.shares = (this._data.analytics.shares || 0) + 1;
    this.persist();
  }

  // ---- subscriptions (for live preview) ----
  on(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit() {
    this._listeners.forEach(fn => {
      try { fn(this._data); } catch (e) { console.error(e); }
    });
    // cross-tab / cross-iframe sync for the live preview pane
    try {
      window.dispatchEvent(new CustomEvent('dbc:update', { detail: this._data }));
    } catch (e) { /* no-op */ }
  }
}

const DB = new StorageEngine();

// simple demo-only PIN gate for /admin — see BACKEND MIGRATION NOTE above
const Auth = {
  hasPin() {
    return !!localStorage.getItem(AUTH_KEY);
  },
  setPin(pin) {
    // NOTE: prototype only. Do not ship plaintext PIN storage to production.
    localStorage.setItem(AUTH_KEY, btoa(pin));
  },
  checkPin(pin) {
    return localStorage.getItem(AUTH_KEY) === btoa(pin);
  },
  isUnlocked() {
    return sessionStorage.getItem('dbc_session') === '1';
  },
  unlock() {
    sessionStorage.setItem('dbc_session', '1');
  },
  lock() {
    sessionStorage.removeItem('dbc_session');
  }
};

window.DB = DB;
window.Auth = Auth;
window.ICON_LIBRARY = ICON_LIBRARY;
window.dbcUid = uid;
