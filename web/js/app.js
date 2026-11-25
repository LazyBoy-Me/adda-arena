/* Adda Arena — app shell, screens, game runner */
(function () {
  const { h, toast, sheet, confirmBox, vibrate, sfx } = UI;
  const screen = document.getElementById('screen');
  const tabs = Array.from(document.querySelectorAll('.tab'));
  let currentTab = 'home';
  let gameSession = null; // {game, cleanup}

  window.Games = window.Games || [];
  window.registerGame = function (g) { window.Games.push(g); };

  const GAME_BY_ID = id => window.Games.find(g => g.id === id);

  /* ---------------- top bar ---------------- */
  function refreshTop() {
    const p = Store.me();
    document.getElementById('tbAva').textContent = p ? p.avatar : '👤';
    document.getElementById('tbName').textContent = p ? p.name : 'শুরু করো';
    document.getElementById('tbCoinVal').textContent = p ? p.coins.toLocaleString('bn-BD') : '0';
  }

  /* ---------------- navigation ---------------- */
  function setTab(tab) {
    currentTab = tab;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'home') renderHome();
    if (tab === 'games') renderGames();
    if (tab === 'store') renderStore();
    if (tab === 'profile') renderProfile();
    screen.scrollTop = 0;
  }

  tabs.forEach(t => t.addEventListener('click', () => { sfx.tap(); setTab(t.dataset.tab); }));
  document.getElementById('tbProfile').addEventListener('click', () => setTab('profile'));

  /* ---------------- HOME ---------------- */
  function renderHome() {
    screen.innerHTML = '';
    const p = Store.me();
    if (!p) { renderWelcome(); return; }

    // hero
    const hero = h('div', { class: 'hero' }, [
      h('span', { class: 'big-emoji', text: '🎉' }),
      h('h1', { text: 'স্বাগতম, ' + p.name + '!' }),
      h('p', { text: 'বন্ধুদের নিয়ে খেলো, কয়েন জমাও, তারকা হয়ে যাও।' }),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', text: '▶ খেলা শুরু', onclick: () => openGame('spy') }),
        h('button', { class: 'btn ghost', text: 'সব গেম', onclick: () => setTab('games') })
      ])
    ]);
    screen.appendChild(hero);

    // daily bonus
    if (Store.bonusAvailable()) {
      const b = h('div', { class: 'bonus' }, [
        h('div', { class: 'ic', text: '🎁' }),
        h('div', { class: 'tx' }, [h('b', { text: 'আজকের বোনাস তৈরি!' }), h('small', { text: 'প্রতিদিন ১০০+ কয়েন ফ্রি' })]),
        h('button', {
          class: 'btn ok sm', text: 'নাও', onclick: (e) => {
            const amt = Store.claimBonus(); sfx.coin();
            if (amt) { toast('+' + amt + ' কয়েন! 🪙'); refreshTop(); e.target.closest('.bonus').remove(); }
          }
        })
      ]);
      screen.appendChild(b);
    } else {
      screen.appendChild(h('div', { class: 'bonus' }, [
        h('div', { class: 'ic', text: '🔥' }),
        h('div', { class: 'tx' }, [
          h('b', { text: 'স্ট্রিক: ' + (p.streak || 0) + ' দিন' }),
          h('small', { text: 'কাল আবার এসে বোনাস নাও' })
        ]),
        h('span', { class: 'pill', text: 'আজ নেওয়া হয়েছে' })
      ]));
    }

    // popular
    screen.appendChild(h('div', { class: 'sec-title' }, [
      h('h2', { text: '🔥 জনপ্রিয় গেম' }),
      h('button', { class: 'more', text: 'সব দেখো ›', onclick: () => setTab('games') })
    ]));
    const grid = h('div', { class: 'grid' });
    window.Games.slice(0, 4).forEach(g => grid.appendChild(gameCard(g)));
    screen.appendChild(grid);

    // stats
    screen.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: '📊 তোমার পরিসংখ্যান' })]));
    screen.appendChild(h('div', { class: 'rows' }, [
      statRow('🎮', 'মোট খেলা', p.played + ' ম্যাচ'),
      statRow('🏆', 'জয়', p.won + ' ম্যাচ'),
      statRow('⭐', 'লেভেল', 'লেভেল ' + Store.level()),
      statRow('🪙', 'কয়েন', p.coins.toLocaleString('bn-BD'))
    ]));
    screen.appendChild(h('div', { class: 'spacer' }));
    screen.appendChild(h('p', { class: 'hint', text: 'সব গেম অফলাইনে চলে — ইন্টারনেট ছাড়াই খেলতে পারবে।' }));
  }

  function statRow(ic, label, val) {
    return h('div', { class: 'row' }, [
      h('div', { class: 'ri', text: ic }),
      h('div', { class: 'rt' }, [h('b', { text: label }), h('small', { text: val })])
    ]);
  }

  function gameCard(g) {
    return h('button', { class: 'gcard', onclick: () => { sfx.tap(); openGame(g.id); } }, [
      h('div', { class: 'glow', style: 'background:' + g.color }),
      g.tag ? h('span', { class: 'tag', text: g.tag }) : null,
      h('div', { class: 'ge', text: g.emoji }),
      h('div', null, [h('div', { class: 'gt', text: g.name }), h('div', { class: 'gd', text: g.sub || '' })])
    ]);
  }

  /* ---------------- GAMES ---------------- */
  function renderGames() {
    screen.innerHTML = '';
    screen.appendChild(h('div', { class: 'sec-title' }, [
      h('h2', { text: '🎮 সব গেম' }),
      h('span', { class: 'more', text: window.Games.length + ' টি গেম' })
    ]));
    const grid = h('div', { class: 'grid' });
    window.Games.forEach(g => grid.appendChild(gameCard(g)));
    screen.appendChild(grid);
    screen.appendChild(h('div', { class: 'spacer' }));
    screen.appendChild(h('p', { class: 'hint', text: 'নতুন গেম প্রতি আপডেটে যোগ হচ্ছে।' }));
  }

  /* ---------------- GAME RUNNER ---------------- */
  function openGame(id) {
    const g = GAME_BY_ID(id);
    if (!g) { toast('গেমটি পাওয়া যায়নি'); return; }
    if (!Store.me()) { setTab('profile'); return; }
    gameSession = { game: g, cleanup: null };
    renderGame();
  }

  function renderGame() {
    if (!gameSession) return;
    const g = gameSession.game;
    screen.innerHTML = '';
    screen.scrollTop = 0;

    const top = h('div', { class: 'gtop' }, [
      h('button', { class: 'back', text: '‹', onclick: closeGame }),
      h('h2', { text: g.emoji + ' ' + g.name }),
      h('div', { class: 'chip', text: '🪙 ' + Store.me().coins })
    ]);
    screen.appendChild(top);

    const host = h('div', { id: 'gameHost' });
    screen.appendChild(host);

    const ctx = makeCtx(host, g);
    try {
      g.mount(host, ctx);
    } catch (err) {
      console.error(err);
      host.innerHTML = '';
      host.appendChild(h('div', { class: 'result' }, [
        h('div', { class: 'em', text: '😵' }),
        h('h3', { text: 'গেম শুরু করতে সমস্যা' }),
        h('p', { text: String(err && err.message || err) }),
        h('button', { class: 'btn primary', text: 'ফিরে যাও', onclick: closeGame })
      ]));
    }
  }

  function makeCtx(host, g) {
    return {
      host,
      game: g,
      profile: Store.me(),
      exit: closeGame,
      restart() { renderGame(); },
      /* show the standard end-of-game card */
      end(opts) {
        const o = Object.assign({ won: false, coins: 0, title: '', sub: '', emoji: '🎉' }, opts || {});
        Store.record(g.id, o.won, o.coins);
        if (o.won) sfx.win(); else sfx.lose();
        if (o.coins) sfx.coin();
        refreshTop();
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'result' }, [
          h('div', { class: 'em', text: o.emoji }),
          h('h3', { text: o.title || (o.won ? 'জিতেছ!' : 'খেলা শেষ') }),
          o.sub ? h('p', { text: o.sub }) : null,
          h('div', { class: 'coins', text: '🪙 +' + (o.coins || 0) + ' কয়েন' }),
          h('div', { style: 'display:flex;gap:10px;margin-top:16px;width:100%' }, [
            h('button', { class: 'btn wide', text: 'আবার খেলো', onclick: () => renderGame() }),
            h('button', { class: 'btn primary wide', text: 'হোম', onclick: () => { closeGame(); setTab('home'); } })
          ])
        ]));
      }
    };
  }

  function closeGame() {
    gameSession = null;
    setTab(currentTab || 'home');
  }

  /* ---------------- STORE ---------------- */
  function renderStore() {
    screen.innerHTML = '';
    const p = Store.me();
    screen.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: '🛍️ স্টোর' })]));
    screen.appendChild(h('div', { class: 'bonus' }, [
      h('div', { class: 'ic', text: '🪙' }),
      h('div', { class: 'tx' }, [h('b', { text: p.coins.toLocaleString('bn-BD') + ' কয়েন' }), h('small', { text: 'খেলে আয় করো — সব ফ্রি' })]),
      h('button', { class: 'btn ok sm', text: 'আয় করো', onclick: () => setTab('home') })
    ]));

    screen.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: '😀 অ্যাভাটার' })]));
    const grid = h('div', { class: 'ava-grid' });
    Store.AVATARS.forEach((a, i) => {
      const id = 'ava:' + a;
      const price = i < 4 ? 0 : (i < 10 ? 300 : 800);
      const owned = price === 0 || Store.owns(id) || p.avatar === a;
      const on = p.avatar === a;
      const item = h('button', {
        class: 'ava-item' + (on ? ' on' : '') + (owned ? ' owned' : ''),
        onclick: () => {
          if (on) return;
          if (!owned) {
            if (!Store.buy(id, price)) { toast('পর্যাপ্ত কয়েন নেই — খেলে কয়েন আয় করো'); return; }
            sfx.coin();
          }
          Store.updateProfile({ avatar: a }); refreshTop(); renderStore();
        }
      }, [
        owned ? null : h('span', { class: 'lock', text: '🔒' }),
        h('span', { text: a }),
        h('small', { text: on ? 'ব্যবহৃত' : (owned ? 'ফ্রি' : '🪙 ' + price) })
      ]);
      grid.appendChild(item);
    });
    screen.appendChild(grid);

    screen.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: '🎁 কয়েন কীভাবে পাবে?' })]));
    screen.appendChild(h('div', { class: 'rows' }, [
      infoRow('🎁', 'প্রতিদিন বোনাস', 'প্রতিদিন ১০০ কয়েন, স্ট্রিকে বাড়ে'),
      infoRow('🏆', 'গেম জিতলে', 'ম্যাচ জিতলে বোনাস কয়েন'),
      infoRow('⭐', 'লেভেল আপ', 'প্রতি ১০০ XP-তে নতুন লেভেল'),
      infoRow('👥', 'বন্ধুদের ডাকো', 'একসাথে খেললে বেশি মজা')
    ]));
    screen.appendChild(h('p', { class: 'hint', style: 'margin-top:16px', text: 'এই অ্যাপে কোনো আসল টাকা লেনদেন নেই — সব কয়েন শুধু খেলার জন্য।' }));
  }

  function infoRow(ic, t, s) {
    return h('div', { class: 'row' }, [
      h('div', { class: 'ri', text: ic }),
      h('div', { class: 'rt' }, [h('b', { text: t }), h('small', { text: s })])
    ]);
  }

  /* ---------------- PROFILE ---------------- */
  function renderProfile() {
    screen.innerHTML = '';
    const p = Store.me();
    if (!p) { renderWelcome(); return; }

    const card = h('div', { class: 'hero', style: 'background:linear-gradient(135deg,#241a3d,#3b1f4d)' }, [
      h('div', { style: 'display:flex;align-items:center;gap:14px' }, [
        h('div', { class: 'ava', style: 'width:64px;height:64px;font-size:34px', text: p.avatar }),
        h('div', null, [
          h('h1', { style: 'font-size:19px;margin:0', text: p.name }),
          h('p', { style: 'margin:2px 0 0', text: 'লেভেল ' + Store.level() + ' · ' + p.xp + ' XP' })
        ])
      ]),
      h('div', { class: 'progress', style: 'margin-top:14px' }, [
        h('i', { style: 'width:' + Math.round(Store.levelProgress() * 100) + '%' })
      ])
    ]);
    screen.appendChild(card);

    screen.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: 'অ্যাকাউন্ট' })]));
    screen.appendChild(h('div', { class: 'rows' }, [
      h('button', { class: 'row', onclick: editName }, [
        h('div', { class: 'ri', text: '✏️' }),
        h('div', { class: 'rt' }, [h('b', { text: 'নাম বদলাও' }), h('small', { text: p.name })]),
        h('span', { class: 'chev', text: '›' })
      ]),
      h('button', { class: 'row', onclick: switchProfileSheet }, [
        h('div', { class: 'ri', text: '🔄' }),
        h('div', { class: 'rt' }, [h('b', { text: 'প্রোফাইল বদলাও' }), h('small', { text: Store.profiles().length + ' টি প্রোফাইল' })]),
        h('span', { class: 'chev', text: '›' })
      ]),
      h('button', { class: 'row', onclick: backupSheet }, [
        h('div', { class: 'ri', text: '☁️' }),
        h('div', { class: 'rt' }, [h('b', { text: 'ব্যাকআপ / রিস্টোর' }), h('small', { text: 'কোড দিয়ে অন্য ফোনে নাও' })]),
        h('span', { class: 'chev', text: '›' })
      ])
    ]));

    screen.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: 'সেটিংস' })]));
    const s = Store.state.settings;
    screen.appendChild(h('div', { class: 'rows' }, [
      toggleRow('🔊', 'সাউন্ড', s.sound, v => { s.sound = v; Store.state.settings = s; persist(); }),
      toggleRow('📳', 'ভাইব্রেশন', s.haptics, v => { s.haptics = v; Store.state.settings = s; persist(); }),
      h('button', { class: 'row', onclick: resetAll }, [
        h('div', { class: 'ri', text: '🗑️' }),
        h('div', { class: 'rt' }, [h('b', { text: 'সব রিসেট' }), h('small', { text: 'সব প্রোফাইল মুছে যাবে' })]),
        h('span', { class: 'chev', text: '›' })
      ])
    ]));

    screen.appendChild(h('p', { class: 'hint', style: 'margin-top:18px', text: 'Adda Arena v1.0 · অফলাইন · ফ্রি' }));
  }

  function toggleRow(ic, label, val, onChange) {
    const sw = h('span', {
      style: 'width:44px;height:26px;border-radius:99px;background:' + (val ? '#00e5a0' : '#3a2f58') + ';position:relative;transition:.15s;flex:0 0 auto'
    }, [h('span', {
      style: 'position:absolute;top:3px;left:' + (val ? '21px' : '3px') + ';width:20px;height:20px;border-radius:50%;background:#fff;transition:.15s'
    })]);
    const row = h('button', { class: 'row', onclick: () => {
      const nv = !on; on = nv; onChange(nv);
      sw.style.background = nv ? '#00e5a0' : '#3a2f58';
      sw.firstChild.style.left = nv ? '21px' : '3px';
      vibrate(10);
    } }, [
      h('div', { class: 'ri', text: ic }),
      h('div', { class: 'rt' }, [h('b', { text: label })]),
      sw
    ]);
    let on = val;
    return row;
  }

  function persist() { try { localStorage.setItem('addaarena.v1', JSON.stringify(Store.state)); } catch (e) {} }

  function editName() {
    const p = Store.me();
    sheet('নাম বদলাও', 'সর্বোচ্চ ১৬ অক্ষর', (body, close) => {
      const inp = h('input', { class: 'input', value: p.name, maxlength: 16 });
      body.appendChild(h('div', { class: 'field' }, [inp]));
      body.appendChild(h('button', {
        class: 'btn primary wide', text: 'সেভ করো', onclick: () => {
          const v = inp.value.trim();
          if (!v) { toast('নাম লিখো'); return; }
          Store.updateProfile({ name: v }); refreshTop(); close(); renderProfile();
        }
      }));
      setTimeout(() => inp.focus(), 120);
    });
  }

  function switchProfileSheet() {
    sheet('প্রোফাইল', 'এক ফোনে একাধিক খেলোয়াড়', (body, close) => {
      const rows = h('div', { class: 'rows' });
      Store.profiles().forEach(p => {
        rows.appendChild(h('button', {
          class: 'row', onclick: () => { Store.switchProfile(p.id); refreshTop(); close(); renderProfile(); }
        }, [
          h('div', { class: 'ri', text: p.avatar }),
          h('div', { class: 'rt' }, [h('b', { text: p.name }), h('small', { text: '🪙 ' + p.coins + ' · ' + p.played + ' ম্যাচ' })]),
          p.id === Store.state.activeId ? h('span', { class: 'pill', text: 'সক্রিয়' }) : h('span', { class: 'chev', text: '›' })
        ]));
      });
      body.appendChild(rows);
      const row = h('div', { style: 'display:flex;gap:8px;margin-top:12px' }, [
        h('button', { class: 'btn wide', text: '＋ নতুন খেলোয়াড়', onclick: () => { close(); setTimeout(newProfileSheet, 220); } }),
        Store.profiles().length > 1 ? h('button', {
          class: 'btn danger wide', text: 'মুছো', onclick: () => {
            const p = Store.me();
            confirmBox('প্রোফাইল মুছবে?', p.name + ' এর সব অগ্রগতি মুছে যাবে।').then(ok => {
              if (!ok) return;
              Store.deleteProfile(p.id); refreshTop(); close(); setTab('home');
            });
          }
        }) : null
      ]);
      body.appendChild(row);
    });
  }

  function backupSheet() {
    sheet('ব্যাকআপ / রিস্টোর', 'কোড কপি করে সংরক্ষণ করো', (body, close) => {
      const code = Store.exportCode();
      const ta = h('textarea', { class: 'input', readonly: 'readonly', style: 'font-size:11px;height:90px' });
      ta.value = code;
      body.appendChild(h('div', { class: 'field' }, [ta]));
      body.appendChild(h('div', { style: 'display:flex;gap:8px' }, [
        h('button', {
          class: 'btn primary wide', text: '📋 কপি করো', onclick: async () => {
            try { await navigator.clipboard.writeText(code); toast('কোড কপি হয়েছে'); }
            catch (e) { ta.select(); toast('সিলেক্ট করা হয়েছে — কপি করো'); }
          }
        })
      ]));
      body.appendChild(h('div', { class: 'divider' }));
      body.appendChild(h('p', { class: 'sub', text: 'রিস্টোর করতে কোডটি নিচে পেস্ট করো' }));
      const inp = h('textarea', { class: 'input', style: 'font-size:11px;height:90px', placeholder: 'ব্যাকআপ কোড' });
      body.appendChild(inp);
      body.appendChild(h('button', {
        class: 'btn ok wide', text: 'রিস্টোর করো', onclick: () => {
          if (!Store.importCode(inp.value)) { toast('কোডটি সঠিক নয়'); return; }
          refreshTop(); close(); setTab('home'); toast('রিস্টোর সম্পন্ন ✅');
        }
      }));
    });
  }

  function resetAll() {
    confirmBox('সব মুছে ফেলবে?', 'সব প্রোফাইল, কয়েন আর পরিসংখ্যান মুছে যাবে। এটি ফেরানো যাবে না।', 'মুছে ফেলো')
      .then(ok => { if (!ok) return; Store.reset(); refreshTop(); setTab('home'); });
  }

  /* ---------------- WELCOME ---------------- */
  function renderWelcome() {
    screen.innerHTML = '';
    screen.appendChild(h('div', { style: 'padding:30px 6px 10px;text-align:center' }, [
      h('div', { style: 'font-size:64px', text: '🎭' }),
      h('h1', { style: 'font-size:24px;margin:10px 0 6px', text: 'Adda Arena' }),
      h('p', { style: 'color:#9d93b8;font-size:14px;margin:0', text: 'বন্ধুদের নিয়ে খেলা আর আড্ডা — সব ফ্রি, সব অফলাইন।' })
    ]));
    const btn = h('button', { class: 'btn primary wide', style: 'margin-top:18px;padding:15px', text: 'শুরু করো' , onclick: newProfileSheet });
    screen.appendChild(btn);
    screen.appendChild(h('p', { class: 'hint', style: 'margin-top:14px', text: 'নাম আর অ্যাভাটার দিয়ে এক ক্লিকে অ্যাকাউন্ট তৈরি হবে।' }));
  }

  function newProfileSheet() {
    let chosen = '🦊';
    sheet('নতুন খেলোয়াড়', 'নাম আর অ্যাভাটার বাছো', (body, close) => {
      const inp = h('input', { class: 'input', placeholder: 'তোমার নাম', maxlength: 16 });
      body.appendChild(h('div', { class: 'field' }, [h('label', { text: 'নাম' }), inp]));
      const grid = h('div', { class: 'ava-grid', style: 'grid-template-columns:repeat(6,1fr);margin-top:4px' });
      Store.AVATARS.slice(0, 12).forEach(a => {
        const b = h('button', {
          class: 'ava-item' + (a === chosen ? ' on' : ''), style: 'font-size:22px', text: a,
          onclick: () => {
            chosen = a;
            Array.from(grid.children).forEach(c => c.classList.remove('on'));
            b.classList.add('on'); vibrate(8);
          }
        });
        grid.appendChild(b);
      });
      body.appendChild(grid);
      body.appendChild(h('button', {
        class: 'btn primary wide', style: 'margin-top:16px', text: 'অ্যাকাউন্ট তৈরি করো', onclick: () => {
          const name = inp.value.trim() || 'খেলোয়াড়';
          Store.createProfile(name, chosen);
          refreshTop(); close(); setTab('home'); sfx.coin();
        }
      }));
      setTimeout(() => inp.focus(), 150);
    });
  }

  /* ---------------- boot ---------------- */
  refreshTop();
  if (Store.me()) setTab('home'); else { setTab('home'); }

  window.App = { setTab, openGame, refreshTop };
})();
