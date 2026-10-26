// Krafty Bot — "Real work", v3. 25 s, 16:9 + 9:16.
// One continuous phone carries the whole story. The screens are rebuilt element by element from drew's screen
// recording of the real Krafty app (home, + menu, new-teammate setup chat, tool cards, approve-and-send, saved file):
// same layout, copy, colours (bg #1a1a1a, bubbles #242424, user #7f42ef) and bot shapes/colours, sampled from the video.
// Bots get a 3D treatment (gradient body, specular, inner shade, contact shadow) on top of the app's flat shapes.
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
  const PURPLE = '#7f42ef', BG = '#1a1a1a', BUB = '#242424', GREEN = '#4cc79b';

  document.head.appendChild(el('style', {}, null, `
    .ui { font-family: 'Display', Arial, sans-serif; letter-spacing: -0.01em; }
    .app { font-family: system-ui, -apple-system, sans-serif; color: #f2f2f2; letter-spacing: -0.01em; -webkit-font-smoothing: antialiased; }
    .app * { box-sizing: border-box; }
    .a { position: absolute; left: 0; top: 0; }
    .mut { color: #9a9a9a; }
    .pill { position: absolute; border-radius: 999px; display: flex; align-items: center; white-space: nowrap; }
    .ell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .circ { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #262626; border: 1px solid #333; }
    .bub { background: ${BUB}; border-radius: 22px; padding: 11px 15px; font-size: 16px; line-height: 1.34; }
    .ubub { background: ${PURPLE}; color: #fff; border-radius: 22px; padding: 11px 15px; font-size: 16px; line-height: 1.34; font-weight: 500; }
    .cardx { background: ${BUB}; border-radius: 20px; padding: 13px 14px; font-size: 15px; }
    .opt { display: inline-flex; border: 1px solid #3a3a3a; border-radius: 999px; padding: 7px 13px; font-size: 15px; font-weight: 600; margin-top: 7px; }
    .key { position: absolute; border-radius: 6px; background: #6b6b6f; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 19px; box-shadow: 0 1px 0 rgba(0,0,0,.4); }
  `));

  // ------------------------------------------------------------------ bots: the app's own shapes and colours, shaded
  const BOTS = {
    atlas:    { name: 'Atlas', c: '#ff7d18', shape: 'bean' },
    commish:  { name: 'Commish', c: '#2ebd63', shape: 'tri' },
    mailmate: { name: 'Mailmate', c: '#1e1e1e', shape: 'hex', eye: '#f2f2f2' },
    ops:      { name: 'Ops Assistant', c: '#d3ef7d', shape: 'ghost' },
    dex:      { name: 'Dex', c: '#9a9a9a', shape: 'bean2' },
    analyst:  { name: 'Analyst', c: '#ff2340', shape: 'round' },
    planner:  { name: 'Planner', c: '#1c7dfe', shape: 'round2' },
    operator: { name: 'Operator', c: '#8849fe', shape: 'drop' },
  };
  const FLY = ['atlas', 'commish', 'ops', 'analyst', 'planner', 'operator'];
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  // shapes traced from the recording's avatars (100 × 100 box)
  const SHAPES = {
    bean: '<path d="M44 6c24-3 46 14 46 40 0 30-18 50-44 50C22 96 8 84 8 64c0-12 8-19 8-30C16 17 26 8 44 6z"/>',
    bean2: '<path d="M46 6c24 0 44 16 44 42 0 28-18 46-42 46-24 0-40-14-40-36 0-12 6-18 6-28C14 14 28 6 46 6z"/>',
    tri: '<path d="M50 5c6 0 10 3 13 8l34 62c5 9-1 20-12 20H15C4 95-2 84 3 75L37 13c3-5 7-8 13-8z"/>',
    hex: '<path d="M36 5h28c4 0 7 2 9 5l18 24c2 3 2 6 2 9v18c0 3 0 6-2 9L73 94c-2 3-5 5-9 5H36c-4 0-7-2-9-5L9 70c-2-3-2-6-2-9V43c0-3 0-6 2-9L27 10c2-3 5-5 9-5z"/>',
    ghost: '<path d="M16 46C16 22 31 6 50 6s34 16 34 40v44c0 4-3 6-6 6H22c-3 0-6-2-6-6z"/>',
    round: '<path d="M50 7c25 0 43 17 43 42S75 94 50 94 7 76 7 50 25 7 50 7z"/>',
    round2: '<path d="M54 6c22 2 40 20 38 44-2 26-22 44-46 42C22 90 6 72 8 48 10 22 30 4 54 6z"/>',
    drop: '<path d="M64 4c4 16 28 30 28 58 0 22-18 36-42 36S8 84 8 62C8 34 44 24 64 4z"/>',
  };
  let BOTN = 0;
  function bot(parent, key, size, x = 0, y = 0, shadow = true) {
    const B = BOTS[key], id = 'b' + (BOTN++), s = SHAPES[B.shape];
    const dark = B.c === '#1e1e1e';
    const eyeY = B.shape === 'tri' ? 44 : B.shape === 'ghost' ? 24 : 26;
    const svg = `<svg width="${size}" height="${size * 1.14}" viewBox="0 0 100 114" style="overflow:visible;display:block">
      <defs>
        <radialGradient id="${id}g" cx="34%" cy="26%" r="85%"><stop offset="0" stop-color="${shade(B.c, dark ? 0.22 : 0.4)}"/><stop offset=".45" stop-color="${B.c}"/><stop offset="1" stop-color="${shade(B.c, -0.45)}"/></radialGradient>
        <radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.35 : 0.8}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter>
        <filter id="${id}s" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
        <clipPath id="${id}c">${s}</clipPath>
      </defs>
      ${shadow ? `<ellipse cx="52" cy="106" rx="33" ry="5.5" fill="#000" opacity=".5" filter="url(#${id}s)"/>` : ''}
      <g fill="url(#${id}g)" ${dark ? 'stroke="#3a3a3a" stroke-width="1.5"' : ''}>${s}</g>
      <g clip-path="url(#${id}c)">
        <ellipse cx="80" cy="88" rx="46" ry="40" fill="#000" opacity=".26" filter="url(#${id}b)"/>
        <g fill="none" stroke="#fff" stroke-opacity="${dark ? 0.18 : 0.28}" stroke-width="3" transform="translate(1.6 1.6)">${s}</g>
        <ellipse cx="33" cy="25" rx="17" ry="10" fill="url(#${id}h)" transform="rotate(-28 33 25)"/>
      </g>
      <g fill="${B.eye || '#161615'}"><rect x="54" y="${eyeY}" width="9" height="19" rx="4.5" transform="rotate(-22 58 ${eyeY + 9})"/><rect x="70" y="${eyeY}" width="9" height="19" rx="4.5" transform="rotate(-22 74 ${eyeY + 9})"/></g>
    </svg>`;
    return reg(el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform-origin:50% 50%` }, parent, svg));
  }
  const inlineBot = (parent, key, size) => { const h = el('span', { style: `position:relative;display:inline-block;width:${size}px;height:${size}px;flex:none` }, parent); bot(h, key, size, 0, 0, false); return h; };

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
    back: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#ddd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    more: '<svg width="18" height="18" viewBox="0 0 24 24"><g fill="#ddd"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/></g></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#ddd" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0" fill="#ddd"/></svg>',
    people: '<svg width="17" height="17" viewBox="0 0 24 24"><g fill="#ddd"><circle cx="9" cy="9" r="3.2"/><circle cx="16" cy="9.5" r="2.6"/><path d="M3 18c0-3 3-5 6-5s6 2 6 5zM14 18c0-2 1-3.5 3-4 2.5 0 4 1.6 4 4z"/></g></svg>',
    wave: '<svg width="20" height="18" viewBox="0 0 24 20"><g stroke="#bbb" stroke-width="2" stroke-linecap="round"><path d="M3 8v4M7 5v10M11 2v16M15 5v10M19 7v6"/></g></svg>',
    up: (c) => `<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    stop: '<span style="width:11px;height:11px;border-radius:2px;background:#161615"></span>',
    mail: '<svg width="14" height="14" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#9a9a9a" stroke-width="2"/><path d="M3 7l9 6 9-6" fill="none" stroke="#9a9a9a" stroke-width="2"/></svg>',
    x: '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="#9a9a9a" stroke-width="2.4" stroke-linecap="round"/></svg>',
    status: '<svg width="70" height="14" viewBox="0 0 70 14"><g fill="#f2f2f2"><rect x="0" y="9" width="3" height="4" rx="1"/><rect x="5" y="6" width="3" height="7" rx="1"/><rect x="10" y="3" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="13" rx="1"/><path d="M29 4.5a10 10 0 0114 0l-1.6 1.6a7.7 7.7 0 00-10.8 0zM32.2 7.7a5.5 5.5 0 017.6 0L36 11.5z"/><rect x="47" y="1" width="20" height="11" rx="3" fill="none" stroke="#f2f2f2" stroke-opacity=".5"/><rect x="49" y="3" width="15" height="7" rx="1.5"/><rect x="68" y="4.5" width="1.6" height="4" rx=".8" fill-opacity=".5"/></g></svg>',
  };

  // ------------------------------------------------------------------ phone geometry (logical px; the phone is scaled per format)
  const PW = 436, PH = 904, INSET = 16, SW = PW - 2 * INSET, SH = PH - 2 * INSET;
  const PS = pick(1.08, 0.95, 1.15);
  const PCX = pick(1380, W * 0.66, W / 2), PCY = pick(H / 2 + 6, H / 2 + 40, 985);
  const MS = pick(380, 340, 520), MCX = PCX, MCY = pick(PCY - 40, PCY - 40, 640);
  function pose(t) {
    const up = sp(t, 'phone_in', 'heavy'), out = sp(t, 'collapse', 'heavy');
    return {
      x: 10 * drift(t * 0.35) * (1 - out) + (MCX - PCX) * out,
      y: (1 - up) * (H * 0.75) + 7 * drift2(t * 0.5) * (1 - out) + (MCY - PCY) * out,
      r: ((1 - up) * 9 + 0.7 * drift3(t * 0.4)) * (1 - out),
      s: PS * (1 - 0.67 * out),
    };
  }
  function P(t, sx, sy) {
    const p = pose(t), a = (p.r * Math.PI) / 180;
    const vx = (INSET + sx - PW / 2) * p.s, vy = (INSET + sy - PH / 2) * p.s;
    return [PCX + p.x + vx * Math.cos(a) - vy * Math.sin(a), PCY + p.y + vx * Math.sin(a) + vy * Math.cos(a)];
  }

  // chat layout (screen px)
  const KB = 300, CMP_H = 50, CMP_B = 30;                        // keyboard height, composer min height, composer bottom margin
  const REQ = 'can you look up the current frontier AI model list and email it to me';
  // home layout
  const TOPROW = [[76, 'atlas'], [202, 'commish'], [328, 'mailmate']], TOPY = 186, TOPS = 70;
  const LIST = [
    ['ops', '8:08 PM', 'Understood — nothing was sent. I’ll leave the draft for you.'],
    ['dex', 'Yesterday', 'Sent — the same hardware list now includes the new pricing.'],
    ['analyst', 'Yesterday', 'Both done: Sheet created and filled: Job Applications.'],
    ['planner', 'Wednesday', 'Sent — your plan for the week is in your inbox.'],
    ['operator', 'Wednesday', 'Done — the email went out from your Gmail.'],
  ];
  const LY0 = 318, LH = 86, LS = 52;
  const FLYTO = { atlas: [TOPROW[0][0], TOPY + TOPS / 2, TOPS], commish: [TOPROW[1][0], TOPY + TOPS / 2, TOPS],
    ops: [14 + LS / 2, LY0 + 0 * LH + 14 + LS / 2, LS], analyst: [14 + LS / 2, LY0 + 2 * LH + 14 + LS / 2, LS],
    planner: [14 + LS / 2, LY0 + 3 * LH + 14 + LS / 2, LS], operator: [14 + LS / 2, LY0 + 4 * LH + 14 + LS / 2, LS] };

  // ================================================================ the whole product story: one scene, one phone
  scene({
    name: 'story', from: 'hook', to: 43.5,
    build(root, S) {
      S.cam = el('div', { class: 'a', style: `width:${W}px;height:${H}px;transform-origin:50% 50%` }, root); reg(S.cam);
      const cam = S.cam;
      el('div', { class: 'a', style: `left:${PCX - 700}px;top:${PCY - 600}px;width:1400px;height:1200px;background:radial-gradient(closest-side, rgba(255,250,235,.045), rgba(255,250,235,0))` }, cam);

      // ---- headlines live outside the camera, so close-ups never crop them; in 9:16 a scrim keeps them clean
      const HS = pick(108, 100, 92), HX = PAD, HY = pick(H / 2 - HS * 1.05, 230, 290);
      S.HX = HX; S.HY = HY;
      S.scrim = reg(el('div', { class: 'a', style: `width:${W}px;height:${HY + HS * 2 + 90}px;background:linear-gradient(#161615 0%, #161615 ${Math.round(((HY + HS * 2 + 30) / (HY + HS * 2 + 90)) * 100)}%, rgba(22,22,21,0) 100%)` }, root), { o: 0 });
      S.hl = el('div', { class: 'a', style: `width:${W}px;height:${H}px` }, root);
      const head = (a, b, acc) => [line(S.hl, a, { x: HX, y: HY, size: HS }), line(S.hl, b, { x: HX, y: HY + HS * 0.98, size: HS, accent: acc })];
      S.H = {
        hook: head('Give AI', 'real work.', [0, 1]),
        team: head('Meet your', 'teammates.', [0]),
        chat: head('Describe', 'the job.', [1]),
        work: head('Message Bots', 'like teammates.', [1]),
        go: head('Let it', 'work.', [0]),
        email: head('Nothing ships', 'without your OK.', [2]),
        computer: head('A computer', 'of their own.', [3]),
      };

      // ---- the hook cluster: six real teammates (they fly into the phone's home screen)
      const CL = pick([[0, 0, 210], [-230, -150, 150], [210, -190, 140], [-260, 150, 130], [230, 120, 160], [0, 250, 120]],
        [[0, 0, 190], [-210, -140, 130], [190, -170, 120], [-230, 140, 115], [210, 110, 140], [0, 230, 110]],
        [[0, 0, 220], [-250, -170, 150], [230, -200, 140], [-250, 190, 135], [240, 160, 160], [0, 300, 120]]);
      S.cluster = FLY.map((k, i) => {
        const [dx, dy, size] = CL[i];
        return { k, b: reg(bot(cam, k, size, PCX + dx - size / 2, PCY + dy - size / 2), { o: 0 }), size, cx: PCX + dx, cy: PCY + dy };
      });

      // ---- the phone
      S.phone = el('div', { class: 'a', style: `left:${PCX - PW / 2}px;top:${PCY - PH / 2}px;width:${PW}px;height:${PH}px;transform-origin:50% 50%` }, cam);
      reg(S.phone);
      const ph = S.phone;
      el('div', { class: 'a', style: `left:30px;top:${PH - 40}px;width:${PW - 60}px;height:80px;border-radius:50%;background:rgba(0,0,0,.75);filter:blur(28px)` }, ph);
      [[-3, 170, 46], [-3, 240, 72], [-3, 324, 72], [PW - 1, 260, 104]].forEach(([x, y, h]) =>
        el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:4px;height:${h}px;border-radius:2px;background:linear-gradient(90deg,#2a2a2c,#6a6a6e,#2a2a2c)` }, ph));
      el('div', { class: 'a', style: `width:${PW}px;height:${PH}px;border-radius:72px;background:linear-gradient(140deg,#6b6b70 0%,#2a2a2d 18%,#1b1b1d 50%,#2c2c2f 82%,#77777c 100%);box-shadow:0 70px 120px -30px rgba(0,0,0,.85),0 30px 50px -20px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.12)` }, ph);
      el('div', { class: 'a', style: `left:5px;top:5px;width:${PW - 10}px;height:${PH - 10}px;border-radius:67px;background:#050505;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.05)` }, ph);
      S.screen = el('div', { class: 'a app', style: `left:${INSET}px;top:${INSET}px;width:${SW}px;height:${SH}px;border-radius:56px;overflow:hidden;background:${BG}` }, ph);
      const scr = S.screen;

      // ================= view 1: home ("Krafty", search, bot row, chat list) — from the recording
      S.vHome = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:${BG}` }, scr));
      const vh = S.vHome;
      el('div', { class: 'circ', style: 'left:16px;top:64px;width:34px;height:34px;background:#cdb8ff;border:none' }, vh,
        '<svg width="18" height="12" viewBox="0 0 18 12"><circle cx="5" cy="6" r="2" fill="#4b2a99"/><circle cx="13" cy="6" r="2" fill="#4b2a99"/></svg>');
      el('div', { class: 'a', style: `left:0;top:68px;width:${SW}px;text-align:center;font-size:18px;font-weight:700` }, vh, 'Krafty');
      [[SW - 128, ICON.bell], [SW - 88, ICON.people]].forEach(([x, ic]) => el('div', { class: 'circ', style: `left:${x}px;top:64px;width:34px;height:34px` }, vh, ic));
      S.plusBtn = reg(el('div', { class: 'circ', style: `left:${SW - 48}px;top:64px;width:34px;height:34px;transform-origin:50% 50%` }, vh, ICON.plus));
      el('div', { class: 'pill', style: `left:14px;top:114px;width:${SW - 28}px;height:42px;padding:0 16px;background:#222;border:1px solid #2c2c2c;font-size:16px;color:#7a7a7a` }, vh, 'Search chats');
      S.top = TOPROW.map(([cx, k]) => {
        const av = bot(vh, k, TOPS, cx - TOPS / 2, TOPY, false);
        el('div', { class: 'a mut', style: `left:${cx - 60}px;top:${TOPY + TOPS + 10}px;width:120px;text-align:center;font-size:15px;font-weight:600` }, vh, BOTS[k].name);
        return { k, av: reg(av, { o: k === 'mailmate' ? 1 : 0 }) };
      });
      S.list = LIST.map(([k, tm, msg], i) => {
        const r = el('div', { class: 'a', style: `left:0;top:${LY0 + i * LH}px;width:${SW}px;height:${LH}px` }, vh);
        const av = bot(r, k, LS, 14, 14, false);
        el('div', { class: 'a', style: `left:80px;top:16px;width:${SW - 96}px` }, r,
          `<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:17px;font-weight:700">${BOTS[k].name}</span><span class="mut" style="font-size:14px">${tm}</span></div>
           <div class="mut ell" style="font-size:15px;margin-top:4px">${msg}</div>`);
        return { k, av: reg(av, { o: k === 'dex' ? 1 : 0 }) };
      });
      // + menu (Create / New teammate / New group chat / Cancel)
      S.dimH = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:#000` }, vh), { o: 0 });
      S.menu = reg(el('div', { class: 'a', style: `left:${SW / 2 - 104}px;top:150px;width:208px;padding:12px;border-radius:26px;background:rgba(48,48,50,.96);box-shadow:0 20px 50px rgba(0,0,0,.6);transform-origin:90% 0` }, vh), { o: 0 });
      el('div', { style: 'text-align:center;font-size:15px;font-weight:600;padding:4px 0 10px' }, S.menu, 'Create');
      S.mItems = ['New teammate', 'New group chat', 'Cancel'].map((s) => reg(el('div', { style: 'position:relative;margin-top:7px;height:40px;border-radius:999px;background:#3c3c3e;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600' }, S.menu, s)));

      // ================= view 2: the new-teammate chat
      S.vChat = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:${BG};box-shadow:-30px 0 60px rgba(0,0,0,.5)` }, scr));
      const vc = S.vChat;
      S.threadVp = el('div', { class: 'a', style: `left:0;top:100px;width:${SW}px;height:500px;overflow:hidden` }, vc); reg(S.threadVp);
      S.thread = el('div', { class: 'a', style: `left:0;bottom:0;top:auto;width:${SW}px;display:flex;flex-direction:column;padding:0 14px 6px` }, S.threadVp);
      const slot = (html, user = false) => {
        const sl = el('div', { style: 'flex:none;overflow:visible;height:0px;position:relative' }, S.thread);
        const it = el('div', { style: `display:flex;justify-content:${user ? 'flex-end' : 'flex-start'};padding-top:9px` }, sl, html);
        return { sl: reg(sl), it: reg(it, { o: 0 }), user };
      };
      const botMsg = (s) => slot(`<div class="bub" style="max-width:310px">${s}</div>`);
      const userMsg = (s) => slot(`<div class="ubub" style="max-width:300px">${s}</div>`, true);
      const tool = (title, body) => {
        const s = slot(`<div class="cardx" style="width:${SW - 28}px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px;font-weight:700">${title}</b><span data-st style="font-size:13px"></span></div>
          <div class="ell" style="margin-top:8px;padding:8px 10px;border-radius:10px;background:#1c1c1c;font-size:14px">${body}</div><div class="mut" style="font-size:13px;margin-top:6px">Show result</div></div>`);
        s.st = reg(s.it.querySelector('[data-st]'));
        return s;
      };
      S.msgs = {
        g0: botMsg('Hi Drew — I’m your new teammate, still a blank canvas. What should I help with?'),
        g1: slot(`<div class="cardx" style="width:${SW - 28}px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:15px">What should I help with?</span>${ICON.x}</div>
          <div><span class="opt">Writing and editing</span></div><div><span class="opt">Research and decisions</span></div><div><span class="opt" data-pick>Planning and getting things done</span></div>
          <div class="mut" style="font-size:13px;margin-top:8px">Or type your own answer below.</div></div>`),
        g2: userMsg('Planning and getting things done'),
        g3: botMsg('I’ll go by Planner — I’ll break your requests into concrete steps, do the legwork (research, files, drafts) myself, and report back with the finished result and anything blocking.'),
        g4: slot(`<div class="cardx" style="width:${SW - 28}px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:15px">Save this as my setup?</span>${ICON.x}</div>
          <div style="display:flex;gap:6px"><span class="opt" data-pick>Save it</span><span class="opt">Change something</span></div>
          <div class="mut" style="font-size:13px;margin-top:8px">Or type your own answer below.</div></div>`),
        g5: userMsg('Save it'),
        g6: tool('Configured bot', 'Planner'),
        g7: botMsg('Saved. I’m Planner, set up for planning and getting things done — send me the first task whenever you’re ready.'),
        g8: userMsg(REQ),
        g9: tool('Found app tools', 'send an email via Gmail'),
        g10: tool('Searched web', 'frontier AI models October 2026'),
        g11: botMsg('Research done — compiling the list and sending it now.'),
        g12: slot(`<div class="cardx" style="width:${SW - 28}px;padding:14px 16px">
          <div class="mut" style="display:flex;gap:6px;align-items:center;font-size:13px">${ICON.mail}Mail</div>
          <div style="font-size:17px;font-weight:700;margin-top:6px;line-height:1.25">Current Frontier AI Models — October 2026</div>
          <div style="font-size:14px;margin-top:9px;border-top:1px solid #333;padding-top:8px"><span class="mut">From</span>&nbsp; Connected email account</div>
          <div style="font-size:14px;margin-top:5px;border-bottom:1px solid #333;padding-bottom:8px"><span class="mut">To</span>&nbsp; you@yourcompany.com</div>
          <div style="font-size:15px;line-height:1.36;margin-top:9px">Here’s a snapshot of the current frontier AI model landscape as of late October 2026:</div>
          <div style="font-size:15px;margin-top:8px;font-weight:600">Frontier flagships</div>
          <div style="font-size:15px;margin-top:8px" class="mut">— Planner (sent on behalf of Drew)</div>
          <div data-row style="position:relative;height:40px;margin-top:12px;overflow:hidden"><span data-lbl style="position:absolute;left:0;top:10px;width:160px;height:20px;overflow:hidden;font-size:14px"><span data-l0 class="mut" style="position:absolute;left:0;top:0">Needs approval</span><span data-l1 class="mut" style="position:absolute;left:0;top:0">Queued to send</span><span data-l2 class="mut" style="position:absolute;left:0;top:0">Sent</span></span>
            <span data-dis class="pill" style="right:96px;top:0;height:38px;padding:0 16px;border:1px solid #444;font-size:15px;font-weight:600">Discard</span>
            <span data-send class="pill" style="right:0;top:0;height:38px;padding:0 22px;background:#f2f2f2;color:#161615;font-size:15px;font-weight:700;transform-origin:50% 50%">Send</span></div></div>`),
        g13: tool('Ran approved action', 'GMAIL_SEND_EMAIL'),
        g14: botMsg('Sent. The email went out from your Gmail with the October 2026 frontier list.'),
        g15: userMsg('Save the October 2026 frontier AI model list you emailed as a document on my computer so I have a local copy.'),
        g16: tool('Saved file', '~/workspace/frontier-ai-models/frontier-ai-models-october-2026.md'),
        g17: botMsg('Saved to ~/workspace/frontier-ai-models — the same list from the email, plus an API pricing table.'),
      };
      S.pick1 = reg(S.msgs.g1.it.querySelector('[data-pick]'));
      S.pick2 = reg(S.msgs.g4.it.querySelector('[data-pick]'));
      S.row = reg(S.msgs.g12.it.querySelector('[data-row]'));
      S.lbl = reg(S.msgs.g12.it.querySelector('[data-lbl]'));
      S.L = [0, 1, 2].map((i) => reg(S.msgs.g12.it.querySelector(`[data-l${i}]`), { o: i === 0 ? 1 : 0 }));
      S.dis = reg(S.msgs.g12.it.querySelector('[data-dis]'));
      S.sendE = reg(S.msgs.g12.it.querySelector('[data-send]'));
      // loader ("Opening your conversation…")
      S.loader = reg(el('div', { class: 'a', style: `left:0;top:${SH / 2 - 70}px;width:${SW}px;text-align:center;transform-origin:50% 50%` }, vc), { o: 0 });
      const ld = el('div', { style: 'position:relative;width:44px;height:44px;margin:0 auto 10px' }, S.loader); bot(ld, 'operator', 44, 0, 0, false);
      el('div', { class: 'mut', style: 'font-size:15px' }, S.loader, 'Opening your conversation…');
      // header: back, name pill (New Bot → Planner), more
      el('div', { class: 'a', style: `width:${SW}px;height:104px;background:linear-gradient(${BG} 72%, rgba(26,26,26,0))` }, vc);
      el('div', { class: 'circ', style: 'left:14px;top:56px;width:38px;height:38px' }, vc, ICON.back);
      const hp = el('div', { class: 'pill', style: `left:${SW / 2 - 66}px;top:56px;width:132px;height:38px;justify-content:center;gap:7px;background:#232323;border:1px solid #333;font-size:16px;font-weight:600` }, vc);
      inlineBot(hp, 'operator', 22);
      S.hName = reg(el('span', {}, hp, 'New Bot'));
      el('div', { class: 'circ', style: `left:${SW - 52}px;top:56px;width:38px;height:38px` }, vc, ICON.more);
      // status row ("Thinking…", "Waiting for your answer", …)
      S.status = reg(el('div', { class: 'a', style: 'left:16px;display:flex;gap:9px;align-items:center;font-size:14px;color:#9a9a9a' }, vc), { o: 0 });
      inlineBot(S.status, 'operator', 20);
      S.stText = reg(el('span', {}, S.status, 'Thinking…'));
      // composer: + | field (wraps and grows) with waveform | send/stop
      S.cmp = reg(el('div', { class: 'a', style: `left:0;width:${SW}px;height:${CMP_H}px` }, vc));
      el('div', { class: 'circ', style: `left:12px;bottom:0;width:${CMP_H}px;height:${CMP_H}px` }, S.cmp, ICON.plus);
      S.field = el('div', { class: 'a', style: `left:${CMP_H + 20}px;top:auto;bottom:0;width:${SW - CMP_H - 32}px;min-height:${CMP_H}px;border-radius:25px;border:1px solid #333;background:#1f1f1f;padding:13px 84px 13px 18px;font-size:16px;line-height:22px` }, S.cmp);
      reg(S.field);
      S.ph = reg(el('span', { class: 'mut' }, S.field, 'Message New Bot…'));
      S.ftext = reg(el('span', {}, S.field, ''));
      S.caret = reg(el('span', { style: `display:inline-block;width:2px;height:19px;background:${PURPLE};margin-left:1px;vertical-align:-3px` }, S.field), { o: 0 });
      el('div', { class: 'a', style: `left:auto;right:52px;top:auto;bottom:15px` }, S.field, ICON.wave);
      S.btnUp = reg(el('div', { class: 'circ', style: `left:auto;right:7px;top:auto;bottom:7px;width:34px;height:34px;background:#2e2e2e;border:none;transform-origin:50% 50%` }, S.field, ICON.up('#bbb')));
      S.btnStop = reg(el('div', { class: 'circ', style: `left:auto;right:7px;top:auto;bottom:7px;width:34px;height:34px;background:#f2f2f2;border:none` }, S.field, ICON.stop), { o: 0 });
      S.btnSend = reg(el('div', { class: 'circ', style: `left:auto;right:7px;top:auto;bottom:7px;width:34px;height:34px;background:#f2f2f2;border:none;transform-origin:50% 50%` }, S.field, ICON.up('#161615')), { o: 0 });
      // keyboard (iOS dark): keys light up as the message is typed
      S.kb = reg(el('div', { class: 'a', style: `left:0;top:${SH}px;width:${SW}px;height:${KB + 20}px;background:#2b2b2d;border-radius:18px 18px 0 0` }, vc));
      el('div', { class: 'a', style: `left:0;top:8px;width:${SW}px;display:flex;justify-content:space-around;font-size:16px;color:#ddd` }, S.kb, '<span>i</span><span>the</span><span>I’m</span>');
      const KW = (SW - 8 - 9 * 5) / 10, KH = 42;
      S.keys = {};
      [['qwertyuiop', 0], ['asdfghjkl', KW / 2 + 2.5], ['zxcvbnm', KW * 1.5 + 7.5]].forEach(([row, off], ri) => {
        [...row].forEach((ch, i) => {
          S.keys[ch] = reg(el('div', { class: 'key', style: `left:${4 + off + i * (KW + 5)}px;top:${40 + ri * (KH + 10)}px;width:${KW}px;height:${KH}px;transform-origin:50% 100%` }, S.kb, ch));
        });
      });
      el('div', { class: 'key', style: `left:4px;top:${40 + 2 * (KH + 10)}px;width:${KW * 1.3}px;height:${KH}px;background:#47474b;font-size:17px` }, S.kb, '⇧');
      el('div', { class: 'key', style: `left:${SW - 4 - KW * 1.3}px;top:${40 + 2 * (KH + 10)}px;width:${KW * 1.3}px;height:${KH}px;background:#47474b;font-size:16px` }, S.kb, '⌫');
      el('div', { class: 'a', style: `left:18px;top:${40 + 4 * (KH + 10) - 4}px;font-size:22px` }, S.kb, '☺');
      el('div', { class: 'a', style: `left:${SW - 38}px;top:${40 + 4 * (KH + 10) - 2}px` }, S.kb, '<svg width="18" height="24" viewBox="0 0 24 28"><rect x="8" y="2" width="8" height="15" rx="4" fill="#ddd"/><path d="M4 13a8 8 0 0016 0M12 21v5" fill="none" stroke="#ddd" stroke-width="2" stroke-linecap="round"/></svg>');
      el('div', { class: 'key', style: `left:4px;top:${40 + 3 * (KH + 10)}px;width:${KW * 2}px;height:${KH}px;background:#47474b;font-size:15px` }, S.kb, '123');
      S.keys[' '] = reg(el('div', { class: 'key', style: `left:${KW * 2 + 12}px;top:${40 + 3 * (KH + 10)}px;width:${SW - KW * 4 - 28}px;height:${KH}px` }, S.kb, ''));
      el('div', { class: 'key', style: `left:${SW - KW * 2 - 8}px;top:${40 + 3 * (KH + 10)}px;width:${KW * 2 + 4}px;height:${KH}px;background:#47474b;font-size:15px` }, S.kb, 'return');

      // status bar
      el('div', { class: 'a', style: 'left:40px;top:17px;font-size:17px;font-weight:600;width:60px;text-align:center' }, scr, '8:10');
      el('div', { class: 'a', style: `left:${SW - 104}px;top:21px` }, scr, ICON.status);
      el('div', { class: 'a', style: `left:${SW / 2 - 62}px;top:11px;width:124px;height:36px;border-radius:20px;background:#000` }, scr);
      el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;border-radius:56px;background:linear-gradient(118deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,.03) 100%)` }, scr);

      S.cluster.forEach((c) => cam.appendChild(c.b));   // flying bots pass over the phone

      // ---- the touch cursor (press shrinks it, every tap leaves a ripple)
      S.cur = reg(el('div', { class: 'a', style: 'width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,255,255,.26);border:2px solid rgba(255,255,255,.85);box-shadow:0 6px 18px rgba(0,0,0,.45);transform-origin:50% 50%' }, cam), { o: 0 });
      S.rip = reg(el('div', { class: 'a', style: 'width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:3px solid rgba(255,255,255,.9);transform-origin:50% 50%' }, cam), { o: 0 });
    },

    run(t, b, S) {
      const B = beatOf;
      // ---- headlines: sequential swaps
      const HL = [['hook', 0, 6.2], ['team', 'team', 12.2], ['chat', 'chat', 22.2], ['work', 'work', 28.7], ['go', 'go', 32.2], ['email', 'email', 37.2], ['computer', 'computer', 42.3]];
      HL.forEach(([k, a, out]) => {
        const [l1, l2] = S.H[k];
        if (k === 'hook') { rise(t, l1, [-0.9, 'w2'], out); rise(t, l2, ['w3', 'w4'], out); return; }
        rise(t, l1, B(a) - 0.28, out, { stagger: 0.06, show: 0.52 });
        rise(t, l2, B(a) + 0.07, out, { stagger: 0.06, show: 0.52 });
      });

      // ---- phone
      const p = pose(t);
      put(S.phone, { x: p.x, y: p.y, r: p.r, s: p.s, o: b < B('phone_in') - 0.2 || sp(t, 'mascot', 'playful') > 0.75 ? 0 : 1 });

      // ---- hook cluster: pop in (slower opening), float, fly into their home-screen slots
      const POP = ['hook', 'bot2', 'bot3', 'bot4', 'bot5', 'bot6'];
      const land = (i) => b >= B('team') || sp(t, B('fly') + i * 0.15, 'default') > 0.985;
      S.cluster.forEach((c, i) => {
        const pin = i === 0 ? spHit(t, -0.3, 'playful') : spHit(t, POP[i], 'playful');
        const f = sp(t, B('fly') + i * 0.15, 'default');
        const [sx, sy, sz] = FLYTO[c.k];
        const [ax, ay] = P(t, sx, sy);
        const target = (sz * pose(t).s) / c.size;
        const bob = 10 * drift(t * 0.9 + i * 7) * (1 - f);
        put(c.b, { o: land(i) || pin < 0.002 ? 0 : 1, s: lerp(0.4 + 0.6 * pin, target, f), x: (ax - c.cx) * f, y: (ay - c.cy) * f + bob, r: 6 * drift2(t * 0.6 + i) * (1 - f) });
      });
      const landK = (k) => land(FLY.indexOf(k));
      S.top.forEach((T) => { if (T.k !== 'mailmate') put(T.av, { o: landK(T.k) ? 1 : 0 }); });
      S.list.forEach((R) => { if (R.k !== 'dex') put(R.av, { o: landK(R.k) ? 1 : 0 }); });

      // ---- + menu: press +, menu grows from the button, press "New teammate", menu closes, chat pushes in
      const pr = (m, d0 = 0.2, d1 = 0.08) => sp(t, B(m) - d0, 'snappy') - sp(t, B(m) + d1, 'snappy');
      put(S.plusBtn, { s: 1 - 0.14 * pr('tap1') });
      const mo = sp(t, 'pop', 'snappy') - sp(t, B('tap2') + 0.12, 'snappy');
      put(S.menu, { o: mo > 0.02 ? 1 : 0, s: 0.86 + 0.14 * clamp(mo) });
      put(S.dimH, { o: 0.4 * clamp(mo) });
      const mh = sp(t, 'hover1', 'snappy');
      put(S.mItems[0], { s: 1 - 0.05 * pr('tap2'), css: { background: mh > 0.5 ? '#55555a' : '#3c3c3e' } });
      const n1 = sp(t, 'nav1', 'default');
      put(S.vHome, { x: -SW * 0.3 * n1, hide: n1 > 0.999 });
      put(S.vChat, { x: SW * (1 - n1), hide: n1 < 0.001 });
      const lo = sp(t, B('nav1') + 0.2, 'snappy') - sp(t, 'think1', 'snappy');
      put(S.loader, { o: lo > 0.02 ? 1 : 0, s: 0.85 + 0.15 * clamp(lo) });
      put(S.hName, { text: b >= B('g6d') ? 'Planner' : 'New Bot' });

      // ---- keyboard + composer: the keyboard slides up for typing, the field grows as the text wraps
      const kb = sp(t, B('tap5') + 0.05, 'default') - sp(t, B('tap6') + 0.2, 'default');
      put(S.kb, { y: -(KB + 20) * clamp(kb, 0, 1.02), hide: kb < 0.001 });   // parked keyboard is not painted at all (its edge peeked through the screen corner)
      const typing = b >= B('tap5') && b < B('tap6');
      const a8 = spHit(t, B('g8') - 0.16, 'snappy');
      const held = b >= B('tap5') && (b < B('g8') - 0.16 || a8 < 0.85);   // the composer keeps the text until the bubble is nearly up
      const n = held ? Math.floor(seg(t, 'type0', 'type1') * REQ.length + 1e-6) : 0;
      const shrink = held || b < B('tap5') ? 0 : clamp(a8 - 0.85) / 0.15 * 0 + sp(t, B('g8') + 0.1, 'snappy');
      put(S.ftext, { text: REQ.slice(0, n) });
      put(S.ph, { css: { display: n > 0 || typing ? 'none' : 'inline' }, text: b >= B('g6d') ? 'Message Planner…' : 'Message New Bot…' });
      put(S.caret, { o: typing && (n < REQ.length || Math.floor(b * 2) % 2 === 0) ? 1 : 0 });
      const fMin = !held && b >= B('tap6') && shrink < 0.999 ? lerp(94, CMP_H, shrink) : CMP_H;   // after send the 3-line field (94 px) springs back to one line
      put(S.field, { css: { borderColor: typing ? PURPLE : '#333', minHeight: fMin.toFixed(2) + 'px', overflow: 'hidden' } });
      const fh = Math.max(CMP_H, S.field.offsetHeight);
      const cmpBottom = SH - CMP_B - (KB - 10) * clamp(kb);
      put(S.cmp, { y: Math.round(cmpBottom - CMP_H) });   // whole pixels: a fractional edge rasterises differently after a seek
      // key pops: the key of the character just typed lights up for ~90 ms
      Object.values(S.keys).forEach((k) => put(k, {}));
      if (typing && n > 0) {
        const ti = bt('type0') + (n / REQ.length) * (bt('type1') - bt('type0'));
        const ch = REQ[n - 1].toLowerCase(), k = S.keys[ch];
        if (k && t - ti < 0.09) put(k, { s: 1.12, css: { background: '#9a9aa0' } });
      }
      // right button: up arrow idle, white send when there's text, stop while the bot works
      const WORK = [['think1', 'g1'], ['g2', 'g4'], ['g5', 'g7'], ['g8', 'g12'], ['tap7', 'g14'], ['g15', 'g17']];
      const working = WORK.some(([a, z]) => b >= B(a) && b < B(z));
      put(S.btnSend, { o: n > 0 ? 1 : 0, s: 1 - 0.14 * pr('tap6') });
      put(S.btnStop, { o: working && n === 0 ? 1 : 0 });
      put(S.btnUp, { o: !working && n === 0 ? 1 : 0, s: 1 - 0.14 * pr('tap5') });
      // status row above the composer
      const ST = [['think1', 'g0', 'Thinking…'], ['g1', 'tap3', 'Waiting for your answer'], ['g2', 'g3', 'Waiting to start…'], ['g4', 'tap4', 'Waiting for your answer'],
        ['g5', 'g7', 'Working…'], ['g8', 'g11', 'Thinking…'], ['g11', 'g12', 'Working…'], ['tap7', 'g14', 'Working…'], ['g15', 'g17', 'Working…']];
      const st = ST.find(([a, z]) => b >= B(a) && b < B(z));
      put(S.status, { o: st && b >= B('tap6') && b < B('g8') + 0.6 && (held || fMin > CMP_H + 4) ? 0 : st ? 1 : 0, y: cmpBottom - fMin - 30 });   // no status while the tall composer settles
      if (st) put(S.stText, { text: st[2] });
      // thread viewport ends above the status row
      const vpH = cmpBottom - fMin - 38 - 100;
      put(S.threadVp, { css: { height: vpH.toFixed(1) + 'px' } });

      // ---- messages: each slot springs open at the bottom (pushing the thread up); answered cards close again
      const ARR = { g0: 'default', g1: 'default', g2: 'snappy', g3: 'default', g4: 'default', g5: 'snappy', g6: 'default', g7: 'default', g8: 'snappy',
        g9: 'default', g10: 'default', g11: 'default', g12: 'default', g13: 'default', g14: 'default', g15: 'snappy', g16: 'default', g17: 'default' };
      const CLOSE = { g1: 'g2', g4: 'g5' };
      Object.entries(S.msgs).forEach(([k, M]) => {
        const a = spHit(t, B(k) - (ARR[k] === 'snappy' ? 0.16 : 0), ARR[k]);
        const c = CLOSE[k] ? sp(t, B(CLOSE[k]) - 0.1, 'default') : 0;   // starts just after the tap
        const h = M.it.offsetHeight;
        put(M.sl, { css: { height: (h * clamp(a, 0, 1.02) * (1 - clamp(c))).toFixed(2) + 'px', overflow: c > 0.001 ? 'hidden' : 'visible' } });
        put(M.it, { o: c > 0.985 ? 0 : clamp(a * 5), y: (k === 'g8' ? 70 : 24) * (1 - a), s: (0.96 + 0.04 * a) * (1 - 0.03 * c), css: { transformOrigin: M.user ? '100% 100%' : '0 0' } });
      });
      // tool cards: Processing → Done
      [['g6', 'g6d'], ['g9', 'g9d'], ['g10', 'g10d'], ['g13', 'g13d'], ['g16', 'g16d']].forEach(([k, d]) => {
        const done = b >= B(d);
        put(S.msgs[k].st, { html: done ? `<span style="color:${GREEN}">● Done</span>` : `<span class="mut">${k === 'g16' ? 'Saving' : 'Processing'}${'.'.repeat(1 + (Math.floor(b * 4) % 3))}</span>` });
      });
      // option picks: hover then press
      put(S.pick1, { s: 1 - 0.06 * pr('tap3'), css: { background: b >= B('tap3') - 0.5 ? '#3a3a3a' : 'transparent' } });
      put(S.pick2, { s: 1 - 0.06 * pr('tap4'), css: { background: b >= B('tap4') - 0.5 ? '#3a3a3a' : 'transparent' } });
      // email approval: hover brightens Send, press squashes it, then the footer reads "Queued to send" → "Sent"
      const eh = sp(t, 'hover3', 'snappy');
      const appr = b >= B('tap7');
      const spin = b >= B('tap7') + 0.12;
      const rowOut = sp(t, B('tap7') + 0.6, 'default');
      const ang = ((t * 720) % 360).toFixed(1);
      put(S.sendE, { s: 1 + 0.05 * eh - 0.1 * pr('tap7'), y: 44 * rowOut, hide: rowOut > 0.97, css: { boxShadow: `0 0 0 ${(4 * eh * (spin ? 0 : 1)).toFixed(1)}px rgba(255,255,255,.18)`, transformOrigin: '100% 50%' },
        html: spin ? `<svg width="16" height="16" viewBox="0 0 24 24" style="transform:rotate(${ang}deg)"><circle cx="12" cy="12" r="9" fill="none" stroke="#bbb" stroke-width="3"/><path d="M12 3a9 9 0 019 9" fill="none" stroke="#161615" stroke-width="3" stroke-linecap="round"/></svg>` : 'Send' });
      put(S.dis, { y: 44 * rowOut, hide: rowOut > 0.97 });
      put(S.row, { css: { height: lerp(40, 22, clamp(rowOut)).toFixed(2) + 'px' } });
      put(S.lbl, { y: -9 * clamp(rowOut) });
      // label swaps: the old line lifts out, the new one rises in (each over ~4 frames)
      const LB = [null, B('tap7') + 1.1, B('g14') - 0.05];   // "Sent" lands with the bot's "Sent." reply
      S.L.forEach((L, i) => {
        const inn = i === 0 ? 1 : sp(t, LB[i], 'snappy'), out = i < 2 ? sp(t, LB[i + 1] - 0.12, 'snappy') : 0;
        const y = 20 * (1 - inn) - 20 * out;
        put(L, { y, o: 1, hide: inn < 0.02 || out > 0.98 });
      });

      // ---- the cursor: appears at its target, presses, ripples, lifts away
      const TAPS = [
        ['tap1', [SW - 31, 81]], ['tap2', [SW / 2, 150 + 12 + 30 + 7 + 20]], ['tap3', [150, 0]], ['tap4', [56, 0]],
        ['tap5', [180, SH - CMP_B - CMP_H / 2]], ['tap6', [SW - 36, SH - CMP_B - (KB - 10) - CMP_H / 2]], ['tap7', [SW - 58, 0]],
      ];
      // live positions for things inside the thread
      const vpBottom = 100 + vpH;
      const live = { tap3: vpBottom - 6 - 13 - 22 - 8 - 18, tap4: vpBottom - 6 - 13 - 22 - 8 - 18, tap7: vpBottom - 6 - 14 - 20 };
      let vis = 0, cx = 0, cy = 0, press = 0, ring = -1;
      TAPS.forEach(([tp, [sx, sy0]]) => {
        const sy = live[tp] ?? sy0;
        const w = C.win(t, B(tp) - 0.75, B(tp) + 0.1);
        if (w > vis) { vis = w; [cx, cy] = P(t, sx, sy); }
        press += pr(tp);
        const d = t - bt(tp) + 0.07;
        if (d >= 0 && d < 0.42) { ring = d / 0.42; if (vis < 0.01) [cx, cy] = P(t, sx, sy); }
      });
      put(S.cur, { o: vis > 0.03 ? 1 : 0, x: cx, y: cy, s: clamp(vis) * (1 - 0.22 * press) });
      put(S.rip, { o: ring < 0 ? 0 : 0.8 * (1 - ring), x: cx, y: cy, s: 0.6 + 2.2 * ease.out(Math.max(0, ring)) });

      // ---- camera: wide at a few swaps, close-ups on the phone so the UI reads
      const PU = pick(1.65, 1.5, 1.3);
      const CU = [[7.25, 11.75], [13, 22.2], [23, 31.1], [31.8, 37.1], [38, 41.6]];
      const zk = [[0, 1], ...CU.flatMap(([a, o]) => [[a, PU], [o, 1]]), [23.6, pick(2.3, 2, 1.9)], [27.8, PU], [32.7, pick(2.1, 1.9, 1.8)], [36.4, PU]];
      const z = trk(t, zk.sort((p, q) => p[0] - q[0]));
      const fyS = trk(t, [[0, SH * 0.45], [B('team') + 0.3, SH * 0.42], [B('chat') - 0.4, SH - 230], [B('work') - 0.4, SH - 340], [B('g8') - 0.2, SH - 250], [B('g12') - 0.5, SH - 330], [32.5, SH - 190], [36.4, SH - 330], [B('computer') - 0.4, SH - 250]]);
      const zz = z * (1 + 0.025 * seg(t, 'hook', 'collapse'));
      const [fx, fy] = P(t, SW / 2, fyS);
      const k = clamp((z - 1) / (PU - 1));   // > PU in the tight close-ups: fully framed
      const dx = lerp(fx, pick(1400 + 110 * clamp((z - PU) / (2.3 - PU)), W * 0.62, W / 2), k), dy = lerp(fy, H * pick(0.22 + 0.56 * fyS / SH, 0.25 + 0.5 * fyS / SH, 0.38 + 0.26 * fyS / SH), k);
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
      const sub = ['Start free and give it', 'something real to do.'];
      S.sub = sub.map((s, i) => line(root, s, { x: PAD, y: sy + i * 64, size: pick(52, 44, 54), cls: 'ui', color: 'var(--ink-2)' }));
      S.url = line(root, 'kraftybot.app', { x: PAD, y: sy + sub.length * 64 + 28, size: pick(96, 80, 96), accent: [0] });
      const O = pick([[-330, -230, 120], [310, -250, 110], [-370, 150, 110], [340, 170, 125], [-150, 330, 100], [150, 340, 105]],
        [[-280, -200, 100], [270, -210, 95], [-310, 130, 95], [290, 140, 105], [-130, 280, 85], [130, 290, 90]],
        [[-340, -230, 100], [340, -250, 95], [-380, 30, 90], [370, 20, 100], [-300, 230, 85], [300, 225, 90]]);
      S.orbit = FLY.map((k, i) => { const [ox, oy, sz] = O[i]; return { b: reg(bot(root, k, sz, MCX + ox - sz / 2, MCY + oy - sz / 2), { o: 0 }), i }; });
    },
    run(t, b, S) {
      const p = spHit(t, 'mascot', 'playful');
      put(S.m.el, { o: p > 0.002 ? 1 : 0, s: pick(0.7, 0.7, 0.8) + pick(0.3, 0.3, 0.2) * p, y: 8 * drift(t * 0.7 + 20) });
      blink(t, S.m, [47, 49.2]);
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
