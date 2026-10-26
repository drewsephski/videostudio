// Krafty Bot — "Real work", premium cut. 20 s, 16:9 + 9:16.
// One continuous phone carries the whole product story, so nothing hard-cuts until the end card.
// The phone and the app screens are rebuilt element by element from kraftybot.app (the "Give each Bot a job" phone
// mockup and the hero app): same layout, copy, bubble colour (#01b6c3) and bot colours/shapes, measured from the site.
// Bots are drawn as shaded SVG (gradient body, specular, inner shade, contact shadow) in the app's own colours.
// Pure function of time: no timers, no Math.random, nothing mutated in run().
(() => {
  // review.py measures the 50 %-of-motion-peak frame; these leads put that frame on the audio hit
  const _hit = C.spHit;
  const LEADS = { snappy: -0.04, heavy: -0.04, default: 0.05, playful: 0 };
  C.spHit = (t, b, p = 'snappy', lead = LEADS[p] ?? C.leadFor(p)) => _hit(t, b, p, lead);
  const { W, H, pick, put, reg, el, scene, sp, spHit, trk, seg, clamp, lerp, ease, bt, beatOf, noise1 } = C;
  const { line, rise } = TYPE;
  C.fonts = ['700 100px Display', '400 40px Display'];
  const TALL = C.FMT === '9x16';
  const PAD = pick(140, 90, 80);

  document.head.appendChild(el('style', {}, null, `
    .ui { font-family: 'Display', Arial, sans-serif; letter-spacing: -0.01em; }
    .app { font-family: system-ui, -apple-system, sans-serif; color: #f2f2f2; letter-spacing: -0.01em; -webkit-font-smoothing: antialiased; }
    .app * { box-sizing: border-box; }
    .a { position: absolute; left: 0; top: 0; }
    .mut { color: #9a9a9a; }
    .pill { position: absolute; border-radius: 999px; display: flex; align-items: center; white-space: nowrap; }
    .ell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .glass { background: rgba(44,44,46,.72); border: 1px solid rgba(255,255,255,.09); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
  `));

  // ------------------------------------------------------------------ bots: the app's own shapes and colours, shaded
  const BOTS = {
    chief:   { name: 'Chief', c: '#50b6a3', shape: 'circle' },
    sales:   { name: 'Sales Outbound', c: '#f7a32f', shape: 'circle' },
    inbox:   { name: 'Inbox Manager', c: '#6761f2', shape: 'tri' },
    account: { name: 'Account Manager', c: '#8954f6', shape: 'squircle' },
    talent:  { name: 'Talent Scout', c: '#3583f4', shape: 'circle' },
    expense: { name: 'Expense Manager', c: '#f6732a', shape: 'circle' },
  };
  const ORDER = ['chief', 'sales', 'inbox', 'account', 'talent', 'expense'];
  const shade = (hex, k) => {           // k > 0 lighter, k < 0 darker
    const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  const SHAPES = {
    circle: '<circle cx="50" cy="50" r="47"/>',
    tri: '<path d="M50 5c6 0 10 3 13 8l34 62c5 9-1 20-12 20H15C4 95-2 84 3 75L37 13c3-5 7-8 13-8z"/>',
    squircle: '<rect x="9" y="9" width="82" height="82" rx="30" transform="rotate(-14 50 50)"/>',
  };
  let BOTN = 0;
  function bot(parent, key, size, x = 0, y = 0, shadow = true) {
    const B = BOTS[key], id = 'b' + (BOTN++), s = SHAPES[B.shape];
    const eyeY = B.shape === 'tri' ? 46 : 30;
    const svg = `<svg width="${size}" height="${size * 1.14}" viewBox="0 0 100 114" style="overflow:visible;display:block">
      <defs>
        <radialGradient id="${id}g" cx="34%" cy="26%" r="85%"><stop offset="0" stop-color="${shade(B.c, 0.42)}"/><stop offset=".42" stop-color="${B.c}"/><stop offset="1" stop-color="${shade(B.c, -0.42)}"/></radialGradient>
        <radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>
        <filter id="${id}s" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
        <clipPath id="${id}c">${s}</clipPath>
      </defs>
      ${shadow ? `<ellipse cx="52" cy="106" rx="33" ry="5.5" fill="#000" opacity=".5" filter="url(#${id}s)"/>` : ''}
      <g fill="url(#${id}g)">${s}</g>
      <g clip-path="url(#${id}c)">
        <ellipse cx="80" cy="88" rx="46" ry="40" fill="#000" opacity=".26" filter="url(#${id}b)"/>
        <g fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3" transform="translate(1.6 1.6)">${s}</g>
        <ellipse cx="33" cy="25" rx="17" ry="10" fill="url(#${id}h)" transform="rotate(-28 33 25)"/>
      </g>
      <g fill="#161615"><rect x="56" y="${eyeY}" width="8" height="17" rx="4" transform="rotate(8 60 ${eyeY + 8})"/><rect x="71" y="${eyeY}" width="8" height="17" rx="4" transform="rotate(8 75 ${eyeY + 8})"/></g>
      <g fill="#fff" opacity=".55"><circle cx="59" cy="${eyeY + 4}" r="1.6"/><circle cx="74" cy="${eyeY + 4}" r="1.6"/></g>
    </svg>`;
    const e = el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform-origin:50% 50%` }, parent, svg);
    return reg(e);
  }

  // the Krafty mascot: the site's /icon.png as a mask, shaded like the bots
  function mascot(parent, size, x, y) {
    const m = el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform-origin:50% 70%;filter:drop-shadow(0 ${size * 0.08}px ${size * 0.08}px rgba(0,0,0,.55))` }, parent);
    el('div', { class: 'a', style: `width:${size}px;height:${size}px;-webkit-mask:url(../assets/brand/mascot.png) center/contain no-repeat;
      background: radial-gradient(ellipse 30% 20% at 34% 30%, rgba(255,255,255,.95), rgba(255,255,255,0) 100%),
                  radial-gradient(ellipse 70% 60% at 72% 82%, rgba(120,100,70,.35), rgba(120,100,70,0) 100%),
                  radial-gradient(circle at 38% 32%, #fffdf6 0%, #faf4e6 45%, #ddd2bb 100%)` }, m);
    const k = size / 512;
    const lids = [[165, 216, 62, 102], [284, 216, 62, 102]].map(([ex, ey, ew, eh]) =>
      reg(el('div', { class: 'a', style: `left:${ex * k - 2}px;top:${ey * k - 3}px;width:${ew * k + 4}px;height:${eh * k + 6}px;background:#f3ecdc;transform-origin:50% 0` }, m), { o: 0 }));
    return { el: reg(m, { o: 0 }), lids };
  }
  function blink(t, M, beats) {
    let a = 0;
    for (const b of beats) { const d = t - bt(b); if (d >= 0 && d < 0.18) a = Math.max(a, d < 0.07 ? d / 0.07 : 1 - (d - 0.07) / 0.11); }
    M.lids.forEach((l) => put(l, { o: a > 0.02 ? 1 : 0, sy: a }));
  }

  const drift = noise1(11), drift2 = noise1(23), drift3 = noise1(37);
  const CHECK = (c = '#161615', s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON = {
    back: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#eee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    desk: '<svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" fill="none" stroke="#eee" stroke-width="1.8"/><path d="M9 20h6M12 16v4" stroke="#eee" stroke-width="1.8" stroke-linecap="round"/></svg>',
    plus: '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#eee" stroke-width="2" stroke-linecap="round"/></svg>',
    mic: '<svg width="18" height="20" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3" fill="none" stroke="#bbb" stroke-width="2"/><path d="M5 11a7 7 0 0014 0M12 18v3" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="#161615" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="#8a8a8a" stroke-width="2"/><path d="M16 16l4 4" stroke="#8a8a8a" stroke-width="2" stroke-linecap="round"/></svg>',
    doc: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z" fill="none" stroke="#ddd" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 12h5M10 16h5" stroke="#ddd" stroke-width="1.8" stroke-linecap="round"/></svg>',
    status: '<svg width="70" height="14" viewBox="0 0 70 14"><g fill="#f2f2f2"><rect x="0" y="9" width="3" height="4" rx="1"/><rect x="5" y="6" width="3" height="7" rx="1"/><rect x="10" y="3" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="13" rx="1"/><path d="M29 4.5a10 10 0 0114 0l-1.6 1.6a7.7 7.7 0 00-10.8 0zM32.2 7.7a5.5 5.5 0 017.6 0L36 11.5z"/><rect x="47" y="1" width="20" height="11" rx="3" fill="none" stroke="#f2f2f2" stroke-opacity=".5"/><rect x="49" y="3" width="15" height="7" rx="1.5"/><rect x="68" y="4.5" width="1.6" height="4" rx=".8" fill-opacity=".5"/></g></svg>',
  };

  // ------------------------------------------------------------------ phone geometry (logical px; the phone is scaled per format)
  const PW = 436, PH = 904, INSET = 16, SW = PW - 2 * INSET, SH = PH - 2 * INSET;
  const PS = pick(1.08, 0.95, 1.15);
  const PCX = pick(1380, W * 0.66, W / 2), PCY = pick(H / 2 + 6, H / 2 + 40, 985);
  // end card: the phone collapses into the mascot at this point
  const MS = pick(380, 340, 520), MCX = PCX, MCY = pick(PCY - 40, PCY - 40, 640);
  // the phone's pose at time t: rises in on a heavy spring, floats on seeded noise, drops past camera at the end
  function pose(t) {
    const up = sp(t, 'phone_in', 'heavy'), out = sp(t, 'collapse', 'heavy');   // ~85 % collapsed when the mascot appears over it
    return {
      x: 10 * drift(t * 0.35) * (1 - out) + (MCX - PCX) * out,
      y: (1 - up) * (H * 0.75) + 7 * drift2(t * 0.5) * (1 - out) + (MCY - PCY) * out,
      r: ((1 - up) * 9 + 0.7 * drift3(t * 0.4)) * (1 - out),
      s: PS * (1 - 0.67 * out),
    };
  }
  // stage coords of a point (sx, sy) on the phone screen, at time t
  function P(t, sx, sy) {
    const p = pose(t), a = (p.r * Math.PI) / 180;
    const vx = (INSET + sx - PW / 2) * p.s, vy = (INSET + sy - PH / 2) * p.s;
    return [PCX + p.x + vx * Math.cos(a) - vy * Math.sin(a), PCY + p.y + vx * Math.sin(a) + vy * Math.cos(a)];
  }

  // ================================================================ the whole product story: one scene, one phone
  scene({
    name: 'story', from: 'hook', to: 33,
    build(root, S) {
      S.cam = el('div', { class: 'a', style: `width:${W}px;height:${H}px;transform-origin:50% 50%` }, root); reg(S.cam);
      const cam = S.cam;

      // soft floor light under the phone (studio backdrop)
      el('div', { class: 'a', style: `left:${PCX - 700}px;top:${PCY - 600}px;width:1400px;height:1200px;background:radial-gradient(closest-side, rgba(255,250,235,.045), rgba(255,250,235,0))` }, cam);

      // ---- headlines (left column in 16:9, above the phone in 9:16)
      const HS = pick(108, 100, 92), HX = PAD, HY = pick(H / 2 - HS * 1.05, 230, 290);
      S.HX = HX; S.HY = HY;
      // headlines sit outside the camera, so close-ups on the phone never crop them; in 9:16 a scrim keeps them clean over the phone
      S.scrim = reg(el('div', { class: 'a', style: `width:${W}px;height:${HY + HS * 2 + 90}px;background:linear-gradient(#161615 0%, #161615 ${Math.round(((HY + HS * 2 + 30) / (HY + HS * 2 + 90)) * 100)}%, rgba(22,22,21,0) 100%)` }, root), { o: 0 });
      S.hl = el('div', { class: 'a', style: `width:${W}px;height:${H}px` }, root);
      const head = (a, b, acc) => [line(S.hl, a, { x: HX, y: HY, size: HS }), line(S.hl, b, { x: HX, y: HY + HS * 0.98, size: HS, accent: acc })];
      S.H = {
        hook: head('Give AI', 'real work.', [0, 1]),
        team: head('Meet your', 'teammates.', [0]),
        chat: head('Message Bots', 'like teammates.', [1]),
        night: head('They work while', 'you sleep.', [1]),
        email: head('Nothing ships', 'without your OK.', [2]),
        launch: head('One brief.', 'Four teammates.', [1]),
        computer: head('A computer', 'of their own.', [3]),
      };

      // ---- the hook cluster: six teammates, each its own colour and shape (they fly into the phone's list)
      const CL = pick([[0, 0, 210], [-230, -150, 150], [210, -190, 140], [-260, 150, 130], [230, 120, 160], [0, 250, 120]],
        [[0, 0, 190], [-210, -140, 130], [190, -170, 120], [-230, 140, 115], [210, 110, 140], [0, 230, 110]],
        [[0, 0, 220], [-250, -170, 150], [230, -200, 140], [-250, 190, 135], [240, 160, 160], [0, 300, 120]]);
      S.cluster = ORDER.map((k, i) => {
        const [dx, dy, size] = CL[i];
        const b = bot(cam, k, size, PCX + dx - size / 2, PCY + dy - size / 2);
        reg(b, { o: 0 });   // re-parented above the phone at the end of build()
        return { b, size, cx: PCX + dx, cy: PCY + dy };
      });

      // ---- the phone (titanium rim, glass bezel, Dynamic Island, side keys, soft studio shadow)
      S.phone = el('div', { class: 'a', style: `left:${PCX - PW / 2}px;top:${PCY - PH / 2}px;width:${PW}px;height:${PH}px;transform-origin:50% 50%` }, cam);
      reg(S.phone);
      const ph = S.phone;
      el('div', { class: 'a', style: `left:30px;top:${PH - 40}px;width:${PW - 60}px;height:80px;border-radius:50%;background:rgba(0,0,0,.75);filter:blur(28px)` }, ph);
      [[-3, 170, 46], [-3, 240, 72], [-3, 324, 72], [PW - 1, 260, 104]].forEach(([x, y, h]) =>
        el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:4px;height:${h}px;border-radius:2px;background:linear-gradient(90deg,#2a2a2c,#6a6a6e,#2a2a2c)` }, ph));
      el('div', { class: 'a', style: `width:${PW}px;height:${PH}px;border-radius:72px;background:linear-gradient(140deg,#6b6b70 0%,#2a2a2d 18%,#1b1b1d 50%,#2c2c2f 82%,#77777c 100%);box-shadow:0 70px 120px -30px rgba(0,0,0,.85),0 30px 50px -20px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.12)` }, ph);
      el('div', { class: 'a', style: `left:5px;top:5px;width:${PW - 10}px;height:${PH - 10}px;border-radius:67px;background:#050505;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.05)` }, ph);
      S.screen = el('div', { class: 'a app', style: `left:${INSET}px;top:${INSET}px;width:${SW}px;height:${SH}px;border-radius:56px;overflow:hidden;background:#161615` }, ph);
      const scr = S.screen;

      // ---- view 1: the team list (real rows and copy from the site's app)
      S.vList = el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:#161615` }, scr); reg(S.vList);
      const vl = S.vList;
      el('div', { class: 'a', style: 'left:22px;top:66px;font-size:34px;font-weight:700;letter-spacing:-0.02em' }, vl, 'Teammates');
      el('div', { class: 'pill glass', style: `left:${SW - 66}px;top:66px;width:44px;height:44px;justify-content:center` }, vl, ICON.plus);
      el('div', { class: 'pill', style: `left:18px;top:122px;width:${SW - 36}px;height:44px;padding:0 14px;gap:8px;background:#232323;border:1px solid #303030;font-size:17px;color:#8a8a8a` }, vl, ICON.search + 'Search');
      const ROWS = [
        ['chief', 'Yesterday', 'booked the venue and sent the confirmation around.'],
        ['sales', '1:08 PM', 'Checking what’s connected. Hex, Gmail, and LinkedIn are already signed in.'],
        ['inbox', '10:08 AM', 'sent. inbox at zero, 5 drafts parked for tomorrow.'],
        ['account', '8:08 AM', 'invite’s out to vicky. globex note held in drafts.'],
        ['talent', '5:08 AM', '3 intros drafted in your voice, held for your ok.'],
        ['expense', '9:08 AM', 'report filed. 9 receipts, nothing outstanding.'],
      ];
      S.RY0 = 184; S.RH = 86;
      S.rows = ROWS.map(([k, tm, msg], i) => {
        const r = el('div', { class: 'a', style: `left:10px;top:${S.RY0 + i * S.RH}px;width:${SW - 20}px;height:${S.RH - 6}px;border-radius:20px` }, vl);
        const hl = reg(el('div', { class: 'a', style: `width:${SW - 20}px;height:${S.RH - 6}px;border-radius:20px;background:#2a2a29` }, r), { o: 0 });
        const av = bot(r, k, 54, 12, 12, false);
        const tx = el('div', { class: 'a', style: `left:80px;top:14px;width:${SW - 110}px` }, r,
          `<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:19px;font-weight:600">${BOTS[k].name}</span><span class="mut" style="font-size:15px">${tm}</span></div>
           <div class="mut ell" style="font-size:16px;margin-top:5px">${msg}</div>`);
        return { r: reg(r), hl, av: reg(av, { o: 0 }), tx: reg(tx, { o: 0 }) };
      });

      // ---- view 2: the Sales Outbound chat (matches the site's phone mockup)
      S.vChat = el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:#161615;box-shadow:-30px 0 60px rgba(0,0,0,.5)` }, scr); reg(S.vChat);
      const vc = S.vChat;
      S.threadVp = el('div', { class: 'a', style: `left:0;top:96px;width:${SW}px;height:${SH - 96 - 104}px;overflow:hidden` }, vc);
      S.thread = el('div', { class: 'a', style: `left:0;top:0;width:${SW}px;height:${SH - 96 - 104}px;display:flex;flex-direction:column;justify-content:flex-end;padding:0 18px 10px` }, S.threadVp);
      const slot = (html, align = 'flex-start') => {
        const sl = el('div', { style: 'flex:none;overflow:visible;height:0px;position:relative' }, S.thread);
        const it = el('div', { style: `display:flex;justify-content:${align};padding-top:12px` }, sl, html);
        return { sl: reg(sl), it: reg(it, { o: 0 }) };
      };
      S.m0 = slot('<div class="mut" style="width:100%;text-align:center;font-size:14px">Saturday 1:08 PM</div>');
      S.h0 = slot('<div class="mut" style="width:100%;text-align:center;font-size:14px">Renamed to Sales Outbound</div>');
      S.h1 = slot('<div style="max-width:320px;background:#262626;border-radius:24px;padding:13px 17px;font-size:17px;line-height:1.32">Checking what’s connected. Hex, Gmail, and LinkedIn are already signed in. Salesforce isn’t.</div>');
      S.h2 = slot(`<div style="width:${SW - 36}px;background:#262626;border-radius:24px;padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px;font-weight:600">Computer</b><span style="font-size:13px;color:#4cc79b;background:#4cc79b24;border-radius:999px;padding:2px 9px">Signed in</span></div>
          <div style="font-size:16px;line-height:1.32;margin-top:4px">Sign in to Salesforce so I can see the accounts you own.</div>
          <div style="margin-top:10px;height:74px;border-radius:12px;background:linear-gradient(160deg,#2f3b33,#1d2420 60%,#2a2f3a);position:relative;overflow:hidden"><div style="position:absolute;left:50%;top:12px;width:150px;margin-left:-75px;height:50px;border-radius:8px;background:#111;border:1px solid #333"></div></div>
        </div>`);
      S.m1 = slot('<div style="max-width:300px;background:#01b6c3;color:#06272a;border-radius:24px;padding:13px 17px;font-size:17px;line-height:1.32">work the pipeline overnight: research the accounts, score the contacts, draft email and linkedin in my voice. nothing goes out without me.</div>', 'flex-end');
      S.m2 = slot(`<div style="display:flex;align-items:center;gap:10px;background:#262626;border-radius:18px;padding:11px 15px 11px 11px;font-size:16px"><span style="width:26px;height:26px;border-radius:50%;background:#4cc79b;display:flex;align-items:center;justify-content:center">${CHECK()}</span><b style="font-weight:600">Created routine</b><span class="mut">Overnight outbound batch</span></div>`);
      S.m3 = slot('<div style="max-width:320px;background:#262626;border-radius:24px;padding:13px 17px;font-size:17px;line-height:1.32">overnight batch ready: 36 queued in your voice, 4 skipped as recently touched. nothing sent.</div>');
      S.m4 = slot(`<div style="width:${SW - 36}px;background:#262626;border-radius:26px;padding:14px">
          <div style="border:1px solid #3a3a3a;border-radius:16px;font-size:16px">
            <div style="display:flex;justify-content:space-between;padding:11px 14px;border-bottom:1px solid #3a3a3a"><b style="font-weight:600">New email</b><span data-badge class="mut" style="font-size:14px">Ready to send</span></div>
            <div style="padding:9px 14px;border-bottom:1px solid #3a3a3a"><span class="mut">To</span>&nbsp; dana@northwind.io</div>
            <div style="padding:9px 14px;border-bottom:1px solid #3a3a3a" class="ell"><span class="mut">Subject</span>&nbsp; Three infra roles and a migration</div>
            <div style="padding:11px 14px;line-height:1.36;font-size:16px">Hi Dana,<br><br>Saw Northwind opened three infra roles this month. Usually that means the migration you mentioned in March is finally moving.<br><br>Sam</div>
          </div>
          <div style="display:flex;gap:10px;margin-top:12px;height:44px"><div data-send style="position:relative;width:132px"></div><div style="border:1px solid #444;border-radius:999px;padding:0 18px;display:flex;align-items:center;font-size:17px;color:#ddd">Discard</div></div>
        </div>`);
      // the Send button is its own registered element so it can hover, press and turn into "Sent"
      const sendHost = S.m4.it.querySelector('[data-send]');
      S.sendBtn = reg(el('div', { class: 'pill', style: 'left:0;top:0;width:132px;height:44px;justify-content:center;font-size:17px;font-weight:600;background:#f2f2f2;color:#161615;transform-origin:50% 50%' }, sendHost, 'Send email'));
      S.sentBtn = reg(el('div', { class: 'pill', style: 'left:0;top:0;width:132px;height:44px;justify-content:center;gap:6px;font-size:17px;font-weight:600;background:#4cc79b;color:#161615;transform-origin:50% 50%' }, sendHost, CHECK('#161615', 16) + 'Sent'), { o: 0 });
      S.badge = reg(S.m4.it.querySelector('[data-badge]'));
      S.m5 = slot('<div style="max-width:280px;background:#01b6c3;color:#06272a;border-radius:24px;padding:13px 17px;font-size:17px;line-height:1.32">send the top 10 emails, they look good</div>', 'flex-end');
      S.m6 = slot('<div style="background:#262626;border-radius:24px;padding:13px 17px;font-size:17px">top 10 sending. rest stay queued.</div>');
      S.MSG = [S.m0, S.h0, S.h1, S.h2, S.m1, S.m2, S.m3, S.m4, S.m5, S.m6];
      // chat header: glass back button, name pill, computer button (the site's layout)
      el('div', { class: 'a', style: `width:${SW}px;height:110px;background:linear-gradient(#161615 70%, rgba(22,22,21,0))` }, vc);
      el('div', { class: 'pill glass', style: 'left:16px;top:52px;width:46px;height:46px;justify-content:center' }, vc, ICON.back);
      const hp = el('div', { class: 'pill glass', style: 'left:74px;top:52px;height:46px;padding:0 18px 0 6px;gap:8px;font-size:18px;font-weight:600' }, vc);
      bot(hp, 'sales', 34, 0, 0, false).style.position = 'relative';
      hp.appendChild(document.createTextNode('Sales Outbound'));
      S.deskBtn = reg(el('div', { class: 'pill glass', style: `left:${SW - 62}px;top:52px;width:46px;height:46px;justify-content:center;transform-origin:50% 50%` }, vc, ICON.desk));
      // composer: + button, field (types), mic that turns into a send button when there is text
      const cy = SH - 96;
      el('div', { class: 'pill glass', style: `left:14px;top:${cy}px;width:52px;height:52px;justify-content:center` }, vc, ICON.plus);
      S.field = reg(el('div', { class: 'pill', style: `left:74px;top:${cy}px;width:${SW - 88}px;height:52px;padding:0 60px 0 20px;border:1px solid #3a3a3a;background:#1d1d1d;font-size:17px;overflow:hidden` }, vc));
      S.ph = reg(el('span', { class: 'mut' }, S.field, 'Message Sales…'));
      S.ftext = reg(el('span', { style: 'white-space:nowrap' }, S.field, ''));
      S.caret = reg(el('span', { style: 'display:inline-block;width:2px;height:22px;background:#01b6c3;margin-left:1px' }, S.field), { o: 0 });
      S.mic = reg(el('div', { class: 'pill', style: `left:${SW - 58}px;top:${cy + 8}px;width:36px;height:36px;justify-content:center;background:#2c2c2c` }, vc, ICON.mic));
      S.sendC = reg(el('div', { class: 'pill', style: `left:${SW - 58}px;top:${cy + 8}px;width:36px;height:36px;justify-content:center;background:#f2f2f2;transform-origin:50% 50%` }, vc, ICON.send), { o: 0 });

      // ---- view 3: the Launch team group chat
      S.vGroup = el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:#161615;box-shadow:-30px 0 60px rgba(0,0,0,.5)` }, scr); reg(S.vGroup);
      const vg = S.vGroup;
      el('div', { class: 'pill glass', style: 'left:16px;top:52px;width:46px;height:46px;justify-content:center' }, vg, ICON.back);
      const gp = el('div', { class: 'pill glass', style: 'left:74px;top:52px;height:46px;padding:0 18px 0 10px;gap:10px;font-size:18px;font-weight:600' }, vg);
      const stack = el('div', { style: 'position:relative;width:86px;height:30px' }, gp);
      ['inbox', 'account', 'talent', 'chief'].forEach((k, i) => bot(stack, k, 30, i * 18, 0, false));
      gp.appendChild(document.createTextNode('Launch team'));
      el('div', { class: 'mut', style: 'position:absolute;left:0;top:128px;width:100%;text-align:center;font-size:14px' }, vg, 'One brief. Four teammates.');
      S.gCard = reg(el('div', { class: 'a', style: `left:18px;top:160px;width:${SW - 36}px;height:${4 * 72 + 64}px;background:#262626;border-radius:26px` }, vg), { o: 0 });
      el('div', { class: 'a', style: 'left:18px;top:16px;font-size:17px;font-weight:600' }, S.gCard, 'Launch brief');
      const STEPS = [['talent', 'Research gathered'], ['inbox', 'Brief drafted'], ['account', 'Details checked'], ['chief', 'Ready for your review']];
      S.steps = STEPS.map(([k, s], i) => {
        const r = el('div', { class: 'a', style: `left:0;top:${56 + i * 72}px;width:${SW - 36}px;height:72px` }, S.gCard);
        if (i) el('div', { class: 'a', style: `left:70px;top:0;width:${SW - 124}px;height:1px;background:#353535` }, r);
        bot(r, k, 40, 16, 14, false);
        const off = reg(el('div', { class: 'a mut', style: 'left:70px;top:24px;font-size:17px' }, r, s));
        const on = reg(el('div', { class: 'a', style: 'left:70px;top:24px;font-size:17px' }, r, s), { o: 0 });
        el('div', { class: 'a', style: `left:${SW - 36 - 50}px;top:22px;width:28px;height:28px;border-radius:50%;border:2px solid #444` }, r);
        const ck = reg(el('div', { class: 'pill', style: `left:${SW - 36 - 50}px;top:22px;width:28px;height:28px;justify-content:center;background:#4cc79b;transform-origin:50% 50%` }, r, CHECK()), { o: 0 });
        return { off, on, ck };
      });
      el('div', { class: 'pill glass', style: `left:14px;top:${SH - 96}px;width:52px;height:52px;justify-content:center` }, vg, ICON.plus);
      el('div', { class: 'pill', style: `left:74px;top:${SH - 96}px;width:${SW - 88}px;height:52px;padding:0 20px;border:1px solid #3a3a3a;background:#1d1d1d;font-size:17px;color:#9a9a9a` }, vg, 'Message Launch team…');
      S.working = el('div', { class: 'a', style: `left:18px;top:${160 + 4 * 72 + 64 + 16}px;display:flex;align-items:center;gap:12px;background:#262626;border-radius:22px;padding:10px 18px 10px 12px;font-size:17px;transform-origin:0 50%` }, vg);
      const ws = el('div', { style: 'position:relative;width:96px;height:34px' }, S.working);
      ['talent', 'inbox', 'account', 'chief'].forEach((k, i) => bot(ws, k, 34, i * 20, 0, false));
      S.working.appendChild(el('span', { class: 'mut' }, null, 'Working on the brief'));
      S.wdots = reg(el('span', { class: 'mut', style: 'width:24px' }, S.working, '…'));
      reg(S.working, { o: 0 });
      S.ready = reg(el('div', { class: 'a', style: `left:18px;top:${160 + 4 * 72 + 64 + 16}px;display:flex;align-items:center;gap:12px;background:#262626;border-radius:22px;padding:12px 18px 12px 12px;font-size:17px;transform-origin:0 50%` }, vg,
        `<span style="width:30px;height:30px;border-radius:9px;background:#3a3a3a;display:flex;align-items:center;justify-content:center">${ICON.doc}</span><b style="font-weight:600">Your launch brief is ready</b>`), { o: 0 });

      // ---- the computer sheet (opens from the header's computer button)
      S.dim = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:#000` }, scr), { o: 0 });
      S.sheet = el('div', { class: 'a', style: `left:0;top:${SH * 0.12}px;width:${SW}px;height:${SH * 0.92}px;background:#1e1e1e;border-radius:34px 34px 0 0;box-shadow:0 -10px 40px rgba(0,0,0,.5)` }, scr);
      reg(S.sheet, { o: 0 });
      const sh = S.sheet;
      el('div', { class: 'a', style: `left:${SW / 2 - 22}px;top:9px;width:44px;height:5px;border-radius:3px;background:#555` }, sh);
      el('div', { class: 'a', style: 'left:22px;top:30px;font-size:22px;font-weight:700' }, sh, 'Computer');
      S.work = el('div', { class: 'pill', style: `left:${SW - 132}px;top:28px;height:32px;padding:0 14px;gap:8px;background:#2c2c2c;font-size:15px` }, sh, '<span style="width:9px;height:9px;border-radius:50%;background:#4cc79b"></span>Working');
      S.pulse = reg(S.work.firstChild);
      const bw = el('div', { class: 'a', style: `left:16px;top:78px;width:${SW - 32}px;height:${SH * 0.92 - 110}px;border-radius:18px;background:#121212;border:1px solid #333;overflow:hidden` }, sh);
      el('div', { class: 'a', style: `width:${SW - 32}px;height:40px;background:#232323;border-bottom:1px solid #333` }, bw,
        `<div style="position:absolute;left:14px;top:15px;display:flex;gap:6px"><i style="width:9px;height:9px;border-radius:50%;background:#4a4a4a"></i><i style="width:9px;height:9px;border-radius:50%;background:#4a4a4a"></i><i style="width:9px;height:9px;border-radius:50%;background:#4a4a4a"></i></div>
         <div class="mut" style="position:absolute;left:62px;top:8px;width:${SW - 120}px;height:24px;border-radius:7px;background:#161616;font-size:13px;line-height:24px;text-align:center">Studio · Weekly overview</div>`);
      el('div', { class: 'a', style: 'left:16px;top:58px;font-size:24px;font-weight:700' }, bw, 'Friday recap');
      el('div', { class: 'a mut', style: 'left:16px;top:90px;font-size:15px' }, bw, 'This week');
      S.stats = [['Visitors', 2840, ''], ['Signups', 186, ''], ['Activation', 72, '%']].map(([k, v, u], i) => {
        const tl = el('div', { class: 'a', style: `left:16px;top:${124 + i * 104}px;width:${SW - 64}px;height:92px;border-radius:16px;background:#1d1d1d;border:1px solid #2e2e2e;transform-origin:50% 50%` }, bw);
        el('div', { class: 'a mut', style: 'left:16px;top:14px;font-size:15px' }, tl, k);
        const val = reg(el('div', { class: 'a', style: "left:16px;top:36px;font-size:36px;font-weight:700;font-family:'Display';letter-spacing:-0.02em" }, tl, '0'));
        const bar = reg(el('div', { class: 'a', style: `left:${SW - 64 - 120}px;top:40px;width:100px;height:36px;display:flex;align-items:flex-end;gap:5px;transform-origin:50% 100%` }, tl,
          [0.4, 0.55, 0.5, 0.7, 0.65, 0.85, 1].map((h) => `<i style="flex:1;height:${h * 100}%;border-radius:3px;background:${i === 2 ? '#4cc79b' : '#3d3d3d'}"></i>`).join('')));
        return { tl: reg(tl, { o: 0 }), val, v, u, bar };
      });
      S.memo = reg(el('div', { class: 'a', style: `left:16px;top:${124 + 3 * 104 + 6}px;width:${SW - 64}px;border-radius:16px;background:#1d1d1d;border:1px solid #2e2e2e;padding:12px 14px;font-size:15px;line-height:1.35` }, bw,
        '<span class="mut">Remembered</span>&nbsp; Keep launch updates short. Lead with what shipped, then what’s next.'), { o: 0 });

      // status bar (above the views)
      S.clock = reg(el('div', { class: 'a', style: 'left:40px;top:17px;font-size:17px;font-weight:600;width:60px;text-align:center' }, scr, '1:08'));
      el('div', { class: 'a', style: `left:${SW - 104}px;top:21px` }, scr, ICON.status);

      // ---- Dynamic Island: grows into a live banner at night
      S.island = el('div', { class: 'a', style: `left:${SW / 2 - 62}px;top:11px;width:124px;height:36px;border-radius:20px;background:#000;overflow:hidden` }, scr);
      reg(S.island);
      S.iContent = reg(el('div', { class: 'a', style: 'left:14px;top:14px;width:352px' }, S.island,
        `<div style="display:flex;gap:12px;align-items:center"><div data-av style="position:relative;width:44px;height:44px;flex:none"></div><div style="min-width:0;flex:1"><div style="display:flex;justify-content:space-between;font-size:16px"><b style="font-weight:600">Sales Outbound</b><span class="mut">12:16</span></div><div style="font-size:17px;line-height:1.3;margin-top:3px">overnight batch ready: 36 queued in your voice. nothing sent.</div></div></div>`), { o: 0 });
      bot(S.iContent.querySelector('[data-av]'), 'sales', 44, 0, 0, false);
      // glass reflection over the whole screen
      el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;border-radius:56px;background:linear-gradient(118deg, rgba(255,255,255,.075) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,.03) 100%)` }, scr);

      S.cluster.forEach((c) => cam.appendChild(c.b));

      // ---- the touch cursor (press shrinks it, every tap leaves a ripple)
      S.cur = reg(el('div', { class: 'a', style: 'width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,255,255,.26);border:2px solid rgba(255,255,255,.85);box-shadow:0 6px 18px rgba(0,0,0,.45);transform-origin:50% 50%' }, cam), { o: 0 });
      S.rip = reg(el('div', { class: 'a', style: 'width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:3px solid rgba(255,255,255,.9);transform-origin:50% 50%' }, cam), { o: 0 });
    },

    run(t, b, S) {
      // ---- headlines: each line leaves just before the next one lands (sequential swaps, no double exposure)
      const HL = [['hook', 0, 4.25], ['team', 'team', 7.8], ['chat', 'chat', 11.8], ['night', 'night', 15.8], ['email', 'email', 23.8], ['launch', 'launch', 27.8], ['computer', 'computer', 32.1]];
      HL.forEach(([k, a, out]) => {
        const [l1, l2] = S.H[k];
        if (k === 'hook') { rise(t, l1, [-0.9, 'w2'], out); rise(t, l2, ['w3', 'w4'], out); return; }
        rise(t, l1, beatOf(a) - 0.12, out, { stagger: 0.06 });
        rise(t, l2, beatOf(a) + 0.23, out, { stagger: 0.06 });
      });

      // ---- phone
      const p = pose(t);
      put(S.phone, { x: p.x, y: p.y, r: p.r, s: p.s, o: b < beatOf('phone_in') - 0.2 || sp(t, 'mascot', 'playful') > 0.75 ? 0 : 1 });

      // ---- hook cluster: pops in on the beats, floats, then each bot flies into its row's avatar
      const POP = ['hook', 'bot2', 'bot3', 'bot4', 'bot5', 'bot6'];
      const land = (i) => b >= beatOf('team') || sp(t, beatOf('fly') + i * 0.12, 'default') > 0.985;
      S.cluster.forEach((c, i) => {
        const pin = i === 0 ? spHit(t, -0.3, 'playful') : spHit(t, POP[i], 'playful');
        const f = sp(t, beatOf('fly') + i * 0.12, 'default');
        const [ax, ay] = P(t, 10 + 12 + 27, S.RY0 + i * S.RH + 12 + 27);       // the row avatar's centre
        const target = (54 * pose(t).s) / c.size;
        const bob = 10 * drift(t * 0.9 + i * 7) * (1 - f);
        put(c.b, { o: land(i) || pin < 0.002 ? 0 : 1, s: lerp(0.4 + 0.6 * pin, target, f), x: (ax - c.cx) * f, y: (ay - c.cy) * f + bob, r: 6 * drift2(t * 0.6 + i) * (1 - f) });
      });

      // ---- list: avatars take over from the flying bots, text slides in after them; hover + press on Sales Outbound
      S.rows.forEach((R, i) => {
        put(R.av, { o: land(i) ? 1 : 0 });
        const q = spHit(t, beatOf('rows') + i * 0.12, 'default');
        put(R.tx, { o: clamp(q * 6), x: 18 * (1 - q) });
      });
      const hov = sp(t, 'hover1', 'snappy'), prs = sp(t, beatOf('tap1') - 0.06, 'snappy') - sp(t, beatOf('tap1') + 0.18, 'snappy');
      put(S.rows[1].hl, { o: clamp(hov) });
      put(S.rows[1].r, { s: 1 - 0.025 * prs });

      // ---- navigation pushes (iOS-style: incoming from the right, outgoing parallaxes left)
      const n1 = sp(t, 'nav1', 'default'), n2 = sp(t, 'nav2', 'default');
      put(S.vList, { x: -SW * 0.3 * n1, hide: n1 > 0.999 });
      put(S.vChat, { x: SW * (1 - n1) - SW * 0.3 * n2, hide: n1 < 0.001 || n2 > 0.999 });
      put(S.vGroup, { x: SW * (1 - n2), hide: n2 < 0.001 });

      // ---- chat: messages arrive at the bottom and push the thread up (each slot's height springs open)
      const ARR = [null, null, null, null, ['msg1', 'default'], ['chip', 'snappy'], ['msg2', 'default'], ['card', 'default'], ['msg3', 'default'], ['msg4', 'default']];
      S.MSG.forEach((M, i) => {
        const a = ARR[i] ? spHit(t, beatOf(ARR[i][0]) - (ARR[i][1] === 'snappy' ? 0.16 : 0), ARR[i][1]) : 1;
        const h = M.it.offsetHeight;
        put(M.sl, { css: { height: (h * clamp(a, 0, 1.02)).toFixed(2) + 'px' } });
        put(M.it, { o: clamp(a * 5), y: 26 * (1 - a), s: 0.96 + 0.04 * a, css: { transformOrigin: i === 4 || i === 8 ? '100% 100%' : '0 100%' } });
      });
      // composer: tap → caret, typing, the mic morphs into a send button, tap send → the text leaves as the bubble
      const typing = b >= beatOf('tap2') && b < beatOf('tap3');
      const BRIEF = 'work the pipeline overnight: research the accounts, score the contacts, draft email and linkedin in my voice. nothing goes out without me.';
      const n = typing ? Math.floor(seg(t, 'type0', 'type1') * BRIEF.length) : 0;
      put(S.ftext, { text: BRIEF.slice(Math.max(0, n - 24), n) });
      put(S.ph, { hide: n > 0 || typing });
      put(S.caret, { o: typing && (n < BRIEF.length || Math.floor(b * 2) % 2 === 0) ? 1 : 0 });
      put(S.field, { css: { borderColor: typing ? '#01b6c3' : '#3a3a3a' } });
      const sc = sp(t, 'type0', 'snappy') - sp(t, beatOf('tap3') + 0.1, 'snappy');
      const sprs = sp(t, beatOf('tap3') - 0.06, 'snappy') - sp(t, beatOf('tap3') + 0.16, 'snappy');
      put(S.sendC, { o: clamp(sc * 4), s: (0.6 + 0.4 * sc) * (1 - 0.12 * sprs), r: -90 * (1 - sc) });
      put(S.mic, { o: clamp(1 - sc * 4) });
      // email card: hover brightens Send, press squashes it, then it becomes "Sent"
      const eh = sp(t, 'hover2', 'snappy'), ep = sp(t, beatOf('tap4') - 0.06, 'snappy') - sp(t, beatOf('tap4') + 0.18, 'snappy');
      const sent = sp(t, beatOf('tap4') - 0.12, 'snappy');
      put(S.sendBtn, { o: sent > 0.5 ? 0 : 1, s: 1 + 0.04 * eh - 0.08 * ep, css: { background: eh > 0.5 ? '#ffffff' : '#f2f2f2', boxShadow: `0 0 0 ${(4 * eh).toFixed(1)}px rgba(255,255,255,.18)` } });
      put(S.sentBtn, { o: sent > 0.5 ? 1 : 0, s: 0.9 + 0.1 * sent });
      put(S.badge, { text: sent > 0.5 ? 'Sent' : 'Ready to send', css: { color: sent > 0.5 ? '#4cc79b' : '#9a9a9a' } });

      // ---- clock and Dynamic Island banner (morph first, content after; content leaves before it collapses)
      put(S.clock, { text: b >= beatOf('night') - 0.25 && b < beatOf('email') ? '12:16' : b >= beatOf('email') ? '8:02' : '1:08' });
      const isl = sp(t, beatOf('island') - 0.15, 'default') - sp(t, 'island_out', 'default');
      put(S.island, { x: -(384 - 124) / 2 * isl, css: { width: (124 + (384 - 124) * isl).toFixed(2) + 'px', height: (36 + (100 - 36) * isl).toFixed(2) + 'px', borderRadius: (20 + 14 * isl).toFixed(2) + 'px' } });
      put(S.iContent, { o: Motion.swapAlpha(t, bt('island'), bt('island_out') - 0.18) });

      // ---- launch team: checks tick one per beat, then the brief is ready
      const gc = spHit(t, beatOf('nav2') + 0.3, 'default');
      put(S.gCard, { o: clamp(gc * 6), y: 30 * (1 - gc) });
      S.steps.forEach((st, i) => {
        const q = sp(t, beatOf(`chk${i + 1}`) - 0.08, 'snappy');
        put(st.ck, { o: q > 0.02 ? 1 : 0, s: 0.4 + 0.6 * q });
        put(st.on, { o: q > 0.5 ? 1 : 0 }); put(st.off, { o: q > 0.5 ? 0 : 1 });
      });
      const wk = sp(t, beatOf('nav2') + 0.5, 'snappy');
      put(S.working, { o: wk > 0.01 && b < beatOf('ready') - 0.05 ? 1 : 0, s: 0.86 + 0.14 * wk });
      put(S.wdots, { text: ['.', '..', '…'][Math.floor(b * 2) % 3] });
      const rd = spHit(t, 'ready', 'snappy');
      put(S.ready, { o: clamp(rd * 6), s: 0.86 + 0.14 * rd });

      // ---- computer sheet: the header button presses, the sheet slides up over a dimmed chat
      const dp = sp(t, beatOf('tap5') - 0.06, 'snappy') - sp(t, beatOf('tap5') + 0.18, 'snappy');
      put(S.deskBtn, { s: 1 - 0.12 * dp });
      const shp = sp(t, 'sheet', 'default');
      put(S.sheet, { o: shp > 0.001 ? 1 : 0, y: SH * (1 - shp) });
      put(S.dim, { o: 0.45 * clamp(shp) });
      put(S.pulse, { o: 0.4 + 0.6 * (0.5 + 0.5 * Math.cos((t - bt('sheet')) * Math.PI * 4)) });
      S.stats.forEach((T, i) => {
        const q = spHit(t, `stat${i + 1}`, 'snappy');
        put(T.tl, { o: clamp(q * 6), s: 0.92 + 0.08 * q });
        const k = ease.out(seg(t, `stat${i + 1}`, beatOf(`stat${i + 1}`) + 1.25));
        put(T.val, { text: Math.round(T.v * k).toLocaleString('en-US') + T.u });
        put(T.bar, { sy: 0.2 + 0.8 * k });
      });
      const mm = spHit(t, 'note', 'default');
      put(S.memo, { o: clamp(mm * 6), y: 16 * (1 - mm) });

      // ---- the cursor travels between live points on the floating phone: superposed springs, one per move
      const at = (sx, sy) => (tt) => P(tt, sx, sy);
      const KEYS = [
        [0, at(SW * 0.8, SH * 0.82)], ['cur1', at(SW / 2, S.RY0 + S.RH + 40)], [beatOf('tap1') + 1.0, at(150, SH - 70)],
        [beatOf('tap3') - 0.1, at(SW - 40, SH - 70)], [beatOf('tap3') + 1.0, at(SW * 0.75, SH * 0.62)],
        ['cur2', at(98, SH - 150)], [beatOf('tap4') + 1.0, at(SW * 0.72, SH * 0.5)], ['cur3', at(SW - 39, 75)],
      ];
      let [cx, cy] = KEYS[0][1](t);
      for (let i = 1; i < KEYS.length; i++) {
        const [x0, y0] = KEYS[i - 1][1](t), [x1, y1] = KEYS[i][1](t);
        const k = sp(t, beatOf(KEYS[i][0]) - 0.55, 'default');
        cx += (x1 - x0) * k; cy += (y1 - y0) * k;
      }
      const vis = [['cur1', 0.3, 'tap1'], ['tap2', -0.3, 'tap2'], ['tap3', -0.25, 'tap3'], ['cur2', 0.35, 'tap4'], ['cur3', 0.35, 'tap5']]
        .reduce((a, [s0, d, s1]) => a + C.win(t, beatOf(s0) + d, beatOf(s1) + 0.1), 0);
      let press = 0, ring = -1;
      ['tap1', 'tap2', 'tap3', 'tap4', 'tap5'].forEach((tp) => {
        press += sp(t, beatOf(tp) - 0.2, 'snappy') - sp(t, beatOf(tp) + 0.08, 'snappy');
        const d = t - bt(tp) + 0.07;
        if (d >= 0 && d < 0.42) ring = d / 0.42;
      });
      put(S.cur, { o: vis > 0.03 ? 1 : 0, x: cx, y: cy, s: clamp(vis) * (1 - 0.22 * press) });
      put(S.rip, { o: ring < 0 ? 0 : 0.8 * (1 - ring), x: cx, y: cy, s: 0.6 + 2.2 * ease.out(Math.max(0, ring)) });

      // ---- camera: slow push across the film, punch-ins on the moments that must be read
      const PU = pick(1.65, 1.5, 1.3);
      const CU = [[4.9, 7.45], [8.45, 15.55], [16.4, 23.4], [24.4, 31.55]];   // four close-ups; headlines live outside the camera
      const zk = [[0, 1], ...CU.flatMap(([a, o]) => [[a, PU], [o, 1]])];
      if (TALL) zk.push([beatOf('night') - 0.4, 1.1], [beatOf('msg2') - 0.6, PU]);
      const z = trk(t, zk.sort((p, q) => beatOf(p[0]) - beatOf(q[0])));
      const fyS = trk(t, [[0, SH * 0.45], [beatOf('chat') - 0.4, pick(SH - 150, SH - 150, SH * 0.66)], [beatOf('night') - 0.4, pick(130, 130, 11)], [beatOf('msg2') - 0.6, pick(SH - 260, SH - 260, SH * 0.6)],
        [beatOf('email') - 0.4, SH - 300], [beatOf('msg3') - 0.6, SH - 170], [beatOf('launch') - 0.4, 320], [beatOf('computer') - 0.4, SH * 0.42]]);
      const zz = z * (1 + 0.025 * seg(t, 'hook', 'end'));
      const [fx, fy] = P(t, SW / 2, fyS);
      const k = clamp((z - 1) / (PU - 1));
      const ov = TALL ? trk(t, [[0, 0], [beatOf('night') - 0.4, 1], [beatOf('msg2') - 0.6, 0]]) : 0;
      const dx = lerp(fx, pick(1400, W * 0.62, W / 2), k), dy = lerp(fy, lerp(H * pick(0.22 + 0.56 * fyS / SH, 0.25 + 0.5 * fyS / SH, 0.38 + 0.26 * fyS / SH), S.HY + 92 * 2 + 40, ov), k);   // reading the top of the screen sits high, the composer sits low
      put(S.scrim, { o: TALL ? clamp(k * 1.4) : 0 });
      put(S.cam, { s: zz, x: dx - W / 2 - zz * (fx - W / 2), y: dy - H / 2 - zz * (fy - H / 2) });
    },
  });

  // ================================================================ end card: the phone collapses into the mascot
  scene({
    name: 'end', from: 'end', to: 'done', cut: false,
    build(root, S) {
      S.m = mascot(root, MS, MCX - MS / 2, MCY - MS / 2);
      const wsize = pick(260, 210, 230), wy = pick(300, 280, MCY + MS / 2 + 90);
      S.word = line(root, 'Krafty', { x: PAD, y: wy, size: wsize });
      const sy = wy + wsize * 1.12;
      const sub = TALL ? ['Start free and give it', 'something real to do.'] : ['Start free and give it', 'something real to do.'];
      S.sub = sub.map((s, i) => line(root, s, { x: PAD, y: sy + i * 64, size: pick(52, 44, 54), cls: 'ui', color: 'var(--ink-2)' }));
      S.url = line(root, 'kraftybot.app', { x: PAD, y: sy + sub.length * 64 + 28, size: pick(96, 80, 96), accent: [0] });
      // the six teammates orbit the mascot (the hook's cluster, reassembled)
      const O = pick([[-330, -230, 120], [310, -250, 110], [-370, 150, 110], [340, 170, 125], [-150, 330, 100], [150, 340, 105]],
        [[-280, -200, 100], [270, -210, 95], [-310, 130, 95], [290, 140, 105], [-130, 280, 85], [130, 290, 90]],
        [[-340, -230, 100], [340, -250, 95], [-380, 30, 90], [370, 20, 100], [-300, 230, 85], [300, 225, 90]]);
      S.orbit = ORDER.map((k, i) => { const [ox, oy, sz] = O[i]; return { b: reg(bot(root, k, sz, MCX + ox - sz / 2, MCY + oy - sz / 2), { o: 0 }), i }; });
    },
    run(t, b, S) {
      const p = spHit(t, 'mascot', 'playful');
      put(S.m.el, { o: p > 0.002 ? 1 : 0, s: pick(0.7, 0.7, 0.8) + pick(0.3, 0.3, 0.2) * p, y: 8 * drift(t * 0.7 + 20) });
      blink(t, S.m, [36, 38.6]);
      rise(t, S.word, 'wordmark', null, { stagger: 0.04 });
      S.sub.forEach((L, i) => rise(t, L, beatOf('cta') - 0.26 + i * 0.25, null, { stagger: 0.03, preset: 'default' }));
      rise(t, S.url, beatOf('url') - 0.12, null, { preset: 'default' });
      S.orbit.forEach(({ b: e, i }) => {
        const q = spHit(t, beatOf('line0') + i * 0.25, 'playful');
        put(e, { o: q > 0.002 ? 1 : 0, s: 0.4 + 0.6 * q, y: 8 * drift2(t * 0.8 + i * 3), x: 6 * drift3(t * 0.6 + i * 5) });
      });
      put(S.root, { s: 1 + 0.045 * seg(t, 'end', 'done') });
    },
  });

  C.start();
})();
