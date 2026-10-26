# Original score, synthesized in code → audio/music.wav (+ audio/drums.wav stem for beat measurement). Seeded.
# Run from the project root:  python3 scripts/music.py
#
# Reads timeline.json:
#   bpm, duration, marks
#   music.chords     one chord per bar, cycled: "Am" "F" "C" "G" "Dm" "Bb" "F#m" "Ebmaj7" "Gsus2" "Cadd9" ...
#   music.sections   [{ "at": beat|mark, "kind": ... }] — kinds:
#       intro   four-on-the-floor, rim backbeat, off-beat hats, root bass, mallet motif
#       full    + clap backbeat, 16th hats, off-beat bass plucks, brighter motif
#       dark    stripped: half-time kick, sparse rim, low bass, no motif (under dense UI / VO)
#       build   climbing mallet, clap roll accelerating into the next section, filtered-noise riser
#       gap     stop-time hit on its first beat, then silence (make the next section's first beat land hard)
#       drop    impact on its first beat (big kick, crash, chord stab, sub), then the full groove
#       outro   half-time, final chord on its first beat, rings out to the end
#   music.accents    [beat|mark, ...] extra crash + big kick (logo, CTA)
#   music.seed       integer (default 4242)
# Warm electronic groove: tight kick, rim + soft clap, crisp noise hats and shaker, sub-bass pulse, Rhodes-style comping, soft analog pad.
import json, os, re
import numpy as np, soundfile as sf
from scipy import signal

TL = json.load(open('timeline.json'))
MU = TL.get('music') or {}
SR, DUR, BPM = 48000, float(TL['duration']), float(TL['bpm'])
BEAT = 60 / BPM; N = int(SR * DUR); NB = int(np.ceil(DUR / BEAT))
beat_of = lambda m: TL['marks'][m] if isinstance(m, str) else float(m)
T = lambda b: b * BEAT


def mulberry32(seed, n):
    a = (np.uint64(seed) + np.arange(1, n + 1, dtype=np.uint64) * np.uint64(0x6D2B79F5)) & np.uint64(0xFFFFFFFF)
    t = ((a ^ (a >> np.uint64(15))) * (a | np.uint64(1))) & np.uint64(0xFFFFFFFF)
    t = (t ^ ((t + (((t ^ (t >> np.uint64(7))) * (t | np.uint64(61))) & np.uint64(0xFFFFFFFF))) & np.uint64(0xFFFFFFFF)))
    return ((t ^ (t >> np.uint64(14))) & np.uint64(0xFFFFFFFF)).astype(np.float64) / 4294967296.0


_seed = [int(MU.get('seed', 4242))]
def noise(n):
    _seed[0] += 7919; return mulberry32(_seed[0], n) * 2 - 1
def tt(d): return np.arange(int(d * SR)) / SR
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def filt(x, kind, f, order=2): return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output='sos'), x, axis=0)
def buf(): return np.zeros((N, 2))
GAPS = []   # [(b0, b1)] silent windows (gap sections); filled below
def add(dst, x, t0, gain=1.0, pan=0.0, force=False):
    if not force and any(g0 - 1e-6 <= t0 / BEAT < g1 for g0, g1 in GAPS): return
    i = int(round(t0 * SR))
    if x.ndim == 1: x = np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)], 1)
    if i < 0: x, i = x[-i:], 0
    j = min(N, i + len(x))
    if j > i: dst[i:j] += x[: j - i] * gain


# ---------- instruments (warm electronic: tight kick, noise hats, rim, sub pulse, Rhodes-style keys, soft pad) ----------
def kick(g=1.0, big=False):
    t = tt(0.42 if big else 0.26)
    f = 48 + (110 if big else 80) * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (6 if big else 13))
    click = filt(noise(len(t)), 'highpass', 2500) * np.exp(-t * 900) * 0.18
    return np.tanh((body + click) * 1.4) * g

