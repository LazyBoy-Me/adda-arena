/* Adda Arena — local account + coin store (offline, free, no server) */
(function () {
  const KEY = 'addaarena.v1';
  const AVATARS = ['🦊','🐯','🐼','🐸','🦁','🐺','🐨','🐵','🦄','🐙','🐳','🦉','🐲','🤖','👽','🦋'];

  const DEFAULT = {
    v: 1,
    activeId: null,
    profiles: [],
    settings: { sound: true, haptics: true },
    created: 0
  };

  function uid() { return 'p' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  function blankProfile(name, avatar) {
    return {
      id: uid(), name: name || 'খেলোয়াড়', avatar: avatar || '🦊',
      coins: 500, xp: 0, played: 0, won: 0,
      lastBonus: null, streak: 0,
      inv: [], theme: 'default', createdAt: Date.now(),
      games: {}, unlockedGames: []
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !Array.isArray(s.profiles)) return JSON.parse(JSON.stringify(DEFAULT));
      return s;
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  const Store = {
    AVATARS,
    get state() { return state; },

    /* ---------- profiles ---------- */
    profiles() { return state.profiles; },
    me() { return state.profiles.find(p => p.id === state.activeId) || null; },

    createProfile(name, avatar) {
      const p = blankProfile(name, avatar);
      state.profiles.push(p);
      state.activeId = p.id;
      save();
      return p;
    },
    switchProfile(id) {
      if (state.profiles.some(p => p.id === id)) { state.activeId = id; save(); return true; }
      return false;
    },
    updateProfile(patch) {
      const p = this.me(); if (!p) return null;
      Object.assign(p, patch); save(); return p;
    },
    deleteProfile(id) {
      state.profiles = state.profiles.filter(p => p.id !== id);
      if (state.activeId === id) state.activeId = state.profiles[0] ? state.profiles[0].id : null;
      save();
    },

    /* ---------- coins / xp ---------- */
    addCoins(n) {
      const p = this.me(); if (!p) return 0;
      p.coins = Math.max(0, p.coins + n); save(); return p.coins;
    },
    spendCoins(n) {
      const p = this.me(); if (!p || p.coins < n) return false;
      p.coins -= n; save(); return true;
    },
    addXp(n) {
      const p = this.me(); if (!p) return 1;
      p.xp += n; save(); return Store.level();
    },
    level() {
      const p = this.me(); if (!p) return 1;
      return Math.floor(p.xp / 100) + 1;
    },
    levelProgress() {
      const p = this.me(); if (!p) return 0;
      return (p.xp % 100) / 100;
    },

    /* ---------- daily bonus ---------- */
    bonusAvailable() {
      const p = this.me(); if (!p) return false;
      return p.lastBonus !== today();
    },
    claimBonus() {
      const p = this.me(); if (!p) return 0;
      if (p.lastBonus === today()) return 0;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const ykey = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
      p.streak = (p.lastBonus === ykey) ? Math.min(7, (p.streak || 0) + 1) : 1;
      const amt = 100 + (p.streak - 1) * 25;
      p.coins += amt;
      p.lastBonus = today();
      p.xp += 10;
      save();
      return amt;
    },

    /* ---------- inventory ---------- */
    owns(id) { const p = this.me(); return !!p && p.inv.indexOf(id) >= 0; },
    buy(id, price) {
      const p = this.me(); if (!p) return false;
      if (p.inv.indexOf(id) >= 0) return true;
      if (p.coins < price) return false;
      p.coins -= price; p.inv.push(id); save(); return true;
    },

    /* ---------- record a finished game ---------- */
    record(gameId, won, coinsEarned) {
      const p = this.me(); if (!p) return;
      p.played++;
      if (won) p.won++;
      p.coins += Math.max(0, coinsEarned | 0);
      p.xp += won ? 25 : 8;
      p.games[gameId] = p.games[gameId] || { played: 0, won: 0 };
      p.games[gameId].played++;
      if (won) p.games[gameId].won++;
      save();
    },

    /* ---------- backup ---------- */
    exportCode() {
      try { return btoa(unescape(encodeURIComponent(JSON.stringify(state)))); } catch (e) { return ''; }
    },
    importCode(code) {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        if (!s || !Array.isArray(s.profiles) || !s.profiles.length) return false;
        state = s; save(); return true;
      } catch (e) { return false; }
    },
    reset() { state = JSON.parse(JSON.stringify(DEFAULT)); save(); }
  };

  window.Store = Store;
})();
