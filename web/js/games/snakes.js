/* সাপ-লুডু — ২–৪ জন pass & play */
(function () {
  const { h, toast, vibrate, sfx, pick } = UI;

  const LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
  const SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 };

  registerGame({
    id: 'snakes', name: 'সাপ-লুডু', emoji: '🐍', tag: 'ক্লাসিক',
    sub: '২–৪ জন · বোর্ড গেম', color: '#00e5a0',

    mount(host, ctx) {
      const S = { players: [], turn: 0, running: false };

      function setup() {
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'center', style: 'padding-top:6px' }, [
          h('div', { style: 'font-size:48px', text: '🐍' }),
          h('h3', { text: 'সাপ-লুডু' }),
          h('p', { class: 'hint', text: 'ছক্কা ফেলে ঘর এগোও। সিঁড়ি পেলে উপরে, সাপে পড়লে নিচে!' })
        ]));

        [1, 2, 3, 4].forEach(n => {
          host.appendChild(h('button', {
            class: 'row', style: 'margin-top:8px', onclick: () => start(n)
          }, [
            h('div', { class: 'ri', text: n === 1 ? '🤖' : '👥' }),
            h('div', { class: 'rt' }, [h('b', { text: n + ' জন খেলোয়াড়' }), h('small', { text: n === 1 ? 'একা খেলো (বট)' : 'এক ফোনে সবাই' })]),
            h('span', { class: 'chev', text: '›' })
          ]));
        });
      }

      function start(n) {
        const icons = ['🔴', '🔵', '🟢', '🟡'];
        const colors = ['#ff5c72', '#4d9dff', '#00e5a0', '#ffd166'];
        S.players = [];
        for (let i = 0; i < n; i++) {
          S.players.push({ name: i === 0 ? 'তুমি' : 'খেলোয়াড় ' + (i + 1), pos: 0, icon: icons[i], color: colors[i], bot: false });
        }
        S.turn = 0;
        S.running = true;
        render();
      }

      function render() {
        host.innerHTML = '';
        const p = S.players[S.turn];
        host.appendChild(h('div', { class: 'chip', style: 'align-self:flex-start', text: p.icon + ' ' + p.name + ' এর পালা' }));

        // board
        const board = h('div', { class: 'board-wrap' }, [buildBoard()]);
        host.appendChild(board);

        // players
        const row = h('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:6px 0 12px' });
        S.players.forEach((pl, i) => {
          const k = pl.pos === 0 ? 'start' : pl.pos;
          row.appendChild(h('span', {
            class: 'chip' + (i === S.turn ? ' on' : ''),
            style: i === S.turn ? 'border-color:#7c4dff;color:#fff' : '',
            text: pl.icon + ' ' + pl.pos
          }));
        });
        host.appendChild(row);

        // dice
        const dice = h('div', { class: 'dice', text: '🎲' });
        const diceWrap = h('div', { class: 'center' }, [
          dice,
          h('button', { class: 'btn primary', style: 'margin-top:14px;padding:12px 34px', text: 'ছক্কা ফেলো', onclick: roll })
        ]);
        host.appendChild(diceWrap);
      }

      function buildBoard() {
        const b = h('div', { class: 'ludo-board' });
        const cellPct = 100 / 10;
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            const fromBottom = row; // row 0 = bottom
            let num;
            if (fromBottom % 2 === 0) num = fromBottom * 10 + col + 1;
            else num = fromBottom * 10 + (10 - col);
            const isLadder = !!LADDERS[num], isSnake = !!SNAKES[num];
            const bg = isLadder ? '#00e5a022' : isSnake ? '#ff5c7222' : ((row + col) % 2 ? '#ffffff06' : '#ffffff0d');
            const cell = h('div', {
              class: 'cell',
              style: 'width:' + cellPct + '%;height:' + cellPct + '%;left:' + (col * cellPct) + '%;bottom:' + (row * cellPct) + '%;background:' + bg + ';display:grid;place-items:center'
            });
            if (num === 100) cell.appendChild(h('span', { style: 'font-size:16px', text: '🏁' }));
            else if (isLadder || isSnake) cell.appendChild(h('span', { style: 'font-size:12px;opacity:.7', text: isLadder ? '🪜' : '🐍' }));
            else cell.appendChild(h('span', { style: 'font-size:9px;opacity:.35', text: num }));

            // pieces
            const here = S.players.filter(p => p.pos === num);
            if (here.length) {
              const stack = h('div', { style: 'display:flex;gap:1px;flex-wrap:wrap;justify-content:center;position:absolute' });
              here.forEach(pp => stack.appendChild(h('span', { style: 'font-size:13px;filter:drop-shadow(0 1px 1px #000)', text: pp.icon })));
              cell.appendChild(stack);
            }
            b.appendChild(cell);
          }
        }
        return b;
      }

      function roll() {
        if (S._busy) return;
        S._busy = true;
        const p = S.players[S.turn];
        const d = 1 + Math.floor(Math.random() * 6);
        const dice = host.querySelector('.dice');
        if (dice) { dice.textContent = '🎲'; dice.classList.add('roll'); }
        sfx.roll(); vibrate(12);
        let n = 0;
        const spin = setInterval(() => {
          if (dice) dice.textContent = String(1 + Math.floor(Math.random() * 6));
          if (++n > 6) {
            clearInterval(spin);
            if (dice) { dice.textContent = String(d); dice.classList.remove('roll'); }
            move(p, d);
          }
        }, 60);
      }

      function move(p, d) {
        let target = p.pos + d;
        if (target > 100) target = 100;
        p.pos = target;
        let msg = p.icon + ' ' + p.name + ' → ' + d + ' নম্বর';
        if (LADDERS[target]) { p.pos = LADDERS[target]; msg += ' 🪜 সিঁড়ি! ' + p.pos; }
        else if (SNAKES[target]) { p.pos = SNAKES[target]; msg += ' 🐍 সাপে কামড়! ' + p.pos; }
        if (d === 6 && p.pos < 100) msg += ' · ছক্কা! আরেকবার';

        render();
        toast(msg, 1500);

        if (p.pos >= 100) return finish(p);

        setTimeout(() => {
          if (d !== 6) S.turn = (S.turn + 1) % S.players.length;
          S._busy = false;
          render();
        }, 700);
      }

      function finish(w) {
        S._busy = true;
        setTimeout(() => {
          ctx.end({
            won: w.name === 'তুমি', coins: 45, emoji: '🏁',
            title: w.icon + ' ' + w.name + ' জিতেছে!',
            sub: 'সাপ-লুডু শেষ — আরেক রাউন্ড খেলো'
          });
        }, 500);
      }

      setup();
    }
  });
})();
