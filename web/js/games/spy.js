/* গুপ্তচর কে? — pass & play */
(function () {
  const { h, toast, vibrate, sfx, shuffle, pick } = UI;

  registerGame({
    id: 'spy', name: 'গুপ্তচর কে?', emoji: '🕵️', tag: 'জনপ্রিয়',
    sub: '৩–১২ জন · পার্টি গেম', color: '#7c4dff',

    mount(host, ctx) {
      const S = {
        names: ['তুমি', 'বন্ধু ১', 'বন্ধু ২', 'বন্ধু ৩'],
        count: 4,
        pair: null,
        spyIndex: -1,
        idx: 0,
        votes: [],
        phase: 'setup'
      };

      function pairFor(n) {
        const p = pick(DATA.SPY_PAIRS);
        return { a: p[0], b: p[1], cat: p[2] };
      }

      /* ---------- setup ---------- */
      function renderSetup() {
        S.phase = 'setup';
        host.innerHTML = '';
        const wrap = h('div');

        wrap.appendChild(h('div', { class: 'hint', style: 'text-align:left;margin-bottom:10px',
          text: 'এক ফোনে সবাই মিলে খেলো। ফোনটা হাতে হাতে ঘুরবে — কেউ অন্যের কার্ড দেখবে না।' }));

        // count stepper
        const cval = h('b', { text: S.count + ' জন' });
        const stepper = h('div', { class: 'row', style: 'justify-content:space-between' }, [
          h('div', { class: 'rt' }, [h('b', { text: 'খেলোয়াড় সংখ্যা' }), h('small', { text: '৩ থেকে ১২ জন' })]),
          h('div', { style: 'display:flex;align-items:center;gap:12px' }, [
            h('button', { class: 'btn sm', text: '−', onclick: () => { if (S.count > 3) { S.count--; syncNames(); renderSetup(); } } }),
            cval,
            h('button', { class: 'btn sm', text: '＋', onclick: () => { if (S.count < 12) { S.count++; syncNames(); renderSetup(); } } })
          ])
        ]);
        wrap.appendChild(stepper);

        wrap.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: 'খেলোয়াড়দের নাম' })]));
        const list = h('div', { class: 'pset' });
        S.names.forEach((n, i) => {
          const inp = h('input', { value: n, maxlength: 12, placeholder: 'নাম ' + (i + 1) });
          inp.addEventListener('input', () => { S.names[i] = inp.value; });
          list.appendChild(h('div', { class: 'prow' }, [
            h('span', { class: 'idx', text: (i + 1) + '.' }),
            inp
          ]));
        });
        wrap.appendChild(list);

        wrap.appendChild(h('div', { class: 'sec-title' }, [h('h2', { text: 'কীভাবে খেলবে?' })]));
        wrap.appendChild(h('div', { class: 'rows' }, [
          h('div', { class: 'row' }, [h('div', { class: 'ri', text: '1️⃣' }), h('div', { class: 'rt' }, [h('b', { text: 'কার্ড দেখো' }), h('small', { text: 'সবাই একটা শব্দ দেখবে, গুপ্তচর শুধু ক্যাটাগরি' })])]),
          h('div', { class: 'row' }, [h('div', { class: 'ri', text: '2️⃣' }), h('div', { class: 'rt' }, [h('b', { text: 'কথা বলো' }), h('small', { text: 'নিজের শব্দ নিয়ে ইঙ্গিত দাও — সরাসরি বললে ধরা পড়বে' })])]),
          h('div', { class: 'row' }, [h('div', { class: 'ri', text: '3️⃣' }), h('div', { class: 'rt' }, [h('b', { text: 'ভোট দাও' }), h('small', { text: 'সবাই মিলে গুপ্তচরকে খুঁজে বের করো' })])])
        ]));

        wrap.appendChild(h('button', {
          class: 'btn primary wide', style: 'margin-top:18px;padding:15px', text: '🎲 খেলা শুরু করো',
          onclick: startReveal
        }));
        host.appendChild(wrap);
      }

      function syncNames() {
        while (S.names.length < S.count) S.names.push('খেলোয়াড় ' + (S.names.length + 1));
        S.names = S.names.slice(0, S.count);
      }

      /* ---------- reveal ---------- */
      function startReveal() {
        syncNames();
        S.names = S.names.map((n, i) => (n && n.trim()) ? n.trim() : ('খেলোয়াড় ' + (i + 1)));
        S.pair = pairFor(S.count);
        const spies = S.count >= 8 ? 2 : 1;
        const idxs = shuffle(S.names.map((_, i) => i)).slice(0, spies);
        S.spyIndex = idxs[0];
        S.spySet = idxs;
        S.idx = 0;
        S.phase = 'reveal';
        renderReveal();
      }

      function renderReveal() {
        host.innerHTML = '';
        if (S.idx >= S.names.length) { startDiscussion(); return; }

        const name = S.names[S.idx];
        const isSpy = S.spySet.indexOf(S.idx) >= 0;

        host.appendChild(h('div', { class: 'hint', text: 'ফোনটা ' + name + ' এর কাছে দাও' }));
        host.appendChild(h('div', { class: 'reveal-wrap' }, [
          h('div', { class: 'tap-card', onclick: revealCard }, [
            h('div', { class: 'big', text: '🎴' }),
            h('div', { class: 'who', text: name }),
            h('div', { class: 'role', text: 'দেখতে ট্যাপ করো' })
          ])
        ]));

        function revealCard() {
          vibrate(15); sfx.tap();
          const card = host.querySelector('.tap-card');
          if (!card) return;
          card.innerHTML = '';
          if (isSpy) {
            card.appendChild(h('div', { class: 'who', text: 'তুমি হলোে' }));
            card.appendChild(h('div', { class: 'big', text: '🕵️' }));
            card.appendChild(h('div', { class: 'word', text: 'গুপ্তচর' }));
            card.appendChild(h('div', { class: 'role', text: 'ক্যাটাগরি: ' + S.pair.cat }));
            card.appendChild(h('div', { class: 'hint', text: 'অন্যদের শব্দটা কী হতে পারে — আন্দাজ করো!' }));
          } else {
            card.appendChild(h('div', { class: 'who', text: 'তোমার শব্দ' }));
            card.appendChild(h('div', { class: 'big', text: '💬' }));
            card.appendChild(h('div', { class: 'word', text: S.pair.a }));
            card.appendChild(h('div', { class: 'role', text: 'ক্যাটাগরি: ' + S.pair.cat }));
            card.appendChild(h('div', { class: 'hint', text: 'গুপ্তচর এই শব্দটা জানে না' }));
          }
          card.appendChild(h('button', {
            class: 'btn primary wide', style: 'margin-top:6px', text: 'দেখেছি ✓',
            onclick: (e) => { e.stopPropagation(); S.idx++; renderReveal(); }
          }));
        }
      }

      /* ---------- discussion ---------- */
      function startDiscussion() {
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'center', style: 'padding-top:10px' }, [
          h('div', { style: 'font-size:52px', text: '🗣️' }),
          h('h3', { text: 'আলোচনা শুরু করো' }),
          h('p', { class: 'hint', text: 'প্রত্যেকে নিজের শব্দ নিয়ে একটা ইঙ্গিত দাও। কে গুপ্তচর — সন্দেহ করো!' }),
          h('div', { class: 'timer-big', id: 'spyTimer', text: '03:00' }),
          h('div', { class: 'progress', style: 'width:100%' }, [h('i', { id: 'spyBar', style: 'width:100%;transition:width 1s linear' })])
        ]));
        const pauseBtn = h('button', { class: 'btn wide', text: '⏸ থামাও', onclick: () => {
          paused = !paused;
          pauseBtn.textContent = paused ? '▶ চালাও' : '⏸ থামাও';
        } });
        const btns = h('div', { style: 'display:flex;gap:10px;margin-top:20px' }, [
          pauseBtn,
          h('button', { class: 'btn primary wide', text: '🗳️ ভোট দাও', onclick: () => { clearInterval(timer); startVote(); } })
        ]);
        host.appendChild(btns);

        let left = 180, paused = false;
        const tEl = document.getElementById('spyTimer');
        const bar = document.getElementById('spyBar');
        const timer = setInterval(() => {
          if (paused) return;
          left--;
          const m = String(Math.floor(left / 60)).padStart(2, '0');
          const s = String(left % 60).padStart(2, '0');
          tEl.textContent = m + ':' + s;
          bar.style.width = Math.max(0, (left / 180) * 100) + '%';
          if (left <= 0) { clearInterval(timer); startVote(); }
        }, 1000);

        S._timer = timer;
      }

      /* ---------- vote ---------- */
      function startVote() {
        S.idx = 0;
        S.votes = new Array(S.names.length).fill(-1);
        renderVote();
      }

      function renderVote() {
        host.innerHTML = '';
        if (S.idx >= S.names.length) { showResult(); return; }
        host.appendChild(h('div', { class: 'hint', text: S.names[S.idx] + ', কে গুপ্তচর বলে মনে হচ্ছে?' }));

        const list = h('div', { class: 'vote-list', style: 'margin-top:12px' });
        S.names.forEach((n, i) => {
          if (i === S.idx) return;
          list.appendChild(h('button', {
            class: 'vote-row', onclick: () => {
              S.votes[S.idx] = i; vibrate(10); sfx.tap();
              S.idx++; renderVote();
            }
          }, [
            h('span', { style: 'font-size:20px', text: '🧑' }),
            h('b', { text: n }),
            h('span', { class: 'vc', text: 'ভোট দাও ›' })
          ]));
        });
        host.appendChild(list);
      }

      /* ---------- result ---------- */
      function showResult() {
        const tally = new Array(S.names.length).fill(0);
        S.votes.forEach(v => { if (v >= 0) tally[v]++; });
        let max = -1, accused = -1;
        tally.forEach((c, i) => { if (c > max) { max = c; accused = i; } });
        const caught = S.spySet.indexOf(accused) >= 0;

        host.innerHTML = '';
        host.appendChild(h('div', { class: 'center', style: 'padding-top:8px' }, [
          h('div', { style: 'font-size:50px', text: caught ? '🎯' : '🕵️' }),
          h('h3', { text: caught ? 'ধরা পড়ে গেছে!' : 'গুপ্তচর বেঁচে গেছে!' }),
          h('p', { class: 'hint', text: 'বেশিভাগ ভোট পেয়েছে: ' + S.names[accused] })
        ]));

        const rows = h('div', { class: 'rows', style: 'margin-top:14px' });
        rows.appendChild(h('div', { class: 'row' }, [
          h('div', { class: 'ri', text: '🕵️' }),
          h('div', { class: 'rt' }, [h('b', { text: 'গুপ্তচর' }), h('small', { text: S.spySet.map(i => S.names[i]).join(', ') })])
        ]));
        rows.appendChild(h('div', { class: 'row' }, [
          h('div', { class: 'ri', text: '💬' }),
          h('div', { class: 'rt' }, [h('b', { text: 'আসল শব্দ' }), h('small', { text: S.pair.a + ' · ' + S.pair.cat })])
        ]));
        host.appendChild(rows);

        let coins = 30 + (caught ? 20 : 0);
        ctx.end({
          won: caught, coins, emoji: caught ? '🎉' : '😅',
          title: caught ? 'সিভিলিয়ানরা জিতেছে!' : 'গুপ্তচর জিতেছে!',
          sub: 'গুপ্তচর ছিল: ' + S.spySet.map(i => S.names[i]).join(', ') + ' · শব্দ: ' + S.pair.a
        });
      }

      renderSetup();

      return function cleanup() { if (S._timer) clearInterval(S._timer); };
    }
  });
})();
