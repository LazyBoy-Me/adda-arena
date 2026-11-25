/* Adda Arena — UI helpers */
(function () {
  const root = document.getElementById('modalRoot');
  const toastEl = document.getElementById('toast');

  function h(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }

  let toastTimer = null;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('in'), ms || 1900);
  }

  function sheet(title, sub, builder) {
    const backdrop = h('div', { class: 'backdrop' });
    const panel = h('div', { class: 'sheet' });
    const close = () => {
      panel.classList.remove('in'); backdrop.classList.remove('in');
      setTimeout(() => { backdrop.remove(); panel.remove(); }, 230);
    };
    if (title) panel.appendChild(h('h3', { text: title }));
    if (sub) panel.appendChild(h('p', { class: 'sub', text: sub }));
    const body = h('div');
    panel.appendChild(body);
    builder(body, close);
    backdrop.addEventListener('click', close);
    root.appendChild(backdrop); root.appendChild(panel);
    requestAnimationFrame(() => { backdrop.classList.add('in'); panel.classList.add('in'); });
    return close;
  }

  function confirmBox(title, msg, okText) {
    return new Promise(resolve => {
      const backdrop = h('div', { class: 'backdrop' });
      const panel = h('div', { class: 'sheet' });
      let settled = false;
      const finish = v => {
        if (settled) return; settled = true;
        panel.classList.remove('in'); backdrop.classList.remove('in');
        setTimeout(() => { panel.remove(); backdrop.remove(); }, 230);
        resolve(v);
      };
      panel.appendChild(h('h3', { text: title }));
      if (msg) panel.appendChild(h('p', { class: 'sub', text: msg }));
      const row = h('div', { style: 'display:flex;gap:10px;margin-top:6px' });
      row.appendChild(h('button', { class: 'btn wide', text: 'বাতিল', onclick: () => finish(false) }));
      row.appendChild(h('button', { class: 'btn primary wide', text: okText || 'হ্যাঁ', onclick: () => finish(true) }));
      panel.appendChild(row);
      backdrop.addEventListener('click', () => finish(false));
      root.appendChild(backdrop); root.appendChild(panel);
      requestAnimationFrame(() => { backdrop.classList.add('in'); panel.classList.add('in'); });
    });
  }

  function vibrate(ms) {
    if (Store.state.settings.haptics && navigator.vibrate) navigator.vibrate(ms || 12);
  }

  let actx = null;
  function beep(freq, dur, type) {
    if (!Store.state.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq || 440;
      g.gain.setValueAtTime(0.05, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.15));
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + (dur || 0.15));
    } catch (e) {}
  }

  const sfx = {
    tap() { beep(520, 0.06, 'triangle'); },
    win() { beep(660, 0.12); setTimeout(() => beep(880, 0.18), 110); },
    lose() { beep(220, 0.2, 'sawtooth'); },
    coin() { beep(980, 0.07, 'square'); setTimeout(() => beep(1320, 0.09, 'square'), 70); },
    roll() { beep(300, 0.05, 'square'); }
  };

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  function bn(n) { return String(n).replace(/[0-9]/g, d => bnDigits[+d]); }

  window.UI = { h, toast, sheet, confirmBox, vibrate, beep, sfx, shuffle, pick, bn };
})();
