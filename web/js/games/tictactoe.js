/* টিক-ট্যাক-টো */
(function () {
  const { h, toast, vibrate, sfx } = UI;

  registerGame({
    id: 'ttt', name: 'টিক-ট্যাক-টো', emoji: '⭕', tag: 'দ্রুত',
    sub: 'একা বা দুইজন · ১ মিনিট', color: '#ff4d9d',

    mount(host, ctx) {
      let mode = null; // 'bot' | 'duo'
      let board = Array(9).fill('');
      let turn = 'X';
      let over = false;
      let score = { X: 0, O: 0 };

      const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

      function choose() {
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'center', style: 'padding:8px 0 16px' }, [
          h('div', { style: 'font-size:46px', text: '⭕❌' }),
          h('h3', { text: 'কীভাবে খেলবে?' })
        ]));
        host.appendChild(h('div', { class: 'rows' }, [
          h('button', { class: 'row', onclick: () => { mode = 'bot'; reset(); } }, [
            h('div', { class: 'ri', text: '🤖' }),
            h('div', { class: 'rt' }, [h('b', { text: 'বটের সাথে' }), h('small', { text: 'একা খেলো, বট হারাও' })]),
            h('span', { class: 'chev', text: '›' })
          ]),
          h('button', { class: 'row', onclick: () => { mode = 'duo'; reset(); } }, [
            h('div', { class: 'ri', text: '👥' }),
            h('div', { class: 'rt' }, [h('b', { text: 'দুইজন মিলে' }), h('small', { text: 'এক ফোনে পালা করে' })]),
            h('span', { class: 'chev', text: '›' })
          ])
        ]));
      }

      function reset() {
        board = Array(9).fill('');
        turn = 'X'; over = false;
        render();
      }

      function render() {
        host.innerHTML = '';
        host.appendChild(h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px' }, [
          h('span', { class: 'chip', text: '❌ ' + score.X }),
          h('span', { class: 'chip', text: over ? 'শেষ' : (turn === 'X' ? '❌ এর পালা' : '⭕ এর পালা') }),
          h('span', { class: 'chip', text: '⭕ ' + score.O })
        ]));

        const g = h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:min(86vw,330px);margin:6px auto' });
        board.forEach((v, i) => {
          g.appendChild(h('button', {
            style: 'aspect-ratio:1;border-radius:16px;background:#1b1430;border:1px solid #302450;display:grid;place-items:center;font-size:44px;font-weight:700;color:' + (v === 'X' ? '#ff4d9d' : '#4d9dff'),
            text: v,
            onclick: () => play(i)
          }));
        });
        host.appendChild(g);

        if (over) {
          host.appendChild(h('div', { style: 'display:flex;gap:10px;margin-top:14px' }, [
            h('button', { class: 'btn wide', text: 'নতুন রাউন্ড', onclick: reset }),
            h('button', { class: 'btn primary wide', text: 'শেষ করো', onclick: () => ctx.end({ won: score.X > score.O, coins: score.X > score.O ? 30 : 12, emoji: '🏁', title: 'স্কোর ' + score.X + ' – ' + score.O, sub: 'টিক-ট্যাক-টো' }) })
          ]));
        }
      }

      function play(i) {
        if (over || board[i]) return;
        if (mode === 'bot' && turn === 'O') return;
        place(i, turn);
      }

      function place(i, who) {
        board[i] = who; vibrate(8); sfx.tap();
        const win = winner();
        if (win) return endRound(win);
        if (board.every(v => v)) return endRound(null);
        turn = who === 'X' ? 'O' : 'X';
        render();
        if (mode === 'bot' && turn === 'O') setTimeout(botMove, 420);
      }

      function winner() {
        for (const l of LINES) {
          const [a, b, c] = l;
          if (board[a] && board[a] === board[b] && board[a] === board[c]) return { who: board[a], line: l };
        }
        return null;
      }

      function endRound(win) {
        over = true;
        if (win) { score[win.who]++; sfx.win(); } else { sfx.lose(); }
        render();
        const cells = host.querySelectorAll('button');
        // highlight
        const g = host.querySelector('div[style*="grid-template-columns"]');
        if (win && g) win.line.forEach(i => {
          g.children[i].style.boxShadow = 'inset 0 0 0 3px #00e5a0';
          g.children[i].style.background = '#00e5a022';
        });
        if (mode === 'bot') {
          if (win && win.who === 'X') toast('তুমি জিতেছ! 🎉');
          else if (win) toast('বট জিতেছে 😅');
          else toast('ড্র! 🤝');
        }
      }

      /* ---- minimax bot (hard) ---- */
      function botMove() {
        if (over) return;
        const best = bestMove();
        if (best >= 0) place(best, 'O');
      }

      function bestMove() {
        let best = -1, bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i]) continue;
          board[i] = 'O';
          const s = minimax(board, 0, false);
          board[i] = '';
          if (s > bestScore) { bestScore = s; best = i; }
        }
        return best;
      }

      function minimax(b, depth, maximizing) {
        const w = (function () {
          for (const l of LINES) {
            const [a, bb, c] = l;
            if (b[a] && b[a] === b[bb] && b[a] === b[c]) return b[a];
          }
          return b.every(v => v) ? 'D' : null;
        })();
        if (w === 'O') return 10 - depth;
        if (w === 'X') return depth - 10;
        if (w === 'D') return 0;
        if (maximizing) {
          let v = -Infinity;
          for (let i = 0; i < 9; i++) { if (b[i]) continue; b[i] = 'O'; v = Math.max(v, minimax(b, depth + 1, false)); b[i] = ''; }
          return v;
        } else {
          let v = Infinity;
          for (let i = 0; i < 9; i++) { if (b[i]) continue; b[i] = 'X'; v = Math.min(v, minimax(b, depth + 1, true)); b[i] = ''; }
          return v;
        }
      }

      choose();
    }
  });
})();
