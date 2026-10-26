// Krafty Bot — "Real work". 19 s, 16:9 + 9:16. Shotlist: docs/shotlist.md.
// UI is rebuilt element by element from kraftybot.app's landing demos (copy verbatim from the site); the mascot is the
// site's own /icon.png with the background keyed out (assets/brand/mascot.png).
// Pure function of time: no timers, no Math.random, nothing mutated in run().
(() => {
  const _hit = C.spHit;
  // leads measured with review.py (50 %-of-motion-peak onset vs audio onset), per preset; TYPE.rise uses this too
  const LEADS = { snappy: 0.012, heavy: 0.012, default: 0.08, playful: 0.08 };
  C.spHit = (t, b, p = 'snappy', lead = LEADS[p] ?? C.leadFor(p)) => _hit(t, b, p, lead);
  const { W, H, pick, put, reg, el, scene, sp, spHit, trk, seg, clamp, lerp, ease, bt, beatOf, noise1 } = C;
  const { line, rise, type } = TYPE;
  C.fonts = ['700 100px Display', '500 40px UI', '400 40px UI'];
  const TALL = C.FMT === '9x16';
  const PAD = pick(140, 90, 80);
  const CWT = W - PAD - 130;                          // 9:16 card width: right edge at 88 %
  // camera punch: zoom s about point (px, py) of a scene whose transform-origin is its centre
  const punch = (S, s, px, py) => put(S.root, { s, x: (px - W / 2) * (1 - s), y: (py - H / 2) * (1 - s) });

  document.head.appendChild(el('style', {}, null, `
    .ui { font-family: 'UI', Arial, sans-serif; letter-spacing: -0.01em; }
    .t { position: absolute; font-family: 'UI', Arial, sans-serif; color: var(--ink); letter-spacing: -0.01em; line-height: 1.32; }
    .mut { color: var(--ink-2); }
    .b { font-weight: 600; }
    .pill { position: absolute; border-radius: 999px; display: flex; align-items: center; gap: 12px; white-space: nowrap;
            font-family: 'UI', Arial, sans-serif; letter-spacing: -0.01em; }
    .rule { position: absolute; height: 1px; background: var(--line); }
    .dot { position: absolute; border-radius: 50%; }
    .row { position: absolute; left: 0; right: 0; }
    .bubble { position: absolute; background: var(--card-2); border-radius: 30px; padding: 24px 32px; }
    .scene { transform-origin: 50% 50%; }
  `));

  // ------------------------------------------------------------------ shared pieces
  const box = (parent, x, y, w, h, extra = '') =>
    el('div', { class: 'abs', style: `left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ''}${extra}` }, parent);
  const card = (parent, x, y, w, h, extra = '') =>
    el('div', { class: 'card', style: `left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}` }, parent);
  const txt = (parent, html, x, y, size, extra = '', cls = '') =>
    el('div', { class: `t ${cls}`, style: `left:${x}px;top:${y}px;font-size:${size}px;${extra}` }, parent, html);

  // Mascot: the real icon, with cream eyelids over the two eye holes for blinks (eye boxes measured on the 512 px icon).
  const EYES = [[165, 216, 62, 102], [284, 216, 62, 102]];
  function mascot(parent, size, x, y) {
    const m = box(parent, x, y, size, size, 'transform-origin:50% 70%');
    el('img', { src: '../assets/brand/mascot.png', style: `position:absolute;left:0;top:0;width:${size}px;height:${size}px` }, m);
    const k = size / 512;
    const lids = EYES.map(([ex, ey, ew, eh]) =>
      reg(box(m, ex * k - 2, ey * k - 3, ew * k + 4, eh * k + 6, 'background:#faf4e6;transform-origin:50% 0'), { o: 0 }));
    return { el: reg(m, { o: 0 }), lids };
  }
  // a blink is a 0.18 s close-open, not an enter or exit
  function blink(t, M, beats) {
    let a = 0;
    for (const b of beats) {
      const d = t - bt(b);
      if (d >= 0 && d < 0.18) a = Math.max(a, d < 0.07 ? d / 0.07 : 1 - (d - 0.07) / 0.11);
    }
    M.lids.forEach((l) => put(l, { o: a > 0.02 ? 1 : 0, sy: a }));
  }
  // enters: card rise (y + opacity snap in ≤ 4 frames) and grow-out (scale 0.86 → 1)
  const riseIn = (e, p, dy = 70, extra = {}) => put(e, { o: clamp(p * 6), y: dy * (1 - p), ...extra });
  const grow = (e, p, from = 0.86, extra = {}) => put(e, { o: clamp(p * 6), s: from + (1 - from) * p, ...extra });
  const push = (S, t, a, b, amt = 0.04) => put(S.root, { s: 1 + amt * ease.inOut(seg(t, a, b)) });
  const drift = noise1(11);
  const CHECK = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#161615" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ================================================================ 1. hook (0 → 4)
  scene({
    name: 'hook', from: 'hook', to: 'team',
    build(root, S) {
      const size = pick(250, 190, 170), y0 = pick(250, 260, 380);
      S.l1 = line(root, 'Give AI', { x: PAD, y: y0, size });
      S.l2 = line(root, 'real work.', { x: PAD, y: y0 + size * 0.98, size, accent: [0, 1] });
      const ms = pick(520, 420, 560);
      S.ms = ms; S.mx = pick(1240, 600, (W - ms) / 2 + 40); S.my = pick(250, 560, 920);
      S.m = mascot(root, ms, S.mx, S.my);
      // where the team card's first avatar sits (team scene: card x/y + row offset 30, 20 + 38)
      S.av = [pick(W - PAD - 820, PAD, PAD) + 30, pick(150, 540, 720) + 58];
    },
    run(t, b, S) {
      const p = spHit(t, -0.3, 'playful');
      const hop = sp(t, beatOf('mascot') - 0.3, 'playful') - sp(t, 'mascot', 'playful');
      // collapse into the avatar: a fast spring released 0.6 beat before the cut, so it is ~97 % home at the cut
      const c = sp(t, beatOf('team') - 0.7, 'snappy');
      const s = lerp(1, 72 / S.ms, c), ox = 0.5 * S.ms, oy = 0.7 * S.ms;
      const tx = S.av[0] - S.mx - ox * (1 - s), ty = S.av[1] - S.my - oy * (1 - s);
      put(S.m.el, { o: clamp(p * 6), s: (0.82 + 0.18 * p) * s, r: 8 * (1 - p) * (1 - c),
        x: tx * c, y: (14 * drift(t * 0.8) - 40 * hop) * (1 - c) + ty * c });
      blink(t, S.m, ['mascot', 3.1]);
      rise(t, S.l1, [-0.4, 'hook_w2'], beatOf('team') - 0.5);
      rise(t, S.l2, ['hook_w3', 'hook_w4'], beatOf('team') - 0.5);
    },
  });

  // ================================================================ 2. team (4 → 8): the real agent list
  const AGENTS = [
    ['Inbox Manager', '10:08 AM', 'sent. inbox at zero, 5 drafts parked for tomorrow.'],
    ['Expense Manager', '9:08 AM', 'report filed. 9 receipts, nothing outstanding.'],
    ['Account Manager', '8:08 AM', 'invite’s out to vicky. globex note held in drafts.'],
    ['Talent Scout', '5:08 AM', '3 intros drafted in your voice, held for your ok.'],
  ];
  scene({
    name: 'team', from: 'team', to: 'chat', pre: 0.5, cut: true,   // the card grows around the mascot as it lands
    build(root, S) {
      S.eyebrow = reg(txt(root, 'Meet your teammates', PAD, pick(330, 200, 300), 34, '', 'mut'), { o: 0 });
      S.h1 = line(root, 'AI teammates.', { x: PAD, y: pick(390, 260, 360), size: pick(130, 120, 120) });
      S.sub = reg(txt(root, 'They keep going after you<br>close the tab.', PAD, pick(570, 420, 520), pick(40, 36, 40), '', 'mut'), { o: 0 });
      const cw = pick(820, W - 2 * PAD, CWT), cx = pick(W - PAD - 820, PAD, PAD), cy = pick(150, 540, 720), rh = 150;
      S.card = reg(card(root, cx, cy, cw, rh * 4 + 40), { o: 0 });
      S.rows = AGENTS.map(([n, tm, msg], i) => {
        const r = box(S.card, 0, 20 + i * rh, cw, rh);
        const av = mascot(r, 72, 30, 38); reg(av.el, { o: 1 });
        txt(r, n, 124, 30, 34, 'font-weight:600');
        txt(r, tm, cw - 170, 34, 28, 'text-align:right;width:140px', 'mut');
        txt(r, msg, 124, 78, 29, `width:${cw - 170}px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis`, 'mut');
        el('div', { class: 'dot', style: 'left:84px;top:90px;width:20px;height:20px;background:var(--accent);border:4px solid var(--card)' }, r);
        if (i < 3) el('div', { class: 'rule', style: `left:124px;right:30px;top:${rh - 1}px` }, r);
        return reg(r, { o: 0 });
      });
    },
    run(t, b, S) {
      put(S.eyebrow, { o: clamp(sp(t, 'team', 'snappy') * 3) });
      rise(t, S.h1, 'team');
      riseIn(S.sub, spHit(t, 'row2', 'default'), 30);
      grow(S.card, sp(t, 'row1', 'default'), 0.9, { css: { transformOrigin: '60px 80px' } });
      S.rows.forEach((r, i) => riseIn(r, spHit(t, `row${i + 1}`, 'default'), 40));
      push(S, t, 'team', 'chat', 0.04);
    },
  });

  // ================================================================ 3. chat (8 → 12): hand a Bot the job
  const BRIEF = 'work the pipeline overnight: research the accounts, score the contacts, draft email and linkedin in my voice. nothing goes out without me.';
  scene({
    name: 'chat', from: 'chat', to: 'night',
    build(root, S) {
      const cx = pick(PAD, 60, PAD), cy = pick(150, 140, 380), cw = pick(W - 2 * cx, W - 2 * cx, CWT), ch = pick(780, 800, 900);
      S.card = card(root, cx, cy, cw, ch);
      const av = mascot(S.card, 60, 32, 22); reg(av.el, { o: 1 });
      txt(S.card, 'Sales Outbound', 112, 20, 34, 'font-weight:600');
      txt(S.card, 'Saturday 1:08 PM', 112, 60, 28, '', 'mut');
      el('div', { class: 'rule', style: 'left:0;right:0;top:110px' }, S.card);
      const bw = pick(1000, 820, 700), fs = pick(38, 34, 36);
      S.bubble = el('div', { class: 'bubble t', style: `left:auto;right:36px;top:150px;width:${bw}px;font-size:${fs}px` }, S.card);
      S.text = el('span', {}, S.bubble, '');
      S.caret = el('span', { style: `display:inline-block;width:3px;height:${fs}px;background:var(--ink);vertical-align:-6px;margin-left:2px` }, S.bubble);
      reg(S.bubble, { o: 0 }); reg(S.text); reg(S.caret, { o: 0 });
      const chipY = pick(440, 440, 560);
      S.chip = el('div', { class: 'pill', style: `left:36px;top:${chipY}px;height:72px;padding:0 30px 0 16px;background:var(--card-2);font-size:32px;transform-origin:0 50%` }, S.card,
        `<span style="width:42px;height:42px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center">${CHECK}</span><span class="b">Created routine</span><span class="mut">Overnight outbound batch</span>`);
      reg(S.chip, { o: 0 });
      S.ack = reg(txt(S.card, 'saved. i’ll run it every night and leave a review list for you each morning.', 36, chipY + 100, pick(32, 30, 32), `width:${pick(1100, 760, 860)}px`), { o: 0 });
      S.comp = el('div', { class: 'pill', style: `left:32px;right:32px;bottom:32px;height:88px;padding:0 32px;border:1px solid var(--line);font-size:32px;color:var(--ink-2)` }, S.card, 'Message Sales…');
      reg(S.card);
    },
    run(t, b, S) {
      riseIn(S.card, sp(t, beatOf('chat') - 0.6, 'default'), 50);
      grow(S.bubble, spHit(t, beatOf('type_in') - 0.25, 'snappy'), 0.92, { css: { transformOrigin: '100% 0' } });
      type(t, S.text, BRIEF, 'type_in', 'type_out', S.caret, 'routine');
      grow(S.chip, spHit(t, 'routine', 'snappy'), 0.8);
      riseIn(S.ack, spHit(t, 11.5, 'default'), 24);
      const z = trk(t, [[0, 1], [beatOf('type_in') - 0.25, pick(1.22, 1.15, 1.12)], [beatOf('routine') - 0.6, 1.02]]);
      punch(S, z, pick(W - PAD - 40, W - 100, PAD + CWT - 20), pick(330, 330, 560));
    },
  });

  // ================================================================ 4. night (12 → 16): it keeps working
  scene({
    name: 'night', from: 'night', to: 'email',
    build(root, S) {
      const size = pick(120, 110, 120), y0 = pick(300, 160, 330);
      S.l1 = line(root, 'They work while', { x: PAD, y: y0, size });
      S.l2 = line(root, 'you sleep.', { x: PAD, y: y0 + size, size, accent: [1] });
      const cx = pick(1060, PAD, PAD), cw = pick(720, W - 2 * PAD, CWT), cy = pick(240, 480, 740);
      S.card = reg(card(root, cx, cy, cw, pick(330, 300, 330)), { o: 0 });
      const av = mascot(S.card, 56, 30, 28); reg(av.el, { o: 1 });
      txt(S.card, 'Overnight outbound batch', 104, 26, 30, 'font-weight:600');
      txt(S.card, '12:16 PM', 104, 64, 28, '', 'mut');
      txt(S.card, 'overnight batch ready: 36 queued in your voice, 4 skipped as recently touched. nothing sent.', 30, 130, pick(32, 32, 34), `width:${cw - 60}px`);
      const ny = pick(640, 820, 1140);
      S.num = reg(el('div', { class: 'abs display', style: `left:${cx}px;top:${ny}px;font-size:${pick(200, 170, 220)}px` }, root, '0'), { o: 0 });
      S.lab = reg(txt(root, 'queued in your voice', cx + pick(250, 220, 280), ny + pick(70, 60, 80), pick(40, 36, 44), '', 'mut'), { o: 0 });
      S.sent = reg(el('div', { class: 'pill', style: `left:${cx + pick(250, 220, 280)}px;top:${ny + pick(130, 110, 145)}px;height:52px;padding:0 22px;font-size:30px;color:var(--accent);background:#4cc79b24` }, root, 'nothing sent'), { o: 0 });
    },
    run(t, b, S) {
      rise(t, S.l1, 'night', null, { stagger: 0.06 });
      rise(t, S.l2, beatOf('night') + 0.5, null, { stagger: 0.12 });
      riseIn(S.card, spHit(t, 'reply', 'default'), 60);
      const n = Math.round(36 * ease.out(seg(t, 'count0', 'count1')));
      const pn = spHit(t, 'count0', 'snappy');
      put(S.num, { o: pn > 0.01 ? 1 : 0, text: String(n), y: 40 * (1 - pn) });
      riseIn(S.lab, spHit(t, 'count0', 'snappy'), 20);
      grow(S.sent, spHit(t, 'count1', 'snappy'), 0.8);
      push(S, t, 'night', 'email', 0.04);
    },
  });

  // ================================================================ 5. email (16 → 24): review and approve
  const EW = pick(760, 860, CWT), EH = 860;
  scene({
    name: 'email', from: 'email', to: 'launch',
    build(root, S) {
      S.card = reg(card(root, 0, 0, EW, EH, 'transform-origin:50% 100%'), { o: 0 });
      const c = S.card;
      txt(c, 'New email', 36, 28, 32, 'font-weight:600');
      S.badge = reg(el('div', { class: 'pill', style: `right:28px;top:26px;height:44px;padding:0 18px;font-size:28px;color:var(--ink-2);background:#ffffff10` }, c, 'Ready to send'));
      S.badgeOk = reg(el('div', { class: 'pill', style: `right:28px;top:26px;height:44px;padding:0 18px;font-size:28px;color:var(--accent);background:#2a3d34;transform-origin:100% 50%` }, c, 'Sent'), { o: 0 });
      el('div', { class: 'rule', style: 'left:0;right:0;top:96px' }, c);
      [['From', 'sam@x.ai'], ['To', 'dana@northwind.io'], ['Subject', 'Three infra roles and a migration']].forEach(([k, v], i) => {
        txt(c, k, 36, 118 + i * 62, 28, '', 'mut');
        txt(c, v, 170, 116 + i * 62, i === 2 ? 32 : 30, i === 2 ? 'font-weight:600' : '');
      });
      el('div', { class: 'rule', style: 'left:36px;right:36px;top:306px' }, c);
      txt(c, 'Hi Dana,<br><br>Saw Northwind opened three infra roles this month. Usually that means the migration you mentioned in March is finally moving.<br><br>We cut the same work in half for two teams your size. Worth fifteen minutes next week?<br><br>Sam',
        36, 330, 28, `width:${EW - 72}px;line-height:1.36`, 'mut');
      S.send = el('div', { class: 'pill', style: `left:36px;bottom:32px;height:68px;padding:0 34px;font-size:30px;font-weight:600;background:var(--ink);color:#161615;transform-origin:50% 50%` }, c, 'Send email');
      S.sendOk = reg(el('div', { class: 'pill', style: `left:36px;bottom:32px;height:68px;padding:0 34px;font-size:30px;font-weight:600;background:var(--accent);color:#161615` }, c, `${CHECK}Sent`), { o: 0 });
      reg(S.send);
      el('div', { class: 'pill', style: `left:262px;bottom:32px;height:68px;padding:0 30px;font-size:30px;border:1px solid var(--line);color:var(--ink-2)` }, c, 'Discard');
      S.cursor = reg(el('div', { class: 'abs', style: 'width:44px;height:52px' }, root,
        '<svg width="44" height="52" viewBox="0 0 22 26"><path d="M2 1.5v19.2l5.2-4.8 3.4 7.6 3.3-1.5-3.4-7.4h7.1z" fill="#faf4e6" stroke="#161615" stroke-width="1.6" stroke-linejoin="round"/></svg>'), { o: 0 });
      const size = pick(104, 100, 110), hy = pick(380, 1030, 1260);
      S.l1 = line(root, 'Nothing ships', { x: PAD, y: hy, size });
      S.l2 = line(root, 'without your OK.', { x: PAD, y: hy + size, size, accent: [2] });
      S.reply = reg(el('div', { class: 'bubble t', style: `left:0;top:0;font-size:30px;white-space:nowrap;background:var(--card)` }, root,
        '<span class="mut">You</span>&nbsp; send the top 10 emails, they look good'), { o: 0 });
    },
    run(t, b, S) {
      // the card enters tilted back and settles (2D skew + scale stands in for perspective, which would break --verify)
      const p = spHit(t, 'email', 'default');
      const x0 = pick((W - EW) / 2, (W - EW) / 2, PAD), x1 = pick(W - PAD - EW, x0, x0);
      const y0 = pick(110, 100, 300), y1 = pick(110, 100, 200);
      const cx = trk(t, [[0, x0], [beatOf('ok_line') - 0.5, x1]]);
      const cy = trk(t, [[0, y0], [beatOf('ok_line') - 0.5, y1]]);
      const press = sp(t, beatOf('click') - 0.12, 'snappy') - sp(t, beatOf('click') + 0.1, 'snappy');
      put(S.card, { o: clamp(p * 6), x: cx, y: cy + 120 * (1 - p), sy: 0.9 + 0.1 * p, css: { transform: `translate(${cx.toFixed(2)}px, ${(cy + 120 * (1 - p)).toFixed(2)}px) skewX(${(-6 * (1 - p)).toFixed(3)}deg) scale(${(0.94 + 0.06 * p).toFixed(4)}, ${(0.88 + 0.12 * p).toFixed(4)})` } });
      // cursor glides in, presses Send on the click beat
      const tx = cx + 36 + 110, ty = cy + EH - 32 - 40;
      const mx = trk(t, [[0, W + 60], [beatOf('cursor'), tx, 'default']]), my = trk(t, [[0, H - 80], [beatOf('cursor'), ty, 'default']]);
      const show = b >= beatOf('cursor') - 0.1 && b < beatOf('ok_line') + 0.5;
      put(S.cursor, { o: show ? 1 : 0, x: mx, y: my, s: 1 - 0.12 * press });
      const sent = spHit(t, 'click', 'snappy');
      put(S.send, { s: 1 - 0.06 * press, o: sent > 0.5 ? 0 : 1 });
      put(S.sendOk, { o: sent > 0.5 ? 1 : 0, s: 0.94 + 0.06 * sent });
      put(S.badgeOk, { o: sent > 0.5 ? 1 : 0, s: 0.85 + 0.15 * sent }); put(S.badge, { o: sent > 0.5 ? 0 : 1 });
      rise(t, S.l1, 'ok_line', null, { stagger: 0.06 });
      rise(t, S.l2, beatOf('ok_line') + 0.5, null, { stagger: 0.08 });
      const rp = spHit(t, 22, 'default');
      put(S.reply, { o: clamp(rp * 6), x: pick(PAD, PAD, PAD), y: pick(700, 1300, 1420) + 40 * (1 - rp) });
      const z = trk(t, [[0, 1], [beatOf('click') - 1.25, pick(1.6, 1.4, 1.3)], [beatOf('ok_line') - 0.75, 1]]);
      punch(S, z, x0 + 36 + 110, y0 + EH - 66);
    },
  });

  // ================================================================ 6. launch (24 → 28): many Bots, one thread
  const STEPS = ['Research gathered', 'Brief drafted', 'Details checked', 'Ready for your review'];
  scene({
    name: 'launch', from: 'launch', to: 'computer',
    build(root, S) {
      const size = pick(110, 100, 120), y0 = pick(380, 160, 330);
      S.l1 = line(root, 'One brief.', { x: PAD, y: y0, size });
      S.l2 = line(root, 'Four teammates.', { x: PAD, y: y0 + size, size, accent: [1] });
      const cw = pick(760, W - 2 * PAD, CWT), cx = pick(W - PAD - 760, PAD, PAD), cy = pick(200, 470, 780), rh = 96;
      S.card = reg(card(root, cx, cy, cw, 140 + rh * 4), { o: 0 });
      S.focus = [cx + cw * 0.35, cy + 140 + rh * 2];
      txt(S.card, 'Launch team', 36, 34, 36, 'font-weight:600');
      S.avs = [0, 1, 2, 3].map((i) => { const d = box(S.card, cw - 36 - 64 - i * 50, 26, 64, 64, 'border-radius:50%;background:var(--card-2);border:3px solid var(--card);box-sizing:border-box;transform-origin:50% 50%'); const a = mascot(d, 50, 4, 4); reg(a.el, { o: 1 }); return reg(d, { o: 0 }); });
      el('div', { class: 'rule', style: 'left:0;right:0;top:118px' }, S.card);
      S.steps = STEPS.map((s, i) => {
        const r = box(S.card, 0, 136 + i * rh, cw, rh);
        el('div', { class: 'dot', style: 'left:36px;top:24px;width:44px;height:44px;border:2px solid var(--line);box-sizing:border-box' }, r);
        const on = reg(el('div', { class: 'dot', style: 'left:36px;top:24px;width:44px;height:44px;background:var(--accent);display:flex;align-items:center;justify-content:center' }, r, CHECK), { o: 0 });
        const off = txt(r, s, 104, 24, 34, '', 'mut'), lit = reg(txt(r, s, 104, 24, 34), { o: 0 });
        return { on, off, lit };
      });
      S.note = reg(el('div', { class: 'pill', style: `left:${cx}px;top:${cy + 140 + rh * 4 + 28}px;height:80px;padding:0 30px 0 18px;background:var(--card-2);font-size:32px;transform-origin:0 50%` }, root,
        `<span class="dot" style="position:relative;width:16px;height:16px;background:var(--accent)"></span><span class="b">Your launch brief is ready</span>`), { o: 0 });
    },
    run(t, b, S) {
      rise(t, S.l1, 'launch', null, { stagger: 0.06 });
      rise(t, S.l2, beatOf('launch') + 0.5, null, { stagger: 0.08 });
      riseIn(S.card, spHit(t, 'launch', 'default'), 80);
      S.avs.forEach((a, i) => grow(a, spHit(t, beatOf('launch') + 0.25 + i * 0.125, 'snappy'), 0.6));
      S.steps.forEach((st, i) => {
        const p = spHit(t, `chk${i + 1}`, 'snappy');
        put(st.on, { o: p > 0.02 ? 1 : 0, s: 0.5 + 0.5 * p });
        put(st.lit, { o: p > 0.5 ? 1 : 0 }); put(st.off, { o: p > 0.5 ? 0 : 1 });
      });
      grow(S.note, spHit(t, 27, 'snappy'), 0.85);
      const z = trk(t, [[0, 1], [beatOf('chk1') - 0.4, pick(1.3, 1.2, 1.12)], [26.9, 1.03]]);
      punch(S, z, S.focus[0], S.focus[1]);
    },
  });

  // ================================================================ 7. computer (28 → 32): a computer of their own
  const STATS = [['Visitors', 2840, ''], ['Signups', 186, ''], ['Activation', 72, '%']];
  scene({
    name: 'computer', from: 'computer', to: 'end',
    build(root, S) {
      const size = pick(110, 100, 120), y0 = pick(380, 160, 330);
      S.l1 = line(root, 'A computer', { x: PAD, y: y0, size });
      S.l2 = line(root, 'of their own.', { x: PAD, y: y0 + size, size });
      const ww = pick(800, W - 2 * PAD, CWT), wx = pick(W - PAD - 800, PAD, PAD), wy = pick(170, 480, 740), wh = pick(740, 560, 680);
      S.win = reg(card(root, wx, wy, ww, wh, 'transform-origin:50% 100%;overflow:hidden'), { o: 0 });
      const c = S.win;
      const bar = box(c, 0, 0, ww, 72, 'background:var(--card-2)');
      [0, 1, 2].forEach((i) => el('div', { class: 'dot', style: `left:${28 + i * 30}px;top:28px;width:16px;height:16px;background:#4a4a48` }, bar));
      el('div', { class: 'pill', style: `left:140px;top:14px;height:44px;padding:0 22px;font-size:28px;color:var(--ink-2);background:#161615` }, bar, 'Studio · Weekly overview');
      S.status = el('div', { class: 'pill', style: `right:24px;top:14px;height:44px;padding:0 18px;font-size:28px;color:var(--ink);background:#161615` }, bar,
        '<span class="dot" style="position:relative;width:12px;height:12px;background:var(--ink)"></span>Working');
      S.pulse = reg(S.status.firstChild);
      txt(c, 'Friday recap', 40, 110, pick(56, 52, 56), 'font-weight:700;letter-spacing:-0.03em');
      txt(c, 'This week', 40, 186, 30, '', 'mut');
      const tw = (ww - 80 - 2 * 20) / 3;
      S.tiles = STATS.map(([k, v, u], i) => {
        const tl = box(c, 40 + i * (tw + 20), 250, tw, pick(200, 180, 200), 'background:#161615;border-radius:20px;border:1px solid var(--line)');
        txt(tl, k, 24, 22, 28, '', 'mut');
        const val = el('div', { class: 'abs display', style: `left:24px;top:${pick(84, 76, 84)}px;font-size:${pick(66, 60, 66)}px` }, tl, '0');
        reg(val);
        return { tl: reg(tl, { o: 0 }), val, v, u };
      });
      S.memo = reg(el('div', { class: 'bubble t', style: `left:40px;top:${pick(500, 460, 500)}px;width:${ww - 80 - 64}px;font-size:28px;background:#161615;border:1px solid var(--line)` }, c,
        '<span class="mut">Remembered</span>&nbsp; Keep launch updates short. Lead with what shipped, then what’s next.'), { o: 0 });
    },
    run(t, b, S) {
      rise(t, S.l1, 'computer', null, { stagger: 0.06 });
      rise(t, S.l2, beatOf('computer') + 0.5, null, { stagger: 0.08 });
      const p = spHit(t, 'window', 'default');
      put(S.win, { o: clamp(p * 6), y: 140 * (1 - p), s: 0.9 + 0.1 * p });
      put(S.pulse, { o: 0.45 + 0.55 * (0.5 + 0.5 * Math.cos((t - bt('window')) * Math.PI * 4)) });
      S.tiles.forEach((T, i) => {
        const q = spHit(t, `stat${i + 1}`, 'snappy');
        grow(T.tl, q, 0.9);
        const n = Math.round(T.v * ease.out(seg(t, `stat${i + 1}`, beatOf(`stat${i + 1}`) + 1.25)));
        put(T.val, { text: n.toLocaleString('en-US') + T.u });
      });
      riseIn(S.memo, spHit(t, 31, 'default'), 30);
      push(S, t, 'computer', 'end', 0.04);
    },
  });

  // ================================================================ 8. end card (32 → 38)
  scene({
    name: 'end', from: 'end', to: 'done',
    build(root, S) {
      const ms = pick(300, 280, 340);
      const mx = PAD - pick(0, 0, 10), my = pick(300, 260, 400);
      S.m = mascot(root, ms, mx, my);
      const wsize = pick(260, 220, 240);
      S.word = line(root, 'Krafty', { x: pick(PAD + ms + 40, PAD + ms + 30, PAD), y: pick(my + ms / 2 - wsize * 0.58, my + ms / 2 - wsize * 0.58, my + ms + 60), size: wsize });
      const sy = pick(700, 680, 1120);
      const sub = TALL ? ['Start free and give it', 'something real to do.'] : ['Start free and give it something real to do.'];
      S.sub = sub.map((s, i) => line(root, s, { x: PAD, y: sy + i * 64, size: pick(52, 46, 54), cls: 'ui', color: 'var(--ink-2)' }));
      S.url = line(root, 'kraftybot.app', { x: PAD, y: sy + sub.length * 64 + 30, size: pick(96, 80, 96), accent: [0] });
    },
    run(t, b, S) {
      const p = spHit(t, 'end', 'playful');
      put(S.m.el, { o: clamp(p * 6), y: -220 * (1 - p) + 10 * drift(t * 0.7 + 20), s: 0.9 + 0.1 * p });
      blink(t, S.m, ['blink2', 37.2]);
      rise(t, S.word, 'wordmark', null, { stagger: 0.04 });
      S.sub.forEach((L, i) => rise(t, L, beatOf('cta') + i * 0.25, null, { stagger: 0.03, preset: 'default' }));
      rise(t, S.url, 'url', null, { preset: 'default' });
      push(S, t, 'end', 'done', 0.06);
    },
  });

  C.start();
})();
