/* মেমোরি ম্যাচ — ৮ জোড়া কার্ড */
(function () {
  const { h, vibrate, sfx } = UI;

  registerGame({
    id: 'memory', name: 'মেমোরি ম্যাচ', emoji: '🃏', tag: 'দ্রুত',
    sub: '৮ জোড়া · স্মৃতি পরীক্ষা', color: '#00e5a0',

    mount(host, ctx) {
      const EMO = ['🍎','🍌','🍇','🍓','🍑','🥥','🍍','🥝'];
      let cards = [], open = [], moves = 0, found = 0, locked = false, t0 = 0;

      function start() {
        cards = UI.shuffle(EMO.concat(EMO)).map((e, i) => ({ id: i, e, done: false, open: false }));
        open = []; moves = 0; found = 0; locked = false;
        t0 = Date.now();
        render();
      }

      function render() {
        host.innerHTML = '';
        host.appendChild(h('div', { style: 'display:flex;justify-content:space-between;margin-bottom:8px' }, [
          h('span', { class: 'chip', text: '🔁 ' + UI.bn(moves) + ' চাল' }),
          h('span', { class: 'chip', text: '✅ ' + UI.bn(found) + '/৮' })
        ]));

        const g = h('div', { class: 'mem-grid', style: 'grid-template-columns:repeat(4,1fr);width:min(90vw,360px);margin:8px auto' });
        cards.forEach((c, idx) => {
          const shown = c.open || c.done;
          g.appendChild(h('button', {
            class: 'mcard' + (shown ? ' open' : '') + (c.done ? ' done' : ''),
            'data-pair': c.e,
            text: shown ? c.e : '❓',
            onclick: () => flip(idx)
          }));
        });
        host.appendChild(g);
      }

      function flip(idx) {
        if (locked) return;
        const c = cards[idx];
        if (c.done || c.open) return;
        c.open = true; vibrate(8); sfx.tap();
        open.push(idx);
        render();

        if (open.length === 2) {
          moves++;
          const [a, b] = open;
          if (cards[a].e === cards[b].e) {
            cards[a].done = cards[b].done = true;
            cards[a].open = cards[b].open = false;
            found++; open = []; sfx.coin();
            render();
            if (found === 8) win();
          } else {
            locked = true;
            setTimeout(() => {
              cards[a].open = cards[b].open = false;
              open = []; locked = false; render();
            }, 700);
          }
        }
      }

      function win() {
        const secs = Math.round((Date.now() - t0) / 1000);
        setTimeout(() => {
          ctx.end({
            won: true, coins: Math.max(20, 100 - moves * 4), emoji: '🃏',
            title: 'সব জোড়া মিলেছে!', sub: UI.bn(moves) + ' চালে · ' + UI.bn(secs) + ' সেকেন্ড'
          });
        }, 400);
      }

      start();
    }
  });
})();