def rim(g=1.0):
    t = tt(0.07)
    tone = np.sin(2 * np.pi * 1850 * t) * 0.45 + np.sin(2 * np.pi * 760 * t) * 0.5
    return (tone * np.exp(-t * 110) + filt(noise(len(t)), 'bandpass', [1800, 6000]) * np.exp(-t * 500) * 0.5) * g

def clap(g=1.0):
    t = tt(0.22); n = filt(noise(len(t)), 'bandpass', [1100, 4200])
    env = sum(np.where(t >= o, np.exp(-(t - o) * 380), 0) for o in (0, 0.007, 0.015)) + np.where(t >= 0.018, np.exp(-(t - 0.018) * 26) * 0.45, 0)
    return n * env * g

def hat(g=1.0, open_=False):   # crisp filtered-noise hat with a short metallic edge
    t = tt(0.2 if open_ else 0.045)
    x = filt(noise(len(t)), 'highpass', 7500) + 0.15 * filt(np.sign(np.sin(2 * np.pi * 6100 * t)), 'highpass', 6000)
    return x * np.exp(-t * (14 if open_ else 110)) * g * 0.42

def shaker(g=1.0):
    t = tt(0.06)
    return filt(noise(len(t)), 'bandpass', [5000, 9500]) * np.minimum(t / 0.01, 1) * np.exp(-t * 70) * g * 0.35

def sub(m, d=0.2, g=1.0):   # tight sub-bass pulse: sine + a little 2nd harmonic, short clean release
    t = tt(d); f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(t / 0.003, 1) * np.exp(-t * (2.5 if d > 0.4 else 5)) * np.clip((d - t) / 0.02, 0, 1)
    return np.tanh(x * env * 1.4) * g

def rhodes(m, d=1.2, g=1.0, vel=1.0):   # electric-piano tine: 1:1 FM body + bell partial, tremolo, low-passed
    t = tt(d); f = midi(m)
    idx = (0.9 + 0.8 * vel) * np.exp(-t * 3.5) + 0.25
    body = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    bell = 0.22 * vel * np.sin(2 * np.pi * 7.03 * f * t) * np.exp(-t * 22)
    env = np.minimum(t / 0.004, 1) * np.exp(-t * 1.6) * np.clip((d - t) / 0.08, 0, 1)
    x = (body + bell) * env
    trem = 0.14 * np.sin(2 * np.pi * 5.2 * t)
    st = np.stack([x * (1 + trem), x * (1 - trem)], 1)
    return filt(st, 'lowpass', 3200) * g

def pad(ms, d, g=1.0):   # warm analog poly: 3 detuned saws per note, slow attack, low-passed
    t = tt(d); x = np.zeros(len(t))
    for m in ms:
        for c in (-7, 0, 7):
            f = midi(m) * 2 ** (c / 1200)
            x += signal.sawtooth(2 * np.pi * f * t + c)
    env = np.minimum(t / 0.35, 1) * np.clip((d - t) / 0.3, 0, 1)
    return filt(x * env / (3 * len(ms)), 'lowpass', 1400, 2) * g

def crash(g=1.0, d=1.8):
    t = tt(d); n = filt(noise(len(t)), 'highpass', 5000)
    return n * np.exp(-t * 2.6) * np.minimum(t / 0.002, 1) * g

def riser(d, g=1.0):
    t = tt(d); u = t / d; n = noise(len(t)); y = np.zeros_like(n); z = 0.0
    a = 1 - np.exp(-2 * np.pi * (300 + 6000 * u ** 2.4) / SR)
    for i in range(len(n)): z += a[i] * (n[i] - z); y[i] = z
    return filt(y, 'highpass', 200) * u ** 2.6 * g

def room(x, secs=0.7, seed=5, mix=1.0):
    t = tt(secs); out = []
    for ch in range(2):
        ir = filt((mulberry32(seed + ch, len(t)) * 2 - 1) * np.exp(-t * 7 / secs), 'lowpass', 5000)
        ir /= np.sqrt((ir ** 2).sum()); out.append(signal.fftconvolve(x[:, ch], ir)[:N])
    return np.stack(out, 1) * mix

