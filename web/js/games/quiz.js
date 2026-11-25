/* কুইজ — ১০টি প্রশ্ন */
(function () {
  const { h, toast, vibrate, sfx, shuffle } = UI;

  registerGame({
    id: 'quiz', name: 'কুইজ', emoji: '🧠', tag: 'জ্ঞান',
    sub: '১০ প্রশ্ন · সাধারণ জ্ঞান', color: '#4d9dff',

    mount(host, ctx) {
      let qs = [], i = 0, score = 0, locked = false;

      function start() {
        i = 0; score = 0;
        qs = shuffle(DATA.QUIZ).slice(0, 10).map(q => {
          const opts = q[1].map((t, idx) => ({ t, correct: idx === q[2] }));
          return { q: q[0], opts: shuffle(opts) };
        });
        render();
      }

      function render() {
        locked = false;
        host.innerHTML = '';
        if (i >= qs.length) return finish();
        const Q = qs[i];

        host.appendChild(h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px' }, [
          h('span', { class: 'chip', text: 'প্রশ্ন ' + UI.bn(i + 1) + '/' + UI.bn(qs.length) }),
          h('span', { class: 'chip', text: '⭐ ' + score })
        ]));
        host.appendChild(h('div', { class: 'progress', style: 'margin-bottom:16px' }, [h('i', { style: 'width:' + ((i / qs.length) * 100) + '%' })]));

        host.appendChild(h('h3', { style: 'font-size:17px;line-height:1.45;margin:0 0 16px', text: Q.q }));

        const opts = h('div');
        Q.opts.forEach((o) => {
          const b = h('button', { class: 'opt', text: o.t, onclick: () => answer(b, o, Q) });
          opts.appendChild(b);
        });
        host.appendChild(opts);
      }

      function answer(btn, opt, Q) {
        if (locked) return;
        locked = true;
        if (opt.correct) {
          score += 10; btn.classList.add('correct'); sfx.coin(); vibrate(12);
        } else {
          btn.classList.add('wrong'); sfx.lose(); vibrate(30);
          Array.from(host.querySelectorAll('.opt')).forEach((b, idx) => {
            if (Q.opts[idx].correct) b.classList.add('correct');
          });
        }
        setTimeout(() => { i++; render(); }, 900);
      }

      function finish() {
        const right = score / 10;
        const coins = 15 + score;
        const b = UI.bn(right);
        ctx.end({
          won: right >= 5, coins, emoji: right >= 8 ? '🧠' : right >= 5 ? '🙂' : '📚',
          title: b + '/১০ সঠিক',
          sub: right >= 8 ? 'দারুণ! তুমি কুইজ মাস্টার' : right >= 5 ? 'ভালো করেছ — আরেকবার!' : 'আরও প্র্যাকটিস দরকার'
        });
      }

      start();
    }
  });
})();
