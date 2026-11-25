/* শব্দের খেলা — বাংলা শব্দ-শৃঙ্খল বনাম বট */
(function () {
  const { h, toast, vibrate, sfx, pick } = UI;

  registerGame({
    id: 'wordchain', name: 'শব্দের খেলা', emoji: '🔤', tag: 'বুদ্ধির',
    sub: 'বাংলা শব্দ · বটের সাথে', color: '#ffb020',

    mount(host, ctx) {
      const S = { used: [], chain: [], score: 0, lives: 3, last: '', playing: false };

      // every word we know about (keys + bot replies)
      const ALL = (function () {
        const set = {};
        Object.keys(DATA.WORDS).forEach(k => { set[k] = 1; });
        Object.values(DATA.WORDS).forEach(arr => arr.forEach(w => { set[w] = 1; }));
        return Object.keys(set);
      })();

      function intro() {
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'center', style: 'padding:6px 0 14px' }, [
          h('div', { style: 'font-size:48px', text: '🔤' }),
          h('h3', { text: 'শব্দের খেলা' }),
          h('p', { class: 'hint', text: 'শেষ অক্ষর দিয়ে নতুন শব্দ বলো। যেমন: আকাশ → শেষ → শেষ... না, "শ" দিয়ে নতুন শব্দ!' })
        ]));
        host.appendChild(h('div', { class: 'rows' }, [
          rule('1', 'প্রথম শব্দের শেষ অক্ষর দিয়ে শুরু করো'),
          rule('2', 'একই শব্দ দুইবার বলা যাবে না'),
          rule('3', '৩০ সেকেন্ডের মধ্যে বলতে হবে'),
          rule('4', 'ভুল হলে একটি জীবন কমবে (৩টি জীবন)')
        ]));
        host.appendChild(h('button', { class: 'btn primary wide', style: 'margin-top:18px;padding:14px', text: 'শুরু করো', onclick: start }));
      }

      function rule(n, t) {
        return h('div', { class: 'row' }, [h('div', { class: 'ri', text: n }), h('div', { class: 'rt' }, [h('b', { text: t })])]);
      }

      function start() {
        S.used = []; S.chain = []; S.score = 0; S.lives = 3;
        S.last = pick(DATA.WORD_START);
        S.used.push(S.last);
        S.chain.push({ who: 'bot', word: S.last });
        S.playing = true;
        render(false);
      }

      function render(botThinking) {
        host.innerHTML = '';
        host.appendChild(h('div', { style: 'display:flex;justify-content:space-between;margin-bottom:8px' }, [
          h('span', { class: 'chip', text: '❤️ ' + S.lives }),
          h('span', { class: 'chip', text: '⭐ ' + S.score })
        ]));

        const list = h('div', { class: 'rows', style: 'max-height:38dvh;overflow-y:auto' });
        S.chain.slice().reverse().forEach(c => {
          list.appendChild(h('div', { class: 'row', style: c.who === 'me' ? 'border-color:#7c4dff55' : '' }, [
            h('div', { class: 'ri', text: c.who === 'me' ? '🙋' : '🤖' }),
            h('div', { class: 'rt' }, [h('b', { text: c.word })])
          ]));
        });
        host.appendChild(list);

        const lastWord = S.chain[S.chain.length - 1].word;
        const need = lastWord.charAt(lastWord.length - 1);

        if (botThinking) {
          host.appendChild(h('div', { class: 'center', style: 'padding:20px 0' }, [
            h('div', { style: 'font-size:30px', text: '🤖💭' }),
            h('p', { class: 'hint', text: 'বট ভাবছে...' })
          ]));
          return;
        }

        host.appendChild(h('div', { class: 'center', style: 'padding:12px 0 6px' }, [
          h('p', { class: 'hint', text: 'তোমার শব্দ "' + need + '" দিয়ে শুরু হবে' }),
          h('div', { class: 'timer-big', id: 'wcTimer', style: 'font-size:38px', text: '30' })
        ]));

        const inp = h('input', { class: 'input', placeholder: '"' + need + '" দিয়ে শব্দ লিখো', style: 'font-size:17px;text-align:center' });
        const btn = h('button', { class: 'btn primary wide', style: 'margin-top:10px;padding:13px', text: 'বলো ✓', onclick: submit });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        host.appendChild(inp);
        host.appendChild(btn);

        let left = 30;
        const tEl = document.getElementById('wcTimer');
        clearInterval(S._t);
        S._t = setInterval(() => {
          left--;
          if (tEl) tEl.textContent = String(left);
          if (left <= 0) { clearInterval(S._t); loseLife('⏰ সময় শেষ!'); }
        }, 1000);
        setTimeout(() => inp.focus(), 100);

        function submit() {
          const v = inp.value.trim();
          if (!v) return;
          if (v.charAt(0) !== need) { toast('"' + need + '" দিয়ে শুরু করো'); return; }
          if (S.used.indexOf(v) >= 0) { toast('এই শব্দ আগে বলা হয়েছে'); return; }
          clearInterval(S._t);
          S.used.push(v);
          S.chain.push({ who: 'me', word: v });
          S.score += 10; sfx.coin(); vibrate(10);
          botTurn(v);
        }
      }

      function botTurn(myWord) {
        const need = myWord.charAt(myWord.length - 1);
        const options = ALL.filter(w => w.charAt(0) === need && S.used.indexOf(w) < 0);
        const next = options.length ? pick(options) : null;

        if (!next) {
          // bot can't answer — player wins the round
          setTimeout(() => {
            ctx.end({ won: true, coins: 30 + S.score, emoji: '🏆', title: 'তুমি জিতেছ!', sub: 'বট আর শব্দ খুঁজে পায়নি · স্কোর ' + S.score });
          }, 500);
          return;
        }

        render(true);
        setTimeout(() => {
          S.used.push(next);
          S.chain.push({ who: 'bot', word: next });
          render(false);
        }, 700 + Math.random() * 500);
      }

      function loseLife(msg) {
        S.lives--;
        vibrate(40);
        if (S.lives <= 0) {
          ctx.end({ won: false, coins: S.score, emoji: '😅', title: 'খেলা শেষ — ' + msg, sub: 'স্কোর: ' + S.score + ' · আরেকবার চেষ্টা করো' });
          return;
        }
        toast(msg + ' · বাকি ' + S.lives + ' জীবন');
        S.chain.push({ who: 'bot', word: S.chain[S.chain.length - 1].word });
        render(false);
      }

      intro();
    }
  });
})();