def delay(x, secs, fb=0.3, mix=0.3):
    d = int(secs * SR); y = x.copy()
    for k in range(1, 5):
        if d * k < N: y[d * k:] += x[:-d * k] * (fb ** k) * mix * (1 if k % 2 else 0.8)
    return y


# ---------- harmony ----------
PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def chord(sym):
    m = re.match(r'^([A-G])([#b]?)(m(?!aj))?(.*)$', sym)
    if not m: raise ValueError(f'bad chord "{sym}"')
    pc = (PC[m[1]] + {'#': 1, 'b': -1, '': 0}[m[2]]) % 12
    minor, ext = bool(m[3]), m[4]
    iv = [0, 3 if minor else 4, 7, 10 if minor else 12]
    if 'maj7' in ext: iv[3] = 11
    elif '7' in ext: iv[3] = 10
    if 'sus2' in ext: iv[1] = 2
    if 'sus4' in ext: iv[1] = 5
    if 'add9' in ext: iv[3] = 14
    base = 64 + ((pc - 64) % 12)             # voicing root in 64..75
    return 40 + ((pc - 4) % 12), [base + i for i in iv]    # (bass root 40..51, 4 chord tones)
CHORDS = [chord(c) for c in MU.get('chords', ['Am', 'F', 'C', 'G'])]
MOTIF_STEPS = [0, 3, 6, 8, 10, 13]; MOTIF_IDX = [0, 2, 1, 3, 2, 1]

SECS = sorted([(beat_of(s['at']), s['kind']) for s in MU.get('sections', [{'at': 0, 'kind': 'full'}])])
def section(b):
    cur = SECS[0]
    for s in SECS:
        if s[0] <= b + 1e-9: cur = s
    nxt = next((s[0] for s in SECS if s[0] > cur[0]), NB)
    return cur[1], cur[0], nxt
ACCENTS = [beat_of(a) for a in MU.get('accents', [])]
for i, (s0, k) in enumerate(SECS):
    if k == 'gap': GAPS.append((s0, SECS[i + 1][0] if i + 1 < len(SECS) else NB))

