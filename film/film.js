// Krafty — flagship reveal, v4. 33 s, 16:9 + 9:16. Seven scenes, each starting on a downbeat (beats 0, 8, 20, 32, 40, 52, 60).
// One continuous phone (the real Krafty app's look: bg #1a1a1a, bubbles #242424, user bubble #7f42ef) carries the story;
// floating cards (app badges, the cloud-computer browser, the approval card) pop out in front of it on a 3D layer.
// Pure function of time: closed-form springs from lib/motion.js, seeded noise only, no timers, nothing mutated in run().
(() => {
  const _hit = C.spHit;
  const LEADS = { snappy: -0.04, heavy: -0.04, default: 0.05, playful: 0 };
  C.spHit = (t, b, p = 'snappy', lead = LEADS[p] ?? C.leadFor(p)) => _hit(t, b, p, lead);
  const { W, H, pick, put, reg, el, scene, sp, spHit, trk, seg, clamp, lerp, ease, bt, beatOf, noise1 } = C;
  const { line, rise } = TYPE;
  const B = beatOf;
  C.fonts = ['700 100px Display', '400 40px Display'];
  const TALL = C.FMT === '9x16';
  const PAD = pick(140, 90, 80);
  const PURPLE = '#7f42ef', BG = '#1a1a1a', BUB = '#242424', GREEN = '#34d399';

  document.head.appendChild(el('style', {}, null, `
    .ui { font-family: 'Display', Arial, sans-serif; letter-spacing: -0.01em; }
    .app { font-family: system-ui, -apple-system, sans-serif; color: #f2f2f2; letter-spacing: -0.01em; -webkit-font-smoothing: antialiased; }
    .app * { box-sizing: border-box; }
    .a { position: absolute; left: 0; top: 0; }
    .mut { color: #9a9a9a; }
    .pill { position: absolute; border-radius: 999px; display: flex; align-items: center; white-space: nowrap; }
    .ell { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .circ { position: absolute; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #262626; border: 1px solid #333; }
    .bub { background: ${BUB}; border-radius: 20px; padding: 10px 14px; font-size: 15px; line-height: 1.36; }
    .ubub { background: ${PURPLE}; color: #fff; border-radius: 20px; padding: 10px 14px; font-size: 15px; line-height: 1.36; font-weight: 500; }
    .cardx { background: ${BUB}; border-radius: 18px; padding: 12px 13px; font-size: 14px; }
    .glass { background: rgba(38,38,40,.62); border: 1px solid rgba(255,255,255,.12); -webkit-backdrop-filter: blur(18px) saturate(1.4); backdrop-filter: blur(18px) saturate(1.4); box-shadow: 0 24px 60px -12px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08); }
    .ok { color: ${GREEN}; }
    .tag { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 2px 8px; font-size: 12px; font-weight: 600; }
  `));

  // ------------------------------------------------------------------ bots (the app's shapes), shaded for depth
  const BOTS = {
    atlas:    { name: 'Atlas', c: '#ff7d18', shape: 'bean' },
    commish:  { name: 'Commish', c: '#2ebd63', shape: 'tri' },
    mailmate: { name: 'Mailmate', c: '#8849fe', shape: 'drop' },
    planner:  { name: 'Planner', c: '#1c7dfe', shape: 'round2' },
    analyst:  { name: 'Analyst', c: '#ff2340', shape: 'round' },
    talent:   { name: 'Talent Scout', c: '#2ebd63', shape: 'tri' },
    health:   { name: 'Account Health', c: '#50b6a3', shape: 'round' },
    bug:      { name: 'Bug Repro', c: '#f6732a', shape: 'bean2' },
    chief:    { name: 'Chief of Staff', c: '#b9a3ff', shape: 'ghost' },
    sales:    { name: 'Sales Outbound', c: '#f7a32f', shape: 'round2' },
  };
  const FIVE = ['atlas', 'commish', 'mailmate', 'planner', 'analyst'];
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  const SHAPES = {
    bean: '<path d="M44 6c24-3 46 14 46 40 0 30-18 50-44 50C22 96 8 84 8 64c0-12 8-19 8-30C16 17 26 8 44 6z"/>',
    bean2: '<path d="M46 6c24 0 44 16 44 42 0 28-18 46-42 46-24 0-40-14-40-36 0-12 6-18 6-28C14 14 28 6 46 6z"/>',
    tri: '<path d="M50 5c6 0 10 3 13 8l34 62c5 9-1 20-12 20H15C4 95-2 84 3 75L37 13c3-5 7-8 13-8z"/>',
    ghost: '<path d="M16 46C16 22 31 6 50 6s34 16 34 40v44c0 4-3 6-6 6H22c-3 0-6-2-6-6z"/>',
    round: '<path d="M50 7c25 0 43 17 43 42S75 94 50 94 7 76 7 50 25 7 50 7z"/>',
    round2: '<path d="M54 6c22 2 40 20 38 44-2 26-22 44-46 42C22 90 6 72 8 48 10 22 30 4 54 6z"/>',
    drop: '<path d="M64 4c4 16 28 30 28 58 0 22-18 36-42 36S8 84 8 62C8 34 44 24 64 4z"/>',
  };
  let BOTN = 0;
  function bot(parent, key, size, x = 0, y = 0, shadow = true) {
    const Bt = BOTS[key], id = 'b' + (BOTN++), s = SHAPES[Bt.shape];
    const eyeY = Bt.shape === 'tri' ? 44 : Bt.shape === 'ghost' ? 24 : 26;
    const svg = `<svg width="${size}" height="${size * 1.14}" viewBox="0 0 100 114" style="overflow:visible;display:block">
      <defs>
        <radialGradient id="${id}g" cx="34%" cy="26%" r="85%"><stop offset="0" stop-color="${shade(Bt.c, 0.4)}"/><stop offset=".45" stop-color="${Bt.c}"/><stop offset="1" stop-color="${shade(Bt.c, -0.45)}"/></radialGradient>
        <radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
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
      <g fill="#161615"><rect x="54" y="${eyeY}" width="9" height="19" rx="4.5" transform="rotate(-22 58 ${eyeY + 9})"/><rect x="70" y="${eyeY}" width="9" height="19" rx="4.5" transform="rotate(-22 74 ${eyeY + 9})"/></g>
    </svg>`;
    return reg(el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:${size}px;height:${size}px;transform-origin:50% 50%` }, parent, svg));
  }
  const inlineBot = (parent, key, size) => { const h = el('span', { style: `position:relative;display:inline-block;width:${size}px;height:${size}px;flex:none` }, parent); bot(h, key, size, 0, 0, false); return h; };
  const botHTML = (key, size) => { const d = el('div'); inlineBot(d, key, size); return d.innerHTML; };

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

  const drift = noise1(11), drift2 = noise1(23), drift3 = noise1(37), wavN = noise1(53);
  const CHECK = (c = '#161615', s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON = {
    back: '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="#ddd" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    more: '<svg width="18" height="18" viewBox="0 0 24 24"><g fill="#ddd"><circle cx="6" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/></g></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#ddd" stroke-width="2.2" stroke-linecap="round"/></svg>',
    bell: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0" fill="#ddd"/></svg>',
    people: '<svg width="17" height="17" viewBox="0 0 24 24"><g fill="#ddd"><circle cx="9" cy="9" r="3.2"/><circle cx="16" cy="9.5" r="2.6"/><path d="M3 18c0-3 3-5 6-5s6 2 6 5zM14 18c0-2 1-3.5 3-4 2.5 0 4 1.6 4 4z"/></g></svg>',
    mic: (c) => `<svg width="16" height="18" viewBox="0 0 24 28"><rect x="8" y="2" width="8" height="15" rx="4" fill="${c}"/><path d="M4 13a8 8 0 0016 0M12 21v5" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    up: (c) => `<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    stop: '<span style="width:11px;height:11px;border-radius:2px;background:#161615"></span>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#ddd" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="#ddd" stroke-width="2" stroke-linecap="round"/></svg>',
    brain: '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 003 3h1V4zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-3 3h-1V4z" fill="none" stroke="#ddd" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    file: '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z" fill="none" stroke="#bbb" stroke-width="2" stroke-linejoin="round"/></svg>',
    shield: (c) => `<svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" fill="${c}"/><path d="M8.5 12.5l2.5 2.5 4.5-5" fill="none" stroke="#0b2b20" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    status: '<svg width="70" height="14" viewBox="0 0 70 14"><g fill="#f2f2f2"><rect x="0" y="9" width="3" height="4" rx="1"/><rect x="5" y="6" width="3" height="7" rx="1"/><rect x="10" y="3" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="13" rx="1"/><path d="M29 4.5a10 10 0 0114 0l-1.6 1.6a7.7 7.7 0 00-10.8 0zM32.2 7.7a5.5 5.5 0 017.6 0L36 11.5z"/><rect x="47" y="1" width="20" height="11" rx="3" fill="none" stroke="#f2f2f2" stroke-opacity=".5"/><rect x="49" y="3" width="15" height="7" rx="1.5"/><rect x="68" y="4.5" width="1.6" height="4" rx=".8" fill-opacity=".5"/></g></svg>',
  };
  // app badges: simplified marks in each product's colours
  const APPS = [
    ['Gmail', '<svg viewBox="0 0 48 48" width="56" height="56"><path d="M6 14v22h8V22l10 7 10-7v14h8V14l-18 13z" fill="#fff"/><path d="M6 14l18 13 18-13" fill="none" stroke="#ea4335" stroke-width="5" stroke-linejoin="round"/><path d="M6 14v22h8V22" fill="#4285f4"/><path d="M42 14v22h-8V22" fill="#34a853"/><path d="M34 22v14" stroke="#34a853" stroke-width="0"/></svg>'],
    ['Sheets', '<svg viewBox="0 0 48 48" width="56" height="56"><path d="M12 5h17l9 9v29H12z" fill="#1fa463"/><path d="M29 5v9h9" fill="#8ed1b1"/><rect x="17" y="22" width="16" height="14" fill="#fff"/><path d="M17 27h16M17 31h16M23 22v14" stroke="#1fa463" stroke-width="1.6"/></svg>'],
    ['Slack', '<svg viewBox="0 0 48 48" width="56" height="56"><g stroke-width="7" stroke-linecap="round"><path d="M19 8v15" stroke="#36c5f0"/><path d="M8 29h15" stroke="#2eb67d"/><path d="M29 40V25" stroke="#ecb22e"/><path d="M40 19H25" stroke="#e01e5a"/></g></svg>'],
    ['Notion', '<svg viewBox="0 0 48 48" width="56" height="56"><rect x="8" y="7" width="32" height="34" rx="5" fill="#fff"/><path d="M17 33V16l14 17V16" fill="none" stroke="#111" stroke-width="3.6" stroke-linejoin="round"/></svg>'],
    ['Greenhouse', '<svg viewBox="0 0 48 48" width="56" height="56"><circle cx="24" cy="31" r="9" fill="none" stroke="#24a47f" stroke-width="5"/><path d="M24 22c0-6 2-10 7-13" fill="none" stroke="#24a47f" stroke-width="4" stroke-linecap="round"/><circle cx="31" cy="9" r="3.4" fill="#24a47f"/></svg>'],
  ];

  // ------------------------------------------------------------------ phone geometry
  const PW = 436, PH = 904, INSET = 16, SW = PW - 2 * INSET, SH = PH - 2 * INSET;
  const PS = pick(1.08, 0.95, 1.15);
  const PCX = pick(1380, W * 0.66, W / 2), PCY = pick(H / 2 + 6, H / 2 + 40, 985);
  const MS = pick(380, 340, 500), MCX = PCX, MCY = pick(PCY - 40, PCY - 40, 640);
  function pose(t) {
    const out = sp(t, 'collapse', 'heavy');
    return {
      x: 10 * drift(t * 0.35) * (1 - out) + (MCX - PCX) * out,
      y: 7 * drift2(t * 0.5) * (1 - out) + (MCY - PCY) * out,
      r: 0.7 * drift3(t * 0.4) * (1 - out),
      s: PS * (1 - 0.67 * out),
    };
  }
  function P(t, sx, sy) {
    const p = pose(t), a = (p.r * Math.PI) / 180;
    const vx = (INSET + sx - PW / 2) * p.s, vy = (INSET + sy - PH / 2) * p.s;
    return [PCX + p.x + vx * Math.cos(a) - vy * Math.sin(a), PCY + p.y + vx * Math.sin(a) + vy * Math.cos(a)];
  }
  const CMP_H = 50, CMP_B = 30;
  const PROMPT = 'Find 15 senior infra engineers in the Bay Area, skip anyone in Greenhouse, rank the top 5 in Sheets, and draft Gmail outreach.';
  const WORDS = PROMPT.split(' ');
  // 3D float transform: 2D placement + spring-driven rotateX / rotateY / translateZ inside the float layer's perspective
  const tf3 = (x, y, s, rx, ry, z, r = 0) => `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) translateZ(${z.toFixed(2)}px) scale(${s.toFixed(4)})`;

  // stage positions for the hook orbit and the app badges (per format)
  const ORBIT = pick([[1010, 200], [930, 450], [1000, 700], [1770, 260], [1790, 560]], [[600, 200], [540, 450], [600, 700], [1220, 260], [1240, 560]],
    [[160, 650], [130, 910], [160, 1170], [905, 720], [910, 1010]]);
  const BADGE = pick([[1040, 300], [1020, 640], [1730, 230], [1750, 540], [1720, 850]], [[600, 300], [590, 620], [1180, 250], [1200, 560], [1180, 860]],
    [[150, 760], [140, 1110], [930, 700], [940, 1020], [920, 1340]]);

  // ================================================================ the product story: one scene, one phone
  scene({
    name: 'story', from: 's1', to: 61,
    build(root, S) {
      S.cam = el('div', { class: 'a', style: `width:${W}px;height:${H}px;transform-origin:50% 50%` }, root); reg(S.cam);
      const cam = S.cam;
      el('div', { class: 'a', style: `left:${PCX - 700}px;top:${PCY - 600}px;width:1400px;height:1200px;background:radial-gradient(closest-side, rgba(255,250,235,.045), rgba(255,250,235,0))` }, cam);

      // ---- headlines: outside the camera; 9:16 gets a scrim when the camera is close
      const HS = pick(108, 100, 92), HX = PAD, HY = pick(H / 2 - HS * 1.05, 230, 290);
      S.HX = HX; S.HY = HY;
      S.scrim = reg(el('div', { class: 'a', style: `width:${W}px;height:${HY + HS * 2 + 90}px;background:linear-gradient(#161615 0%, #161615 ${Math.round(((HY + HS * 2 + 30) / (HY + HS * 2 + 90)) * 100)}%, rgba(22,22,21,0) 100%)` }, root), { o: 0 });
      S.hl = el('div', { class: 'a', style: `width:${W}px;height:${H}px` }, root);
      const head = (a, b, acc, size = HS) => [line(S.hl, a, { x: HX, y: HY + (HS - size), size }), line(S.hl, b, { x: HX, y: HY + (HS - size) + size * 0.98, size, accent: acc })];
      S.H = {
        hook: head('Give AI', 'real work.', [0, 1]),
        team: head('Meet your', 'teammates.', [0]),
        chat: head('Message Bots', 'like teammates.', [1]),
        cloud: head('A cloud computer', 'of their own.', [3], pick(100, 92, 84)),
        team2: head('They team up and', 'hand off work.', [2], pick(100, 92, 84)),
        ok: head('Nothing ships', 'without your OK.', [2]),
        mem: head('Remembers how you work.', 'Runs on schedule.', [0, 1, 2], pick(68, 64, 72)),
      };

      // ---- phone
      S.phone = el('div', { class: 'a', style: `left:${PCX - PW / 2}px;top:${PCY - PH / 2}px;width:${PW}px;height:${PH}px;transform-origin:50% 50%` }, cam);
      reg(S.phone);
      const ph = S.phone;
      el('div', { class: 'a', style: `left:30px;top:${PH - 40}px;width:${PW - 60}px;height:80px;border-radius:50%;background:rgba(0,0,0,.75);filter:blur(28px)` }, ph);
      [[-3, 170, 46], [-3, 240, 72], [-3, 324, 72], [PW - 1, 260, 104]].forEach(([x, y, h]) =>
        el('div', { class: 'a', style: `left:${x}px;top:${y}px;width:4px;height:${h}px;border-radius:2px;background:linear-gradient(90deg,#2a2a2c,#6a6a6e,#2a2a2c)` }, ph));
      el('div', { class: 'a', style: `width:${PW}px;height:${PH}px;border-radius:72px;background:linear-gradient(140deg,#6b6b70 0%,#2a2a2d 18%,#1b1b1d 50%,#2c2c2f 82%,#77777c 100%);box-shadow:0 70px 120px -30px rgba(0,0,0,.85),0 30px 50px -20px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,255,255,.12)` }, ph);
      el('div', { class: 'a', style: `left:5px;top:5px;width:${PW - 10}px;height:${PH - 10}px;border-radius:67px;background:#050505` }, ph);
      S.screen = el('div', { class: 'a app', style: `left:${INSET}px;top:${INSET}px;width:${SW}px;height:${SH}px;border-radius:56px;overflow:hidden;background:${BG}` }, ph);
      const scr = S.screen;

      // ================= home: banner, five teammates, live chat list
      S.vHome = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:${BG}` }, scr));
      const vh = S.vHome;
      el('div', { class: 'circ', style: 'left:16px;top:64px;width:34px;height:34px;background:#cdb8ff;border:none' }, vh,
        '<svg width="18" height="12" viewBox="0 0 18 12"><circle cx="5" cy="6" r="2" fill="#4b2a99"/><circle cx="13" cy="6" r="2" fill="#4b2a99"/></svg>');
      el('div', { class: 'a', style: `left:0;top:68px;width:${SW}px;text-align:center;font-size:18px;font-weight:700` }, vh, 'Krafty');
      [[SW - 128, ICON.bell], [SW - 88, ICON.people], [SW - 48, ICON.plus]].forEach(([x, ic]) => el('div', { class: 'circ', style: `left:${x}px;top:64px;width:34px;height:34px` }, vh, ic));
      // the overnight-routine notification (the hook)
      S.banner = reg(el('div', { class: 'a glass', style: `left:12px;top:110px;width:${SW - 24}px;padding:12px 14px;border-radius:22px;transform-origin:50% 0` }, vh,
        `<div style="display:flex;align-items:center;gap:8px"><span style="width:22px;height:22px;border-radius:6px;background:#faf4e6;display:flex;align-items:center;justify-content:center"><svg width="14" height="9" viewBox="0 0 18 12"><circle cx="6" cy="6" r="2.2" fill="#1a1a1a"/><circle cx="12" cy="6" r="2.2" fill="#1a1a1a"/></svg></span>
          <span class="tag" style="background:rgba(52,211,153,.16);color:${GREEN}">8:00 AM Routine · Completed Overnight</span></div>
         <div style="font-size:15px;line-height:1.38;margin-top:8px"><b>Sales Outbound:</b> 36 accounts researched, 10 ranked in Sheets, 4 Gmail drafts waiting for your OK.</div>`));
      const TOPY = 236, TS = 50;
      S.top = FIVE.map((k, i) => {
        const cx = 40 + i * ((SW - 80) / 4);
        const av = bot(vh, k, TS, cx - TS / 2, TOPY, false);
        el('div', { class: 'a mut', style: `left:${cx - 50}px;top:${TOPY + TS + 8}px;width:100px;text-align:center;font-size:12px;font-weight:600` }, vh, BOTS[k].name);
        return { k, cx, av: reg(av) };
      });
      const LIST = [
        ['talent', 'now', 'Sourcing Bay Area infra engineers…', 'Working'],
        ['health', '7:42 AM', '3 accounts need a check-in this week.', ''],
        ['bug', '7:10 AM', 'Reproduced the checkout bug on staging.', 'Done'],
        ['chief', '6:55 AM', 'Your week is planned and on your calendar.', 'Done'],
        ['sales', '6:30 AM', '4 Gmail drafts waiting for your OK.', 'Needs OK'],
      ];
      const LY0 = 330, LH = 82, LS = 50;
      S.list = LIST.map(([k, tm, msg, st], i) => {
        const r = el('div', { class: 'a', style: `left:0;top:${LY0 + i * LH}px;width:${SW}px;height:${LH}px` }, vh);
        bot(r, k, LS, 14, 14, false);
        const tagc = st === 'Working' ? `background:rgba(255,255,255,.08);color:#ddd` : st === 'Done' ? `background:rgba(52,211,153,.14);color:${GREEN}` : `background:rgba(127,66,239,.22);color:#c9b0ff`;
        el('div', { class: 'a', style: `left:76px;top:15px;width:${SW - 92}px` }, r,
          `<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:16px;font-weight:700">${BOTS[k].name}</span>${st ? `<span class="tag" style="${tagc}">${st}</span>` : `<span class="mut" style="font-size:12px">${tm}</span>`}</div>
           <div class="mut ell" style="font-size:14px;margin-top:4px">${msg}</div>`);
        return reg(r, { o: 0 });
      });

      // ================= chat thread factory
      const mkThread = (parent, top) => {
        const vp = reg(el('div', { class: 'a', style: `left:0;top:${top}px;width:${SW}px;height:500px;overflow:hidden` }, parent));
        const th = el('div', { class: 'a', style: `left:0;bottom:0;top:auto;width:${SW}px;display:flex;flex-direction:column;padding:0 12px 6px` }, vp);
        return { vp, th };
      };
      const mkSlot = (th) => (html, user = false) => {
        const sl = el('div', { style: 'flex:none;overflow:visible;height:0px;position:relative' }, th);
        const it = el('div', { style: `display:flex;justify-content:${user ? 'flex-end' : 'flex-start'};padding-top:9px` }, sl, html);
        return { sl: reg(sl), it: reg(it, { o: 0 }), user };
      };
      const tool = (slot, title, body, icon = '') => {
        const s = slot(`<div class="cardx" style="width:${SW - 24}px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px;font-weight:700;display:flex;gap:6px;align-items:center">${icon}${title}</b><span data-st style="font-size:12px"></span></div>
          <div class="ell" style="margin-top:7px;padding:7px 9px;border-radius:9px;background:#1c1c1c;font-size:13px">${body}</div></div>`);
        s.st = reg(s.it.querySelector('[data-st]'));
        return s;
      };
      const header = (parent, inner) => {
        el('div', { class: 'a', style: `width:${SW}px;height:104px;background:linear-gradient(${BG} 72%, rgba(26,26,26,0))` }, parent);
        el('div', { class: 'circ', style: 'left:14px;top:56px;width:38px;height:38px' }, parent, ICON.back);
        const hp = el('div', { class: 'pill', style: `left:62px;top:56px;width:${SW - 124}px;height:38px;justify-content:center;gap:7px;background:#232323;border:1px solid #333;font-size:14px;font-weight:600` }, parent, inner);
        el('div', { class: 'circ', style: `left:${SW - 52}px;top:56px;width:38px;height:38px` }, parent, ICON.more);
        return hp;
      };
      const stack = (keys, size) => `<span style="position:relative;display:inline-block;width:${size + (keys.length - 1) * size * 0.62}px;height:${size}px">${keys.map((k, i) => `<span style="position:absolute;left:${i * size * 0.62}px;top:0">${botHTML(k, size)}</span>`).join('')}</span>`;

      // ================= chat with Talent Scout + Analyst (scenes 2–3)
      S.vChat = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:${BG};box-shadow:-30px 0 60px rgba(0,0,0,.5)` }, scr));
      const vc = S.vChat;
      S.T1 = mkThread(vc, 100);
      const slot1 = mkSlot(S.T1.th);
      const groupMsg = (slot, key, html) => slot(`<div style="display:flex;gap:7px;align-items:flex-end;max-width:${SW - 30}px">${botHTML(key, 26)}<div><div class="mut" style="font-size:11px;margin:0 0 3px 4px">${BOTS[key].name}</div>${html}</div></div>`);
      S.c = {
        x0: slot1('<div class="mut" style="width:100%;text-align:center;font-size:12px">Yesterday 5:40 PM</div>'),
        x1: slot1('<div class="ubub" style="max-width:280px">Can you run hiring for the infra team this quarter?</div>', true),
        x2: groupMsg(slot1, 'talent', '<div class="bub" style="max-width:290px">Yes. I’ll source, keep Greenhouse in sync, and check with you before any outreach.</div>'),
        x3: groupMsg(slot1, 'analyst', '<div class="bub" style="max-width:290px">I’ll score candidates against the role and keep the ranking in Sheets.</div>'),
        d0: slot1('<div class="mut" style="width:100%;text-align:center;font-size:12px">Today 8:02 AM</div>'),
        h0: groupMsg(slot1, 'talent', '<div class="bub">Morning — I’ve got the hiring pipeline. What should we go after first?</div>'),
        m1: slot1(`<div class="ubub" style="max-width:300px">${PROMPT}</div>`, true),
        t1: tool(slot1, 'Found app tools', 'Gmail · Google Sheets · Slack · Notion · Greenhouse'),
        t2: tool(slot1, 'Using shared cloud computer', 'app.greenhouse.io/candidates'),
        t3: tool(slot1, 'Saved file', '~/workspace/talent-pipeline/bay-area-infra-top5.csv', ICON.file),
      };
      header(vc, `${stack(['talent', 'analyst'], 22)}<span>Talent Scout + Analyst</span>`);
      // status row
      S.status = reg(el('div', { class: 'a', style: 'left:16px;display:flex;gap:8px;align-items:center;font-size:13px;color:#9a9a9a' }, vc), { o: 0 });
      inlineBot(S.status, 'talent', 18);
      S.stText = reg(el('span', {}, S.status, 'Thinking…'));
      // composer: + | field (dictated words land here) | waveform | mic → send
      S.cmp = reg(el('div', { class: 'a', style: `left:0;width:${SW}px;height:${CMP_H}px` }, vc));
      el('div', { class: 'circ', style: `left:12px;bottom:0;width:${CMP_H}px;height:${CMP_H}px` }, S.cmp, ICON.plus);
      S.field = reg(el('div', { class: 'a', style: `left:${CMP_H + 20}px;top:auto;bottom:0;width:${SW - CMP_H - 32}px;min-height:${CMP_H}px;border-radius:25px;border:1px solid #333;background:#1f1f1f;padding:13px 50px 13px 16px;font-size:15px;line-height:22px;overflow:hidden` }, S.cmp));
      S.ph = reg(el('span', { class: 'mut' }, S.field, 'Message Talent Scout…'));
      S.words = WORDS.map((w) => reg(el('span', { style: 'display:inline-block;margin-right:4px;transform-origin:0 100%' }, S.field, w), { o: 0 }));
      // listening pill above the composer: 12 reactive bars + label (the dictated words land in the field below)
      S.wave = reg(el('div', { class: 'pill', style: `left:auto;right:12px;top:auto;bottom:${CMP_H + 10}px;height:40px;padding:0 14px;gap:4px;background:rgba(127,66,239,.18);border:1px solid rgba(127,66,239,.5);transform-origin:100% 100%` }, S.cmp), { o: 0 });
      el('span', { style: 'font:600 13px system-ui;color:#d9c8ff;margin-right:8px' }, S.wave, 'Listening…');
      S.bars = Array.from({ length: 12 }, () => reg(el('i', { style: `display:block;width:4px;height:22px;border-radius:2px;background:#b18cff;transform-origin:50% 50%` }, S.wave)));
      S.mic = reg(el('div', { class: 'circ', style: `left:auto;right:7px;top:auto;bottom:7px;width:34px;height:34px;background:#2e2e2e;border:none;transform-origin:50% 50%` }, S.field, ICON.mic('#ddd')));
      S.micOn = reg(el('div', { class: 'circ', style: `left:auto;right:7px;top:auto;bottom:7px;width:34px;height:34px;background:${PURPLE};border:none;transform-origin:50% 50%` }, S.field, ICON.mic('#fff')), { o: 0 });
      S.sendB = reg(el('div', { class: 'circ', style: `left:auto;right:7px;top:auto;bottom:7px;width:34px;height:34px;background:#f2f2f2;border:none;transform-origin:50% 50%` }, S.field, ICON.up('#161615')), { o: 0 });

      // ================= group chat: Hiring Launch Team (scenes 4–6)
      S.vGroup = reg(el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;background:${BG};box-shadow:-30px 0 60px rgba(0,0,0,.5)` }, scr));
      const vg = S.vGroup;
      S.T2 = mkThread(vg, 100);
      const slot2 = mkSlot(S.T2.th);
      S.g = {
        z0: slot2('<div class="mut" style="width:100%;text-align:center;font-size:12px">Monday 9:14 AM</div>'),
        z1: slot2('<div class="ubub" style="max-width:290px">Make a team for the infra hire: sourcing, scoring and outreach.</div>', true),
        z2: groupMsg(slot2, 'talent', '<div class="bub" style="max-width:290px">Done. I’ll lead sourcing and hand off to the team as each step finishes.</div>'),
        y0: slot2('<div class="mut" style="width:100%;text-align:center;font-size:12px">Hiring Launch Team created</div>'),
        y2: groupMsg(slot2, 'analyst', '<div class="bub" style="max-width:290px">Joined. I’ll score and rank the shortlist in Sheets.</div>'),
        y1: groupMsg(slot2, 'mailmate', '<div class="bub" style="max-width:290px">Joined. I’ll write outreach in your voice once the shortlist is ready.</div>'),
        u0: slot2(`<div class="ubub" style="max-width:300px">${PROMPT}</div>`, true),
        s0: slot2('<div class="mut" style="width:100%;text-align:center;font-size:12px">Talent Scout added Analyst and Mailmate</div>'),
        h1: groupMsg(slot2, 'talent', `<div class="bub" style="max-width:290px">15 candidates sourced, 4 skipped (already in Greenhouse). Handing off to <b style="color:#c9b0ff">@Analyst</b> to score &amp; rank.</div>`),
        h2: groupMsg(slot2, 'analyst', `<div class="cardx" style="width:${SW - 60}px;padding:10px 11px">
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700"><span style="display:inline-flex">${APPS[1][1].replace(/width="56" height="56"/, 'width="16" height="16"')}</span>Google Sheets · Bay Area Infra Ranking</div>
            ${[['Maya Chen', 96, 'Top match'], ['Daniel Okafor', 94, 'Strong'], ['Priya Raman', 91, 'Strong']].map(([n, s, tg], i) => `<div style="display:flex;align-items:center;gap:8px;margin-top:${i ? 5 : 9}px;padding:6px 8px;border-radius:8px;background:#1c1c1c;font-size:13px"><span class="mut" style="width:12px">${i + 1}</span><span style="flex:1">${n}</span><b class="ok" style="width:36px">${s}%</b><span class="tag" style="${i ? 'background:rgba(255,255,255,.07);color:#ccc' : `background:rgba(52,211,153,.16);color:${GREEN}`}">${tg}</span></div>`).join('')}
          </div>`),
        h3: groupMsg(slot2, 'mailmate', '<div class="bub" style="max-width:290px">Drafted 5 personalized emails in your voice and matched 3 open slots from Google Calendar.</div>'),
        ap: slot2(`<div class="cardx" style="width:${SW - 24}px;display:flex;gap:9px;align-items:center">${APPS[0][1].replace(/width="56" height="56"/, 'width="22" height="22"')}<div style="flex:1"><div style="font-size:13.5px;font-weight:700">Gmail + Calendar</div><div class="mut" style="font-size:12px;margin-top:2px">5 emails sent · 3 calendar holds placed</div></div><span class="tag" style="background:rgba(52,211,153,.16);color:${GREEN}">${CHECK(GREEN, 10)} Approved</span></div>`),
        mm: slot2(`<div class="cardx" style="width:${SW - 24}px;display:flex;gap:10px;align-items:flex-start"><span style="width:34px;height:34px;flex:none;border-radius:10px;background:#2c2c2c;display:flex;align-items:center;justify-content:center">${ICON.brain}</span>
            <div><div style="font-size:12px;font-weight:700;color:#c9b0ff">Saved to Bot Memory</div><div style="font-size:13.5px;line-height:1.36;margin-top:3px">Always skip candidates contacted in the last 90 days and lead outreach with recent GitHub work.</div></div></div>`),
        rt: slot2(`<div class="cardx" style="width:${SW - 24}px;display:flex;gap:10px;align-items:center"><span style="width:34px;height:34px;flex:none;border-radius:10px;background:#2c2c2c;display:flex;align-items:center;justify-content:center">${ICON.clock}</span>
            <div style="flex:1"><div style="font-size:14px;font-weight:700">Routine Active · Every Monday at 8:00 AM</div><div class="mut" style="font-size:12.5px;margin-top:3px">Keeps running even after you close Krafty.</div></div>
            <span data-tg style="position:relative;width:46px;height:28px;flex:none;border-radius:14px;background:#3a3a3a"><span data-tgon style="position:absolute;inset:0;border-radius:14px;background:${GREEN}"></span><span data-knob style="position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:11px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.4)"></span></span></div>`),
      };
      S.tgOn = reg(S.g.rt.it.querySelector('[data-tgon]'), { o: 0 });
      S.knob = reg(S.g.rt.it.querySelector('[data-knob]'));
      S.tg = reg(S.g.rt.it.querySelector('[data-tg]'));
      header(vg, `${stack(['talent', 'analyst', 'mailmate'], 22)}<span>Hiring Launch Team · 3 Bots</span>`);

      // status bar + island + glass sheen
      el('div', { class: 'a', style: 'left:40px;top:17px;font-size:17px;font-weight:600;width:60px;text-align:center' }, scr, '8:02');
      el('div', { class: 'a', style: `left:${SW - 104}px;top:21px` }, scr, ICON.status);
      el('div', { class: 'a', style: `left:${SW / 2 - 62}px;top:11px;width:124px;height:36px;border-radius:20px;background:#000` }, scr);
      el('div', { class: 'a', style: `width:${SW}px;height:${SH}px;border-radius:56px;background:linear-gradient(118deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,.03) 100%)` }, scr);

      // ================= the 3D float layer (in front of the phone)
      S.float = el('div', { class: 'a', style: `width:${W}px;height:${H}px;perspective:1600px;perspective-origin:${PCX}px ${PCY}px` }, cam);
      const fl = S.float;
      // orbiting teammates (scene 1)
      S.orbit = FIVE.map((k, i) => ({ k, i, b: reg(bot(fl, k, pick(110, 96, 100), 0, 0), { o: 0 }) }));
      // data lines + app badges (scene 2)
      S.lines = el('div', { class: 'a' }, fl, `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;overflow:visible"></svg>`).firstChild;
      S.lns = APPS.map(() => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'rgba(52,211,153,.55)'); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-dasharray', '6 8'); S.lines.appendChild(p); return reg(p, { o: 0 }); });
      S.badges = APPS.map(([name, svg]) => {
        const bd = el('div', { class: 'a glass', style: `width:116px;height:116px;margin:-58px 0 0 -58px;border-radius:30px;display:flex;align-items:center;justify-content:center;flex-direction:column;transform-origin:50% 50%` }, fl, svg);
        const pillx = reg(el('div', { class: 'pill', style: `left:50%;top:124px;transform-origin:50% 0;height:26px;padding:0 10px;margin-left:-64px;width:128px;justify-content:center;gap:5px;background:rgba(20,40,32,.9);border:1px solid rgba(52,211,153,.4);font:600 12px system-ui;color:${GREEN}` }, bd,
          `${CHECK(GREEN, 11)}Connected · Done`), { o: 0 });
        el('div', { class: 'a', style: 'left:0;top:-26px;width:116px;text-align:center;font:600 15px system-ui;color:#ddd' }, bd, name);
        return { bd: reg(bd, { o: 0 }), pill: pillx };
      });
      // cloud computer PIP browser (scene 3)
      const PIPW = pick(640, 600, 760), PIPH = pick(430, 400, 500);
      S.PIPW = PIPW; S.PIPH = PIPH;
      S.pip = reg(el('div', { class: 'a app', style: `width:${PIPW}px;height:${PIPH}px;margin:${-PIPH / 2}px 0 0 ${-PIPW / 2}px;border-radius:18px;overflow:hidden;background:#141414;border:1px solid rgba(255,255,255,.12);box-shadow:0 50px 100px -20px rgba(0,0,0,.85),0 20px 40px -10px rgba(0,0,0,.6);transform-origin:50% 50%` }, fl), { o: 0 });
      const pip = S.pip;
      el('div', { class: 'a glass', style: `width:${PIPW}px;height:44px;border-radius:0;border:none;border-bottom:1px solid rgba(255,255,255,.08)` }, pip,
        `<div style="position:absolute;left:16px;top:16px;display:flex;gap:7px"><i style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></i><i style="width:12px;height:12px;border-radius:50%;background:#febc2e"></i><i style="width:12px;height:12px;border-radius:50%;background:#28c840"></i></div>
         <div style="position:absolute;left:${PIPW / 2 - 150}px;top:9px;width:300px;height:26px;border-radius:8px;background:#0e0e0e;font-size:13px;line-height:26px;text-align:center;color:#bbb">🔒 app.greenhouse.io/candidates</div>`);
      // filters
      const FILT = ['Bay Area', 'Senior · Infra', 'Not in pipeline'];
      el('div', { class: 'a mut', style: 'left:18px;top:62px;font-size:12px;font-weight:700;letter-spacing:.04em' }, pip, 'FILTERS');
      S.fChk = FILT.map((f, i) => {
        el('div', { class: 'a', style: `left:18px;top:${88 + i * 34}px;display:flex;gap:9px;align-items:center;font-size:14px` }, pip, `<span style="width:18px;height:18px;border-radius:5px;border:1.5px solid #555"></span>${f}`);
        return reg(el('div', { class: 'a', style: `left:18px;top:${88 + i * 34}px;width:18px;height:18px;border-radius:5px;background:${GREEN};display:flex;align-items:center;justify-content:center;transform-origin:50% 50%` }, pip, CHECK('#0b2b20', 12)), { o: 0 });
      });
      // candidates
      const CANDS = [['MC', 'Maya Chen', 'Staff Infra Engineer · SF'], ['DO', 'Daniel Okafor', 'Senior SRE · Oakland'], ['PR', 'Priya Raman', 'Distributed Systems · San Jose'], ['JL', 'Jordan Lee', 'Platform Engineer · SF'], ['SK', 'Sam Kim', 'Infra Lead · Palo Alto']];
      const LX = pick(190, 180, 220), RH = pick(62, 58, 74);
      el('div', { class: 'a mut', style: `left:${LX}px;top:62px;font-size:12px;font-weight:700;letter-spacing:.04em` }, pip, 'CANDIDATES · 15');
      S.rowHL = reg(el('div', { class: 'a', style: `left:${LX - 8}px;top:84px;width:${PIPW - LX - 12}px;height:${RH - 6}px;border-radius:10px;background:rgba(255,255,255,.07)` }, pip), { o: 0 });
      S.cands = CANDS.map(([ini, n, r], i) => reg(el('div', { class: 'a', style: `left:${LX}px;top:${88 + i * RH}px;display:flex;gap:10px;align-items:center` }, pip,
        `<span style="width:34px;height:34px;border-radius:50%;background:#2a2a2a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#ccc">${ini}</span><span><div style="font-size:14px;font-weight:600">${n}</div><div class="mut" style="font-size:12px">${r}</div></span>`), { o: 0 }));
      S.RH = RH; S.LX = LX;
      // profile panel
      S.prof = reg(el('div', { class: 'a', style: `left:${PIPW - pick(250, 240, 300)}px;top:44px;width:${pick(250, 240, 300)}px;height:${PIPH - 44}px;background:#1b1b1b;border-left:1px solid #2c2c2c;padding:18px` }, pip,
        `<div style="display:flex;gap:10px;align-items:center"><span style="width:44px;height:44px;border-radius:50%;background:#2f2f2f;display:flex;align-items:center;justify-content:center;font-weight:700;color:#ddd">DO</span><div><div style="font-size:15px;font-weight:700">Daniel Okafor</div><div class="mut" style="font-size:12px">Senior SRE · Oakland</div></div></div>
         <div style="margin-top:14px;font-size:13px;line-height:1.5"><div><span class="mut">Experience</span> · 9 yrs distributed systems</div><div><span class="mut">GitHub</span> · 1.2k contributions this year</div><div><span class="mut">Pipeline</span> · <span class="ok">Not contacted</span></div></div>
         <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px"><span class="tag" style="background:#2a2a2a;color:#ddd">Kubernetes</span><span class="tag" style="background:#2a2a2a;color:#ddd">Go</span><span class="tag" style="background:#2a2a2a;color:#ddd">Postgres</span></div>`), { o: 0 });
      // automated mouse pointer
      S.ptr = reg(el('div', { class: 'a', style: 'width:22px;height:26px' }, pip,
        '<svg width="22" height="26" viewBox="0 0 22 26"><path d="M2 1.5v19.2l5.2-4.8 3.4 7.6 3.3-1.5-3.4-7.4h7.1z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'));
      // visual safety check: scanning frame + badge
      S.scan = reg(el('div', { class: 'a', style: `left:6px;top:50px;width:${PIPW - 12}px;height:${PIPH - 56}px;border-radius:12px;border:2px solid rgba(52,211,153,.75)` }, pip), { o: 0 });
      S.scanLine = reg(el('div', { class: 'a', style: `left:8px;top:52px;width:${PIPW - 16}px;height:3px;background:linear-gradient(90deg,rgba(52,211,153,0),rgba(52,211,153,.9),rgba(52,211,153,0))` }, pip), { o: 0 });
      S.safe = reg(el('div', { class: 'pill', style: `left:auto;right:14px;top:auto;bottom:14px;height:30px;padding:0 12px;gap:6px;background:rgba(14,40,30,.92);border:1px solid rgba(52,211,153,.5);font-size:12.5px;font-weight:700;color:${GREEN};transform-origin:100% 100%` }, pip,
        `${ICON.shield(GREEN)}<span data-sv>Visual Safety Check · Scanning</span>`), { o: 0 });
      S.safeTxt = reg(S.safe.querySelector('[data-sv]'));

      // approval card (scene 5): pops out of the thread to the float layer
      const AW = pick(470, 440, 520);
      S.AW = AW;
      S.appr = reg(el('div', { class: 'a app', style: `width:${AW}px;margin-left:${-AW / 2}px;margin-top:-140px;border-radius:24px;padding:18px 20px;background:#222224;border:1px solid rgba(255,255,255,.14);box-shadow:0 50px 100px -20px rgba(0,0,0,.8);transform-origin:50% 50%` }, fl,
        `<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;gap:8px;align-items:center;font-size:15px;font-weight:700">${APPS[0][1].replace(/width="56" height="56"/, 'width="22" height="22"')}Gmail + Calendar</span><span data-badge class="tag" style="position:relative;height:26px;overflow:hidden;padding:0;background:rgba(255,255,255,.08);font-size:13px"><span data-b0 style="position:absolute;right:10px;top:4px;white-space:nowrap;color:#ddd">Needs approval</span><span data-b1 style="position:absolute;right:10px;top:4px;white-space:nowrap;color:${GREEN}">✓ Approved · Sent via Gmail</span></span></div>
         <div style="margin-top:14px;font-size:14.5px;line-height:1.5">
           <div><span class="mut">Action</span>&nbsp; <b style="font-family:ui-monospace,Menlo,monospace;font-size:13px">GMAIL_SEND_EMAIL (5 drafts) + CALENDAR_HOLD</b></div>
           <div><span class="mut">To</span>&nbsp; alex@…, priya@… (+3 more)</div>
           <div><span class="mut">Subject</span>&nbsp; Quick note on your distributed systems work</div></div>
         <div data-row style="position:relative;height:46px;margin-top:16px;overflow:hidden">
           <span data-dis class="pill" style="left:auto;right:${pick(166, 160, 186)}px;top:0;height:44px;padding:0 18px;border:1px solid #444;font-size:15px;font-weight:600;transform-origin:50% 50%">Discard</span>
           <span data-ok class="pill" style="left:auto;right:0;top:0;height:44px;padding:0 20px;gap:7px;background:${GREEN};color:#06291c;font-size:15px;font-weight:800;transform-origin:50% 50%"><span data-okl style="display:flex;gap:7px;align-items:center">${CHECK('#06291c', 14)}Approve &amp; Send</span></span></div>
         <div data-sent style="height:0px;overflow:hidden">${['alex@…', 'priya@…', 'daniel@…', 'jordan@…', 'sam@…'].map((a, i) => `<div data-r${i} style="display:flex;justify-content:space-between;align-items:center;margin-top:7px;padding:7px 10px;border-radius:10px;background:#1c1c1c;font-size:14px"><span>${a}</span><span class="tag" style="background:rgba(52,211,153,.16);color:${GREEN}">✓ Sent</span></div>`).join('')}
           <div data-holds class="mut" style="font-size:13px;margin-top:9px">3 calendar holds placed · Thu, Fri, Mon</div></div>`), { o: 0 });
      S.aBadge = reg(S.appr.querySelector('[data-badge]'));
      S.aOk = reg(S.appr.querySelector('[data-ok]'));
      S.aDis = reg(S.appr.querySelector('[data-dis]'));
      S.aRow = reg(S.appr.querySelector('[data-row]'));
      S.b0 = reg(S.appr.querySelector('[data-b0]')); S.b1 = reg(S.appr.querySelector('[data-b1]'));
      S.sent = reg(S.appr.querySelector('[data-sent]'));
      S.holds = reg(S.appr.querySelector('[data-holds]'), { o: 0 });
      S.sentR = [0, 1, 2, 3, 4].map((i) => reg(S.appr.querySelector(`[data-r${i}]`), { o: 0 }));

      // ---- touch cursor
      S.cur = reg(el('div', { class: 'a', style: 'width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,255,255,.26);border:2px solid rgba(255,255,255,.85);box-shadow:0 6px 18px rgba(0,0,0,.45);transform-origin:50% 50%' }, root), { o: 0 });
      S.rip = reg(el('div', { class: 'a', style: 'width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;border:3px solid rgba(255,255,255,.9);transform-origin:50% 50%' }, root), { o: 0 });
    },

    run(t, b, S) {
      // ---- headlines (sequential swaps, sliver-free reveal)
      const HL = [['hook', 0, 3.2], ['team', 3.5, 7.8], ['chat', 8, 19.8], ['cloud', 20, 31.8], ['team2', 32, 39.8], ['ok', 40, 51.8], ['mem', 52, 59.4]];
      HL.forEach(([k, a, out]) => {
        const [l1, l2] = S.H[k];
        if (k === 'hook') { rise(t, l1, [-0.9, B('w2') - 0.22], out); rise(t, l2, [B('w3') - 0.22, B('w4') - 0.22], out); return; }
        rise(t, l1, a - 0.28, out, { stagger: 0.05, show: 0.52 });
        rise(t, l2, a + 0.07, out, { stagger: 0.05, show: 0.52 });
      });

      // ---- phone
      const p = pose(t);
      put(S.phone, { x: p.x, y: p.y, r: p.r, s: p.s, o: sp(t, 'mascot', 'playful') > 0.75 ? 0 : 1 });
      const pr = (m, d0 = 0.2, d1 = 0.08) => sp(t, B(m) - d0, 'snappy') - sp(t, B(m) + d1, 'snappy');

      // ================= scene 1: banner, pull back, teammates orbit, list builds
      const bn = spHit(t, -0.25, 'snappy');
      put(S.banner, { o: bn > 0.02 ? 1 : 0, y: -24 * (1 - bn), s: 0.94 + 0.06 * bn });
      S.list.forEach((r, i) => { const q = spHit(t, 3.4 + i * 0.25, 'default'); put(r, { o: clamp(q * 6), x: 22 * (1 - q) }); });
      S.orbit.forEach(({ k, i, b: e }) => {
        const T = S.top[i];
        const [hx, hy] = P(t, T.cx, 236 + 25);
        const out = sp(t, B('orbit') + i * 0.25, 'playful'), back = sp(t, B('back') + i * 0.08, 'default');
        const f = out * (1 - back);
        const [ox, oy] = ORBIT[i];
        const sz = pick(110, 96, 100), home = (50 * pose(t).s) / sz;
        const x = lerp(hx, ox, f) + 8 * drift(t * 0.9 + i * 5) * f, y = lerp(hy, oy, f) + 10 * drift2(t * 0.8 + i * 3) * f;
        const s = lerp(home, 1, f);
        put(e, { o: out > 0.003 && back < 0.995 ? 1 : 0, x: x - sz / 2, y: y - sz / 2, s, r: 6 * drift(t * 0.6 + i) * f });   // 2D: the bots carry their own shading, no compositor layer needed
        put(T.av, { o: out > 0.003 && back < 0.995 ? 0 : 1 });
      });

      // ---- navigation pushes
      const n1 = sp(t, 'nav1', 'default'), n2 = sp(t, 'nav2', 'default');
      put(S.vHome, { x: -SW * 0.3 * n1, hide: n1 > 0.999 });
      put(S.vChat, { x: SW * (1 - n1) - SW * 0.3 * n2, hide: n1 < 0.001 || n2 > 0.999 });
      put(S.vGroup, { x: SW * (1 - n2), hide: n2 < 0.001 });

      // ================= scene 2: voice prompt
      const micA = sp(t, B('tap_mic') - 0.05, 'snappy');
      const dictEnd = sp(t, 'dict1', 'snappy');
      const listening = b >= B('tap_mic') && b < B('dict1') + 0.3;
      const nW = WORDS.length;
      const a8 = spHit(t, B('msg1') - 0.16, 'snappy');
      const held = b < B('msg1') - 0.16 || a8 < 0.85;
      S.words.forEach((w, i) => {
        const wb = B('dict0') + (i / nW) * (B('dict1') - B('dict0'));
        const q = sp(t, wb, 'snappy');
        put(w, { o: held && q > 0.01 ? 1 : 0, y: 8 * (1 - q), s: 0.85 + 0.15 * q, css: { display: held && b >= wb - 0.02 ? 'inline-block' : 'none' } });
      });
      put(S.ph, { css: { display: b >= B('dict0') - 0.02 && held ? 'none' : 'inline' } });
      const wv = listening ? clamp(micA) * (1 - dictEnd) : 0;
      put(S.wave, { o: wv > 0.02 ? 1 : 0, s: 0.85 + 0.15 * clamp(wv) });
      S.bars.forEach((bar, i) => { const h = 0.25 + 0.75 * Math.abs(wavN(t * 9 + i * 1.7)) * (0.6 + 0.4 * Math.sin(t * 13 + i)); put(bar, { sy: Math.max(0.12, h * wv) }); });
      put(S.mic, { o: b < B('tap_mic') ? 1 : 0, s: 1 - 0.14 * pr('tap_mic') });
      put(S.micOn, { o: listening && b < B('dict1') ? 1 : 0, s: (0.85 + 0.15 * micA) * (1 + 0.06 * Math.sin(t * 18) * wv) });
      put(S.sendB, { o: b >= B('dict1') && held ? 1 : 0, s: (0.7 + 0.3 * dictEnd) * (1 - 0.14 * pr('tap_send')) });
      put(S.field, { css: { borderColor: listening || (b >= B('dict1') && held) ? PURPLE : '#333', minHeight: (!held ? lerp(116, CMP_H, sp(t, B('msg1') + 0.1, 'snappy')) : CMP_H).toFixed(2) + 'px' } });
      const fieldH = Math.max(CMP_H, S.field.offsetHeight);
      put(S.cmp, { y: Math.round(SH - CMP_B - CMP_H) });
      const ST = [['msg1', 'tools', 'Thinking…'], ['tools', 'tools_d', 'Working…'], ['pc_row', 'file_d', 'Working…']];
      const st = ST.find(([a, z]) => b >= B(a) + 0.6 && b < B(z));
      put(S.status, { o: st ? 1 : 0, y: SH - CMP_B - CMP_H - 30 });
      if (st) put(S.stText, { text: st[2] });
      put(S.T1.vp, { css: { height: (SH - CMP_B - CMP_H - 38 - 100).toFixed(1) + 'px' } });
      put(S.T2.vp, { css: { height: (SH - 40 - 100).toFixed(1) + 'px' } });

      // ---- thread slots (both threads)
      const ARR = { x0: [0, 'default'], x1: [0, 'default'], x2: [0, 'default'], x3: [0, 'default'], z0: [0, 'default'], z1: [0, 'default'], z2: [0, 'default'], y0: [0, 'default'], y1: [0, 'default'], y2: [0, 'default'], d0: [0, 'default'], h0: [0, 'default'], m1: ['msg1', 'snappy'], t1: ['tools', 'default'], t2: ['pc_row', 'default'], t3: ['file', 'default'],
        u0: [0, 'default'], s0: [0, 'default'], h1: ['h1', 'default'], h2: ['h2', 'default'], h3: ['h3', 'default'], ap: ['appr', 'default'], mm: ['mem', 'default'], rt: ['routine', 'default'] };
      const slots = { ...S.c, ...S.g };
      Object.entries(slots).forEach(([k, M]) => {
        const [m, pre] = ARR[k];
        const a = m === 0 ? 1 : spHit(t, B(m) - (pre === 'snappy' ? 0.16 : 0), pre);
        const h = M.it.offsetHeight;
        put(M.sl, { css: { height: (h * clamp(a, 0, 1.02)).toFixed(2) + 'px' } });
        put(M.it, { o: clamp(a * 5), y: (k === 'm1' ? 70 : 24) * (1 - a), s: 0.96 + 0.04 * a, css: { transformOrigin: M.user ? '100% 100%' : '0 100%' } });
      });
      [['t1', 'tools_d', 'Processing'], ['t2', 'file', 'Browser active'], ['t3', 'file_d', 'Saving']].forEach(([k, d, w]) => {
        const done = b >= B(d);
        put(S.c[k].st, { html: done ? `<span class="ok">● Done</span>` : k === 't2' ? `<span class="ok">● Browser active</span>` : `<span class="mut">${w}${'.'.repeat(1 + (Math.floor(b * 4) % 3))}</span>` });
      });

      // ---- app badges: orbit out of the tool row, data lines, then "Connected · Done", then back in
      const [tx, ty] = P(t, SW / 2, SH - CMP_B - CMP_H - 70);
      S.badges.forEach((Bd, i) => {
        const out = sp(t, B('app0') + i * 0.25, 'playful'), back = sp(t, B('apps_back') + i * 0.06, 'default');
        const f = out * (1 - back);
        const [bx, by] = BADGE[i];
        const x = lerp(tx, bx, f) + 6 * drift(t * 0.8 + i * 4) * f, y = lerp(ty, by, f) + 8 * drift3(t * 0.7 + i * 2) * f;
        const vis = out > 0.003 && back < 0.99;
        put(Bd.bd, { o: vis ? 1 : 0, css: { transform: tf3(x, y, 0.3 + 0.7 * f, 8 * Math.cos(i) * f, (bx < PCX ? 16 : -16) * f, 80 * f) } });
        const on = spHit(t, B('apps_on') + i * 0.08, 'snappy');
        put(Bd.pill, { o: on > 0.02 && vis ? 1 : 0, s: 0.7 + 0.3 * on });
        put(S.lns[i], { o: vis && f > 0.15 ? clamp((f - 0.15) * 2) * 0.9 : 0, css: { strokeDashoffset: (-t * 40).toFixed(1) } });
        S.lns[i].setAttribute('d', `M${tx.toFixed(1)} ${ty.toFixed(1)} Q ${((tx + x) / 2).toFixed(1)} ${(Math.min(ty, y) - 80).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`);
      });

      // ================= scene 3: the cloud computer browser
      const po = sp(t, 'pip', 'default'), pc = sp(t, 'pip_close', 'default');
      const pf = po * (1 - pc);
      const [cx3, cy3] = P(t, SW / 2, SH * 0.48);
      const [rx3, ry3] = P(t, SW / 2, SH - CMP_B - CMP_H - 70);
      const pipX = lerp(rx3, cx3 + pick(-60, -40, 0), pf), pipY = lerp(ry3, cy3 + pick(0, 0, 40), pf);
      put(S.pip, { o: po > 0.003 && pc < 0.99 ? 1 : 0, css: { transform: tf3(pipX, pipY, 0.25 + 0.75 * pf, 6 * (1 - pf) + 2.5 * drift(t * 0.5) * pf, -9 * pf + 2 * drift2(t * 0.4) * pf, 120 * pf) } });
      S.fChk.forEach((c, i) => { const q = spHit(t, `f${i + 1}`, 'snappy'); put(c, { o: q > 0.02 ? 1 : 0, s: 0.4 + 0.6 * q }); });
      S.cands.forEach((c, i) => { const q = spHit(t, B('pip') + 0.6 + i * 0.15, 'default'); put(c, { o: clamp(q * 6), x: 16 * (1 - q) }); });
      // pointer path: filters → rows → open row 2 (a track per move)
      const FX = 27, FY = (i) => 97 + i * 34, RX = S.LX + 120, RY = (i) => 105 + i * S.RH;
      const px = trk(t, [[0, S.PIPW * 0.6], [B('f1') - 0.45, FX], [B('rows0'), RX], [B('rows0') + 0.6, RX + 20], [B('rows1'), RX - 10]]);
      const py = trk(t, [[0, S.PIPH * 0.8], [B('f1') - 0.45, FY(0)], [B('f2') - 0.4, FY(1)], [B('f3') - 0.4, FY(2)], [B('rows0'), RY(0)], [B('rows0') + 0.6, RY(3)], [B('rows1'), RY(1)]]);
      const pclick = ['f1', 'f2', 'f3', 'profile'].reduce((a, m) => a + pr(m, 0.12, 0.06), 0);
      put(S.ptr, { x: px, y: py, s: 1 - 0.12 * pclick, o: b < B('pip') + 0.8 || b > B('verified') + 1 ? 0 : 1 });
      const rowI = clamp((py - 88) / S.RH, 0, 4);
      put(S.rowHL, { o: b >= B('rows0') - 0.2 && b < B('profile') + 2 ? 1 : 0, y: Math.round(rowI) * S.RH + (rowI - Math.round(rowI)) * 0 });
      const pfo = sp(t, 'profile', 'default');
      put(S.prof, { o: pfo > 0.01 ? 1 : 0, x: 260 * (1 - pfo) });
      const sc = seg(t, 'scan', 'verified');
      put(S.scan, { o: b >= B('scan') && b < B('verified') + 0.5 ? 0.5 + 0.5 * Math.cos(sc * Math.PI * 6) ** 2 : 0 });
      put(S.scanLine, { o: b >= B('scan') && b < B('verified') ? 1 : 0, y: sc * (S.PIPH - 60) });
      const sv = spHit(t, 'scan', 'snappy');
      put(S.safe, { o: sv > 0.02 ? 1 : 0, s: 0.8 + 0.2 * sv });
      put(S.safeTxt, { text: b >= B('verified') ? 'Visual Safety Check · Verified' : 'Visual Safety Check · Scanning' });

      // ================= scene 5: the approval card lifts out of the thread into the float layer
      const vpB = 100 + (SH - 40 - 100);
      const [ax0, ay0] = P(t, SW / 2, vpB - 6 - 80);
      const [ax1, ay1] = P(t, SW / 2, SH * 0.5);
      const lift = sp(t, B('appr') + 0.3, 'default'), settle = sp(t, 50.5, 'default');
      const lf = lift * (1 - settle);
      const ax = lerp(ax0, ax1 + pick(-30, -20, 0), lf), ay = lerp(ay0, ay1, lf);
      const as = lerp(pose(t).s * (SW - 24) / S.AW, pick(1.05, 1, 1.0), lf);
      put(S.appr, { o: spHit(t, 'appr', 'default') > 0.05 && settle < 0.995 ? 1 : 0, css: { transform: tf3(ax, ay, as, 8 * (1 - lf) + 2 * drift(t * 0.5) * lf, -7 * lf, 140 * lf) } });
      put(S.g.ap.it, { o: settle > 0.97 ? 1 : 0 });
      const hov = sp(t, 'hover_ok', 'snappy');
      const okP = pr('tap_ok', 0.2, 0.1);
      const appr = b >= B('approved');
      put(S.aOk, { s: 1 + 0.05 * hov * (appr ? 0 : 1) - 0.14 * okP, css: { boxShadow: `0 0 0 ${(5 * hov * (appr ? 0 : 1)).toFixed(1)}px rgba(52,211,153,.25)` } });
      const rowOut = sp(t, B('approved') + 0.25, 'default');
      const bOut = sp(t, B('approved') + 0.1, 'snappy');
      const bGo = sp(t, B('approved') + 0.05, 'default');   // buttons sink and shrink as the label leaves (~170 ms)
      put(S.aOk, { s: 1 - 0.15 * clamp(bGo), y: 10 * clamp(bGo), hide: bGo > 0.93 || rowOut > 0.3 });
      put(S.aDis, { s: 1 - 0.15 * clamp(bGo), y: 10 * clamp(bGo), hide: bGo > 0.93 || rowOut > 0.3 });   // gone before the closing edge reaches their labels
      put(S.aRow, { css: { height: lerp(46, 0, clamp(rowOut)).toFixed(2) + 'px', marginTop: lerp(16, 0, clamp(rowOut)).toFixed(2) + 'px' } });
      const bm = sp(t, B('approved') - 0.15, 'snappy');
      put(S.aBadge, { css: { width: lerp(122, 212, clamp(bm)).toFixed(1) + 'px', background: bm > 0.5 ? 'rgba(52,211,153,.16)' : 'rgba(255,255,255,.08)' } });
      put(S.b0, { y: -26 * clamp(bm), hide: bm > 0.98 });
      put(S.b1, { y: 26 * (1 - bm), hide: bm < 0.02 });
      // the body grows with its rows: each recipient adds its own height on its own spring
      let sh = 0;
      S.sentR.forEach((r, i) => { const q = spHit(t, B('approved') + 0.42 + i * 0.16, 'snappy'); sh += 41 * clamp(q); const c = sp(t, B('approved') + 0.42 + i * 0.16 + 0.12, 'snappy'); put(r, { o: q > 0.7 ? 1 : 0, y: 8 * (1 - c) }); });   // content shows once the row is 70 % open
      const hq = sp(t, B('approved') + 1.2, 'default');
      sh += 30 * clamp(hq);
      put(S.holds, { o: hq > 0.7 ? 1 : 0, y: 8 * (1 - sp(t, B('approved') + 1.32, 'snappy')) });
      put(S.sent, { css: { height: sh.toFixed(1) + 'px' } });

      // ================= scene 6: routine toggle
      const tg = sp(t, B('tap_tg') - 0.05, 'snappy');
      put(S.knob, { x: 18 * tg });
      put(S.tgOn, { o: tg > 0.5 ? 1 : 0 });
      put(S.tg, { s: 1 - 0.08 * pr('tap_tg') });

      // ---- touch cursor: arrives, presses, ripples, lifts
      // (the touch cursor is placed in after(), from the live position of the control it presses)

      // ---- camera: opens tight on the banner, pulls back on beat 3; close-ups between swaps
      const PU = pick(1.6, 1.45, 1.3);
      const Z0 = pick(2.3, 2.1, 2.0);
      const z = trk(t, [[0, Z0], [3, 1, 'heavy'], [8.6, PU], [13.9, 1], [21, pick(1.12, 1.1, 1.05)], [29.4, PU], [31.6, 1], [32.4, PU], [39.6, 1], [41.2, pick(1.45, 1.35, 1.25)], [45.0, pick(1.45, 1.4, 1.24)], [49.5, 1], [52.6, PU], [59, 1]]);
      const fyS = trk(t, [[0, 160], [3, SH * 0.45, 'heavy'], [8.6, SH - 150], [20.5, SH * 0.48], [29, SH - 200], [32.2, SH - 210], [40.6, SH * 0.5], [52.4, SH - 230]]);
      const zz = z * (1 + 0.02 * seg(t, 's1', 'collapse'));
      let [fx, fy] = P(t, SW / 2, fyS);
      if (b >= 40.6 && b < 50) { fx = lerp(fx, ax, lf); fy = lerp(fy, ay, lf); }
      const k = clamp((z - 1) / (PU - 1));
      const hook = clamp((z - 1) / (Z0 - 1)) * (b < 4 ? 1 : 0);
      const apF = b >= 40.6 && b < 50 ? lf : 0;
      let dx = lerp(fx, pick(lerp(1400, 1415, apF), W * 0.62, W / 2), k), dy = lerp(fy, H * pick(0.22 + 0.56 * fyS / SH, 0.25 + 0.5 * fyS / SH, 0.38 + 0.26 * fyS / SH), k);
      if (hook > 0) { dx = lerp(dx, pick(1180, W * 0.6, W / 2), hook); dy = lerp(dy, pick(H * 0.52, H * 0.52, H * 0.55), hook); }
      put(S.scrim, { o: TALL ? clamp(Math.max(k, hook) * 1.4) : 0 });
      put(S.cam, { s: zz, x: dx - W / 2 - zz * (fx - W / 2), y: dy - H / 2 - zz * (fy - H / 2) });
    },
    after(t, b, S) {   // live layout: the listening pill sits above the grown field; the touch cursor sits on its control
      const fh = S.field.offsetHeight, lp = sp(t, B('tap_mic'), 'default') - sp(t, B('dict1') + 0.3, 'default');
      put(S.wave, { css: { bottom: (fh + 10) + 'px' } });
      put(S.T1.vp, { css: { height: (SH - CMP_B - fh - 38 - 100 - 52 * clamp(lp)).toFixed(1) + 'px' } });
      put(S.status, { y: SH - CMP_B - fh - 30 });
      const pr = (m, d0 = 0.2, d1 = 0.08) => sp(t, B(m) - d0, 'snappy') - sp(t, B(m) + d1, 'snappy');
      const TAPS = [['tap_mic', S.micOn, 0.9], ['tap_send', S.sendB, 0.4], ['tap_ok', S.aOk, 1.6], ['tap_tg', S.tg, 1.0]];
      let vis = 0, cx = 0, cy = 0, press = 0, ring = -1;
      TAPS.forEach(([tp, target, pre]) => {
        const w = C.win(t, B(tp) - pre, B(tp) + 0.1);
        const d = t - bt(tp) + 0.07;
        if (w > vis || (d >= 0 && d < 0.42 && vis < 0.01)) { const r = C.rectOf(target); if (r.w > 0) { cx = r.cx; cy = r.cy; } }
        if (w > vis) vis = w;
        press += pr(tp);
        if (d >= 0 && d < 0.42) ring = d / 0.42;
      });
      put(S.cur, { o: vis > 0.03 ? 1 : 0, x: cx, y: cy, s: clamp(vis) * (1 - 0.22 * press) });
      put(S.rip, { o: ring < 0 ? 0 : 0.8 * (1 - ring), x: cx, y: cy, s: 0.6 + 2.2 * ease.out(Math.max(0, ring)) });
    },
  });

  // ================================================================ lockup: the phone morphs into the Krafty mascot
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
      const O = pick([[-320, -220, 120], [320, -240, 112], [-360, 140, 112], [350, 160, 124], [0, 330, 104]],
        [[-280, -200, 100], [270, -210, 95], [-310, 130, 95], [290, 140, 105], [0, 290, 90]],
        [[-340, -220, 100], [340, -240, 95], [-370, 40, 92], [360, 30, 100], [0, -310, 90]]);
      S.orbit = FIVE.map((k, i) => { const [ox, oy, sz] = O[i]; return { b: reg(bot(root, k, sz, MCX + ox - sz / 2, MCY + oy - sz / 2), { o: 0 }), i }; });
    },
    run(t, b, S) {
      const p = spHit(t, 'mascot', 'playful');
      put(S.m.el, { o: p > 0.002 ? 1 : 0, s: pick(0.7, 0.7, 0.8) + pick(0.3, 0.3, 0.2) * p, y: 8 * drift(t * 0.7 + 20) });
      blink(t, S.m, [63.6, 65.2]);
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
