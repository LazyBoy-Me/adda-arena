/* সত্য না সাহস — পার্টি গেম */
(function () {
  const { h, toast, vibrate, sfx, pick } = UI;

  registerGame({
    id: 'truthdare', name: 'সত্য না সাহস', emoji: '🎭', tag: 'পার্টি',
    sub: '২–১০ জন · মজার চ্যালেঞ্জ', color: '#ff4d9d',

    mount(host, ctx) {
      let names = ['তুমি', 'বন্ধু ১', 'বন্ধু ২', 'বন্ধু ৩'];
      let turn = 0, rounds = 0;

      function setup() {
        host.innerHTML = '';
        host.appendChild(h('div', { class: 'center', style: 'padding:0 0 12px' }, [
          h('div', { style: 'font-size:46px', text: '🎭' }),
          h('h3', { text: 'সত্য না সাহস' }),
          h('p', { class: 'hint', text: 'পালা অনুযায়ী একজন সত্য বলবে অথবা সাহসের কাজ করবে।' })
        ]));

        const list = h('div', { class: 'pset' });
        const renderNames = () => {
          list.innerHTML = '';
          names.forEach((n, i) => {
            const inp = h('input', { value: n, maxlength: 12 });
            inp.addEventListener('input', () => { names[i] = inp.value; });
            list.appendChild(h('div', { class: 'prow' }, [
              h('span', { class: 'idx', text: (i + 1) + '.' }), inp,
              names.length > 2 ? h('button', { class: 'del', text: '✕', onclick: () => { names.splice(i, 1); renderNames(); } }) : null
            ]));
          });
        };
        renderNames();
        host.appendChild(list);

        host.appendChild(h('div', { style: 'display:flex;gap:8px;margin-top:10px' }, [
          h('button', { class: 'btn wide', text: '＋ খেলোয়াড়', onclick: () => { if (names.length < 10) { names.push('খেলোয়াড় ' + (names.length + 1)); renderNames(); } } }),
          h('button', { class: 'btn primary wide', text: 'শুরু', onclick: () => { turn = 0; rounds = 0; play(); } })
        ]));
      }

      function play() {
        host.innerHTML = '';
        const name = names[turn % names.length];
        host.appendChild(h('div', { class: 'center', style: 'padding-top:12px' }, [
          h('div', { style: 'font-size:52px', text: '🌀' }),
          h('p', { class: 'hint', text: 'পালা এসেছে' }),
          h('h2', { style: 'font-size:26px;margin:2px 0 18px', text: name })
        ]));

        host.appendChild(h('div', { style: 'display:flex;gap:10px' }, [
          h('button', { class: 'btn primary wide', style: 'padding:16px;font-size:16px', text: '💬 সত্য', onclick: () => show('truth') }),
          h('button', { class: 'btn danger wide', style: 'padding:16px;font-size:16px', text: '🔥 সাহস', onclick: () => show('dare') })
        ]));

        host.appendChild(h('div', { class: 'hint', style: 'margin-top:16px', text: 'রাউন্ড ' + (rounds + 1) + ' · মোট ' + names.length + ' জন' }));
        host.appendChild(h('button', {
          class: 'btn wide', style: 'margin-top:14px', text: 'শেষ করো',
          onclick: () => ctx.end({ won: true, coins: 15 + rounds * 3, emoji: '🎭', title: 'দারুণ আড্ডা!', sub: rounds + ' রাউন্ড খেলেছ' })
        }));
      }

      function show(type) {
        const prompt = pick(type === 'truth' ? DATA.TRUTH : DATA.DARE);
        vibrate(15); sfx.tap();
        const name = names[turn % names.length];

        UI.sheet(type === 'truth' ? '💬 সত্য' : '🔥 সাহস', name + ' এর জন্য', (body, close) => {
          body.appendChild(h('div', {
            style: 'padding:18px;border-radius:16px;background:#241a3d;border:1px solid #302450;font-size:16px;line-height:1.6;margin-bottom:14px',
            text: prompt
          }));
          body.appendChild(h('button', {
            class: 'btn primary wide', text: 'সম্পন্ন ✓', onclick: () => {
              close(); rounds++; turn++;
              setTimeout(play, 240);
            }
          }));
          body.appendChild(h('button', {
            class: 'btn wide', style: 'margin-top:8px', text: '🔄 আরেকটা', onclick: () => { close(); setTimeout(() => show(type), 240); }
          }));
        });
      }

      setup();
    }
  });
})();