kickb, drums, bassb, keys, fx = buf(), buf(), buf(), buf(), buf()
pads = buf()
COMP = [(0, 1.4, 1.0), (1.5, 0.45, 0.7), (2.5, 0.9, 0.85), (3.5, 0.4, 0.6)]   # Rhodes comping per bar: (beat, length in beats, velocity)
SUBP = [0, 0.75, 1.5, 2, 2.75, 3.5]                                             # sub-bass pulse
for b in range(NB):
    kind, s0, s1 = section(b)
    bar, pos = divmod(b, 4); root, voic = CHORDS[bar % len(CHORDS)]
    first = b == int(np.ceil(s0))
    if kind == 'gap': continue
    groove = 'full' if kind == 'drop' else kind
    # kick: four on the floor (half-time in outro)
    if groove in ('intro', 'full', 'build') or (groove == 'outro' and pos in (0, 2)):
        big = first and kind in ('drop', 'outro') or b in ACCENTS
        add(kickb, kick(1.2 if big else (0.85 if groove == 'intro' else 1.0), big=big), T(b))
    # rim on 2 and 4, clap layered in full; ghost rim on the "a" of 4
    if pos in (1, 3):
        add(drums, rim(0.5), T(b), pan=0.1)
        if groove in ('full', 'build'): add(drums, clap(0.28), T(b), pan=-0.05)
    if pos == 3 and groove in ('full', 'build'): add(drums, rim(0.22), T(b + 0.75), pan=-0.3)
    # hats: 16ths with accented off-beats; shaker texture in full
    for s in (0, 0.25, 0.5, 0.75):
        if groove == 'outro' and s != 0.5: continue
        g = (0.55 if s == 0.5 else 0.22) * (0.7 if groove == 'intro' else 1)
        add(drums, hat(g), T(b + s), pan=0.22 if s == 0.5 else -0.15)
        if groove == 'full' and s in (0.25, 0.75): add(drums, shaker(0.5), T(b + s), pan=0.35)
    if pos == 3 and groove == 'full': add(drums, hat(0.26, True), T(b + 0.5), pan=0.3)
    # sub pulse
    if pos == 0 and groove != 'outro':
        for st in SUBP:
            if b + st >= s1: break
            add(bassb, sub(root - 12 + (12 if st == 2.75 else 0) * 0, 0.16 if st % 1 else 0.24, 0.85 if st % 1 == 0 else 0.6), T(b + st))
    # Rhodes comping + pad, once per bar
    if pos == 0:
        bars_left = s1 - b
        for (st, ln, vel) in COMP:
            if b + st >= s1 or (groove == 'outro' and st > 0): break
            for k, m in enumerate(voic):
                add(keys, rhodes(m, T(min(ln, bars_left - st)) + 0.25, 0.22, vel), T(b + st) + k * 0.006, pan=(k - 1.5) * 0.18)
        if groove in ('full', 'build', 'outro'):
            add(pads, pad(voic[:3], T(min(4, s1 - b)) + 0.3, 0.5), T(b))
    # build: rising Rhodes octave stabs + accelerating rim roll in its last bar
    if groove == 'build' and pos in (0, 2):
        add(keys, rhodes(voic[0] + 12 + int(b - s0), 0.4, 0.16, 1.2), T(b + 1))
    if groove == 'build' and s1 - b <= 2:
        for i in range(4): add(drums, rim(0.12 + 0.05 * (i + 4 * (b + 2 - s1))), T(b + i * 0.25), pan=-0.05)
    # section starts
    if first and kind == 'build':
        add(fx, riser(max(0.5, T(s1 - s0) - 0.075), 0.35), T(s0))
    if first and kind in ('drop', 'outro') or b in ACCENTS:
        add(fx, crash(0.22 if kind == 'drop' or b in ACCENTS else 0.12), T(b))
        add(bassb, sub(root - 12, 1.4, 0.9), T(b))
        ring = 2.0 if kind == 'drop' else max(1.2, DUR - T(b))
        for k, m in enumerate(voic + [voic[0] + 12]):
            add(keys, rhodes(m, ring, 0.26, 1.1), T(b) + k * 0.012, pan=(k - 2) * 0.2)

for g0, _ in GAPS:   # stop-time hit on the first instant of each gap, then silence
    add(kickb, kick(1.0), T(g0), force=True); add(drums, clap(0.5), T(g0), force=True); add(drums, rim(0.5), T(g0), force=True)

# ---------- mix ----------
keys = delay(keys, BEAT * 0.75, 0.28, 0.22)
duck = np.ones(N)
kick_env = np.abs(kickb[:, 0]); L_ = int(BEAT * SR)
for b in range(NB):   # bass ducks under every kick that was placed
    i = int(T(b) * SR)
    if i < N and kick_env[i:i + int(0.02 * SR)].max() > 0.05:
        e = 1 - 0.45 * np.exp(-np.arange(L_) / (0.07 * SR)); seg = duck[i:i + L_]; seg[:] = np.minimum(seg, e[:len(seg)])
bassb *= (0.3 + 0.7 * duck)[:, None]
wet = room(keys + pads + drums * 0.4, 1.1, 11, 0.26)
mix = kickb * 0.95 + drums * 0.75 + bassb * 0.9 + keys * 0.85 + pads * 0.6 + fx * 0.6 + wet
mix = filt(mix, 'highpass', 28)
fade = int(0.3 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
peak = np.abs(mix).max(); mix /= peak / 10 ** (-1 / 20)
stem = kickb * 0.95 + drums * 0.8; stem /= peak / 10 ** (-1 / 20)
os.makedirs('audio', exist_ok=True)
sf.write('audio/music.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write('audio/drums.wav', stem.astype(np.float32), SR, subtype='FLOAT')
print(f'audio/music.wav + audio/drums.wav  {DUR}s  {BPM:g} bpm  {NB} beats  sections: ' + ', '.join(f'b{s:g} {k}' for s, k in SECS))
