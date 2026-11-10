// @ts-nocheck
/* Leon market engine (owner, 2026-11-10): the analysis and charts behind «تحلیل بازار», shared word for word by the
   ledger (leon-gold/index.html, copied in between markers by the ledger's market script) and «حساب من» (Market.tsx).
   Plain functions that return HTML/SVG strings, so both can use them; bind(root) wires the finger readouts.
   Input: daily rows oldest first {d: '2026/11/09', j: '1405/08/18', c: close in rial (ounce: dollars)}.
   Tools drawn on a chart (each can be switched off): 20- and 50-day moving averages, Bollinger bands (20, 2σ),
   the trend channel (log-linear regression ± 2σ over the range shown), support and resistance (the range's
   lowest and highest close). Momentum below the price: RSI 14 with its 30 and 70 lines. Two prices never share
   an axis. */
const ME = (function () {
  const OZ = 31.1034768;
  const FD = "۰۱۲۳۴۵۶۷۸۹";
  const toFa = s => String(s).replace(/\d/g, d => FD[d]);
  const fa = (n, d = 0) => Number(n).toLocaleString("fa-IR", { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const tm = r => fa(Math.round(r / 10));
  const pct = (v, d = 1) => v == null || !isFinite(v) ? "—" : (v > 0 ? "▲ " : v < 0 ? "▼ " : "") + fa(Math.abs(v * 100), d) + "٪";
  // signed percent, kept left-to-right inside Persian text so the sign stays in front of the number
  const sgn = (v, d = 1) => v == null || !isFinite(v) ? "—" : "⁦" + (v > 0 ? "+" : v < 0 ? "−" : "") + fa(Math.abs(v * 100), d) + "٪⁩";
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) * (x - m)))); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const sma = (c, n) => c.map((_, i) => i + 1 < n ? null : mean(c.slice(i + 1 - n, i + 1)));
  function rsiS(c, n = 14) {
    const out = c.map(() => null); if (c.length <= n) return out;
    let g = 0, l = 0; for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; if (d > 0) g += d; else l -= d; }
    g /= n; l /= n; out[n] = l === 0 ? 100 : 100 - 100 / (1 + g / l);
    for (let i = n + 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; out[i] = l === 0 ? 100 : 100 - 100 / (1 + g / l); }
    return out;
  }
  // a log-linear trend over a stretch: growth per 30 days, and how far the last close sits from the line (in σ)
  function trendOf(c) {
    const n = c.length; if (n < 5) return null; const y = c.map(Math.log), xm = (n - 1) / 2, ym = mean(y);
    let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (i - xm) * (y[i] - ym); sxx += (i - xm) * (i - xm); }
    const b = sxy / sxx, a = ym - b * xm, res = y.map((v, i) => v - (a + b * i)), s = sd(res);
    let ss = 0, st = 0; for (let i = 0; i < n; i++) { ss += res[i] * res[i]; st += (y[i] - ym) * (y[i] - ym); }
    return { a, b, s, m30: Math.exp(b * 30) - 1, r2: st ? 1 - ss / st : 0, z: s ? res[n - 1] / s : 0, at: i => Math.exp(a + b * i) };
  }
  function stats(rows) {
    const c = rows.map(r => r.c), n = c.length; if (n < 20) return null;
    const last = c[n - 1], ago = k => n > k ? last / c[n - 1 - k] - 1 : null, ret = [];
    for (let i = Math.max(1, n - 30); i < n; i++) ret.push(c[i] / c[i - 1] - 1);
    const m20 = sma(c, 20), m50 = sma(c, 50), rs = rsiS(c), w30 = c.slice(-30), w90 = c.slice(-90);
    const s20 = m20[n - 1], s50 = m50[n - 1] ?? mean(c.slice(-50)), p50 = m50[Math.max(0, n - 11)] ?? s50;
    let peak = -Infinity, dd = 0; for (const v of w90) { peak = Math.max(peak, v); dd = Math.min(dd, v / peak - 1); }
    let streak = 0; for (let i = n - 1; i > 0; i--) { const s = Math.sign(c[i] - c[i - 1]); if (!s) break; if (!streak || Math.sign(streak) === s) streak += s; else break; }
    const sd20 = sd(c.slice(-20)), t90 = trendOf(w90), t30 = trendOf(w30);
    const trend = last > s50 && s20 > s50 && s50 >= p50 ? "up" : last < s50 && s20 < s50 && s50 <= p50 ? "down" : "flat";
    return { last, d1: ago(1), d7: ago(7), d30: ago(30), d90: ago(90), d180: ago(180), d365: ago(365), s20, s50, slope50: p50 ? s50 / p50 - 1 : 0,
      lo30: Math.min(...w30), hi30: Math.max(...w30), lo90: Math.min(...w90), hi90: Math.max(...w90), hiAll: Math.max(...c), swing: mean(ret.map(Math.abs)), vol: sd(ret),
      rsi: rs[n - 1] ?? 50, bbU: s20 + 2 * sd20, bbL: s20 - 2 * sd20, bbW: s20 ? 4 * sd20 / s20 : 0, dd90: dd, streak, t30, t90, trend,
      pos30: Math.max(...w30) > Math.min(...w30) ? (last - Math.min(...w30)) / (Math.max(...w30) - Math.min(...w30)) : .5 };
  }
  // gold's premium: Tehran's gram against ounce × free dollar; in toman per gram, in dollars per ounce, and as the dollar gold is priced at
  function join(H) {
    const by = L => Object.fromEntries(L.map(r => [r.d, r.c])), D = by(H.d), O = by(H.o);
    return H.g.filter(r => D[r.d] && O[r.d]).map(r => { const fair = O[r.d] * D[r.d] / OZ * .75; return { d: r.d, j: r.j, c: r.c / fair - 1, g: r.c, usd: D[r.d], oz: O[r.d], fair }; });
  }
  function bubble(H, L) {
    const J = join(H); if (J.length < 30) return null;
    const lastJ = J[J.length - 1], gp = L && L.gp || lastJ.g, usd = L && L.usd || lastJ.usd, oz = L && L.ounce || lastJ.oz;
    const fair = oz * usd / OZ * .75, prem = gp / fair - 1, pr = J.map(x => x.c), a90 = mean(pr.slice(-90)), s90 = sd(pr.slice(-90)), a365 = mean(pr.slice(-365));
    const lo = Math.min(...pr.slice(-365)), hi = Math.max(...pr.slice(-365)), rank = pr.slice(-365).filter(x => x < prem).length / Math.min(365, pr.length);
    return { J, gp, usd, oz, fair, prem, gapT: gp - fair, impOz: gp / .75 * OZ / usd, impUsd: gp / (oz * .75 / OZ), a90, s90, a365, lo, hi, rank, z: s90 ? (prem - a90) / s90 : 0 };
  }
  // what moved gold over a stretch: the dollar, the world ounce, or the premium (log shares that add up)
  function split(B, from) {
    const J = B.J, a = J.find(x => x.d >= from), b = J[J.length - 1]; if (!a || a === b) return null;
    return { g: Math.exp(Math.log(b.g / a.g)) - 1, d: Math.log(b.usd / a.usd), o: Math.log(b.oz / a.oz), p: Math.log((1 + b.c) / (1 + a.c)) };
  }
  const TR = { up: "صعودی", down: "نزولی", flat: "بی‌جهت" };
  const LEVEL = z => z > 1.5 ? "خیلی بالاتر از معمول" : z > .5 ? "بالاتر از معمول" : z < -1.5 ? "خیلی پایین‌تر از معمول" : z < -.5 ? "پایین‌تر از معمول" : "نزدیک معمول";

  // ---------- the reading: one card per subject, each line with its tone ----------
  function verdict(B) {
    if (!B) return null;
    const cheap = B.z < -.5, dear = B.z > .5;
    return { tone: cheap ? "up" : dear ? "down" : "flat",
      title: cheap ? "طلا در ایران الان ارزان‌تر از معمول است" : dear ? "طلا در ایران الان گران‌تر از معمول است" : "طلا در ایران الان به قیمت معمول خودش است",
      sub: `حباب ${sgn(B.prem)} (میانگین سه ماه ${sgn(B.a90)}) · ${B.gapT >= 0 ? "هر گرم " + tm(B.gapT) + " تومان بالای" : "هر گرم " + tm(-B.gapT) + " تومان زیر"} ارزش جهانی` };
  }
  function reading(G, D, Oz, B, H) {
    const sec = [];
    const asset = (S, name, unit) => {
      if (!S) return null; const L = [];
      L.push({ t: S.trend === "up" ? "up" : S.trend === "down" ? "down" : "flat", h: `<b>روند میان‌مدت ${TR[S.trend]}.</b> قیمت ${S.last >= S.s50 ? "بالای" : "زیر"} میانگین ۵۰ روزه (${unit(S.s50)}) و میانگین ۲۰ روزه ${S.s20 >= S.s50 ? "بالای" : "زیر"} آن؛ میانگین ۵۰ روزه در ۱۰ روز ${pct(S.slope50, 2)} ${S.slope50 > 0 ? "بالا رفته" : "پایین آمده"}.` });
      if (S.t90) L.push({ t: S.t90.m30 > 0 ? "up" : "down", h: `<b>خط روند ۹۰ روزه:</b> ماهانه ${pct(S.t90.m30)} (قدرت روند ${fa(Math.max(0, S.t90.r2) * 100)}٪). قیمت ${Math.abs(S.t90.z) < .5 ? "روی خط" : S.t90.z > 0 ? fa(S.t90.z, 1) + " انحراف معیار بالای خط" : fa(-S.t90.z, 1) + " انحراف معیار زیر خط"} است${S.t90.z > 1.5 ? "؛ کشیده شده و جای اصلاح دارد" : S.t90.z < -1.5 ? "؛ زیادی افت کرده و جای برگشت دارد" : ""}.` });
      L.push({ t: "flat", h: `<b>تغییرها:</b> روز ${pct(S.d1, 2)} · هفته ${pct(S.d7)} · ماه ${pct(S.d30)} · سه ماه ${pct(S.d90)}${S.d365 != null ? " · سال " + pct(S.d365) : ""}.` });
      L.push({ t: S.pos30 > .8 ? "down" : S.pos30 < .2 ? "up" : "flat", h: `<b>حمایت و مقاومت ۳۰ روزه:</b> کف ${unit(S.lo30)} و سقف ${unit(S.hi30)}؛ قیمت در ${fa(S.pos30 * 100)}٪ این دامنه است.${S.last >= S.hi90 ? " <b>سقف تازه‌ی ۹۰ روزه.</b>" : S.last <= S.lo90 ? " <b>کف تازه‌ی ۹۰ روزه.</b>" : ""}` });
      L.push({ t: S.rsi >= 70 ? "down" : S.rsi <= 30 ? "up" : "flat", h: `<b>RSI ${fa(S.rsi)}:</b> ${S.rsi >= 70 ? "اشباع خرید؛ معمولاً بعدش مکث یا اصلاح می‌آید." : S.rsi <= 30 ? "اشباع فروش؛ معمولاً بعدش برگشت کوچکی می‌آید." : S.rsi >= 55 ? "قدرت با خریدارهاست." : S.rsi <= 45 ? "قدرت با فروشنده‌هاست." : "متعادل."}${S.streak ? ` ${fa(Math.abs(S.streak))} روز پشت سر هم ${S.streak > 0 ? "بالا" : "پایین"}.` : ""}` });
      L.push({ t: "flat", h: `<b>نوسان:</b> معمول روزانه ${fa(S.swing * 100, 1)}٪؛ پهنای باند بولینگر ${fa(S.bbW * 100, 1)}٪${S.bbW < .03 ? " (فشرده؛ معمولاً قبل از یک حرکت بزرگ)" : ""}. بیشترین افت از سقف در سه ماه: ${pct(S.dd90)}.` });
      return { name, L };
    };
    const g = asset(G, "طلای ۱۸ عیار", v => tm(v) + " تومان"), d = asset(D, "دلار آزاد", v => tm(v) + " تومان"), o = asset(Oz, "انس جهانی", v => fa(v) + " دلار");
    if (B) {
      const L = [], s = split(B, H.g[Math.max(0, H.g.length - 31)].d);
      L.push({ t: B.z < -.5 ? "up" : B.z > .5 ? "down" : "flat", h: `<b>به ریال:</b> ارزش جهانی هر گرم ۱۸ عیار (انس ${fa(B.oz)} دلار × دلار ${tm(B.usd)} تومان) ${tm(B.fair)} تومان است و بازار تهران ${tm(B.gp)} تومان؛ یعنی هر گرم <b>${tm(Math.abs(B.gapT))} تومان ${B.gapT >= 0 ? "گران‌تر" : "ارزان‌تر"}</b> (${sgn(B.prem)}).` });
      L.push({ t: "flat", h: `<b>به انس:</b> قیمت طلای تهران با دلار آزاد یعنی انس <b>${fa(B.impOz)} دلار</b>، در حالی که انس جهانی ${fa(B.oz)} دلار است (${B.impOz >= B.oz ? "+" : "−"}${fa(Math.abs(B.impOz - B.oz))} دلار). به زبان دیگر، طلا در تهران با دلار ${tm(B.impUsd)} تومانی قیمت خورده، نه ${tm(B.usd)}.` });
      L.push({ t: B.z < -.5 ? "up" : B.z > .5 ? "down" : "flat", h: `<b>نسبت به معمول:</b> میانگین حباب سه ماه ${sgn(B.a90)} و یک سال ${sgn(B.a365)}؛ دامنه‌ی یک سال از ${sgn(B.lo)} تا ${sgn(B.hi)}. حباب امروز ${LEVEL(B.z)} است (${fa(B.rank * 100)}٪ روزهای سال پایین‌تر بوده).` });
      if (s) { const lead = [["دلار", s.d], ["انس جهانی", s.o], ["حباب", s.p]].sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]))[0];
        L.push({ t: "flat", h: `<b>چه چیزی طلا را در ۳۰ روز تکان داد:</b> طلا ${pct(s.g)} = دلار ${pct(Math.exp(s.d) - 1)} + انس ${pct(Math.exp(s.o) - 1)} + حباب ${pct(Math.exp(s.p) - 1)}. بیشترین سهم با <b>${lead[0]}</b>.` }); }
      sec.unshift({ name: "حباب طلا", L });
    }
    return sec.concat([g, d, o].filter(Boolean));
  }
  // events worth a flash: new highs and lows, a cross of the 50-day average, RSI extremes, an unusual premium
  function events(G, D, B) {
    const E = [];
    const one = (S, n) => { if (!S) return;
      if (S.last >= S.hi90) E.push({ t: "up", h: `${n}: سقف تازه‌ی ۹۰ روزه` }); else if (S.last <= S.lo90) E.push({ t: "down", h: `${n}: کف تازه‌ی ۹۰ روزه` });
      if (S.rsi >= 70) E.push({ t: "down", h: `${n}: اشباع خرید (RSI ${fa(S.rsi)})` }); else if (S.rsi <= 30) E.push({ t: "up", h: `${n}: اشباع فروش (RSI ${fa(S.rsi)})` });
      if (S.d1 != null && Math.abs(S.d1) > 2 * S.swing && S.swing) E.push({ t: S.d1 > 0 ? "up" : "down", h: `${n}: حرکت بزرگ امروز ${pct(S.d1)}` }); };
    one(G, "طلا"); one(D, "دلار");
    if (B && Math.abs(B.z) > 1) E.push({ t: B.z < 0 ? "up" : "down", h: B.z < 0 ? "حباب طلا خیلی پایین: طلا در ایران ارزان است" : "حباب طلا خیلی بالا: طلا در ایران گران است" });
    return E;
  }

  // ---------- charts ----------
  const REG = {}; let seq = 0;
  const W = 360, Hh = 210, PL = 4, PR = 52, PT = 10, PB = 22;
  function frame(n, lo, hi, h = Hh) { const x = i => PL + (W - PL - PR) * (n > 1 ? i / (n - 1) : 0), y = v => PT + (h - PT - PB) * (1 - (v - lo) / (hi - lo || 1)); return { x, y }; }
  const path = (a, x, y) => { let s = "", on = false; a.forEach((v, i) => { if (v == null) { on = false; return; } s += (on ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1); on = true; }); return s; };
  // tools: Set of ma20, ma50, bb, reg, sr
  function chart(rows, all, o) {
    const n = rows.length; if (n < 5) return '<div class="me-empty">تاریخچه‌ای نیامد.</div>';
    const off = all.length - n, ac = all.map(r => r.c), m20 = sma(ac, 20).slice(off), m50 = sma(ac, 50).slice(off), r = rsiS(ac).slice(off);
    const sd20 = ac.map((_, i) => i < 19 ? null : sd(ac.slice(i - 19, i + 1))).slice(off), bbU = m20.map((m, i) => m == null ? null : m + 2 * sd20[i]), bbL = m20.map((m, i) => m == null ? null : m - 2 * sd20[i]);
    const c = rows.map(x => x.c), T = o.tools, tr = T.has("reg") ? trendOf(c) : null;
    const tU = tr ? c.map((_, i) => tr.at(i) * Math.exp(2 * tr.s)) : [], tL = tr ? c.map((_, i) => tr.at(i) * Math.exp(-2 * tr.s)) : [], tM = tr ? c.map((_, i) => tr.at(i)) : [];
    const vals = c.concat(T.has("ma20") ? m20 : [], T.has("ma50") ? m50 : [], T.has("bb") ? bbU.concat(bbL) : [], tr ? tU.concat(tL) : []).filter(v => v != null);
    let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * .06 || hi * .01; lo -= pad; hi += pad;
    const { x, y } = frame(n, lo, hi), id = "me" + (++seq), fmt = o.unit === "usd" ? (v => fa(v)) : tm;
    const sMax = Math.max(...c), sMin = Math.min(...c), last = c[n - 1], up = last >= c[0];
    REG[id] = { rows, c, m20, m50, r, bbU, bbL, x, y, n, fmt, unit: o.unit };
    let g = "";
    for (let k = 0; k < 4; k++) { const v = lo + (hi - lo) * (k + .5) / 4; g += `<line class="me-gl" x1="${PL}" x2="${W - PR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="me-t" x="${W - PR + 4}" y="${(y(v) + 3).toFixed(1)}">${fmt(v)}</text>`; }
    if (T.has("bb")) { const up2 = path(bbU, x, y), lo2 = bbL.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean).reverse().map(p => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(""); if (up2) g += `<path class="me-bb" d="${up2}${lo2}Z"/>`; }
    if (tr) g += `<path class="me-reg" d="${path(tU, x, y)}"/><path class="me-reg" d="${path(tL, x, y)}"/><path class="me-regm" d="${path(tM, x, y)}"/>`;
    if (T.has("sr")) g += `<line class="me-res" x1="${PL}" x2="${W - PR}" y1="${y(sMax).toFixed(1)}" y2="${y(sMax).toFixed(1)}"/><text class="me-tr" x="${PL + 2}" y="${(y(sMax) - 4).toFixed(1)}">مقاومت ${fmt(sMax)}</text>`
      + `<line class="me-sup" x1="${PL}" x2="${W - PR}" y1="${y(sMin).toFixed(1)}" y2="${y(sMin).toFixed(1)}"/><text class="me-ts" x="${PL + 2}" y="${(y(sMin) + 12).toFixed(1)}">حمایت ${fmt(sMin)}</text>`;
    if (T.has("ma50")) g += `<path class="me-m50" d="${path(m50, x, y)}"/>`;
    if (T.has("ma20")) g += `<path class="me-m20" d="${path(m20, x, y)}"/>`;
    const area = `M${x(0).toFixed(1)} ${y(lo).toFixed(1)}` + c.map((v, i) => "L" + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("") + `L${x(n - 1).toFixed(1)} ${y(lo).toFixed(1)}Z`;
    g += `<path class="me-area" d="${area}"/><path class="me-l${o.anim ? " me-draw" : ""}" pathLength="1" d="${path(c, x, y)}"/>`;
    g += `<line class="me-base" x1="${PL}" x2="${W - PR}" y1="${Hh - PB}" y2="${Hh - PB}"/>`;
    [0, Math.round((n - 1) / 3), Math.round(2 * (n - 1) / 3), n - 1].forEach((i, k) => { g += `<text class="me-t" x="${x(i).toFixed(1)}" y="${Hh - 6}" text-anchor="${k === 0 ? "start" : k === 3 ? "end" : "middle"}">${toFa(rows[i].j.slice(5))}</text>`; });
    g += `<g class="me-now"><circle class="me-ring" cx="${x(n - 1).toFixed(1)}" cy="${y(last).toFixed(1)}" r="4"/><circle class="me-dot" cx="${x(n - 1).toFixed(1)}" cy="${y(last).toFixed(1)}" r="4"/></g>`
      + `<g class="me-tag"><rect x="${W - PR + 1}" y="${(y(last) - 9).toFixed(1)}" width="${PR - 1}" height="18" rx="5"/><text x="${W - PR + 4}" y="${(y(last) + 4).toFixed(1)}">${fmt(last)}</text></g>`
      + `<line class="me-cur" x1="0" x2="0" y1="${PT}" y2="${Hh - PB}" visibility="hidden"/><circle class="me-cd" r="4" cx="0" cy="0" visibility="hidden"/>`;
    // RSI below, its own scale
    const RH = 70, ry = v => 6 + (RH - 12) * (1 - v / 100);
    let rs = `<rect class="me-rz" x="${PL}" y="${ry(70).toFixed(1)}" width="${W - PL - PR}" height="${(ry(30) - ry(70)).toFixed(1)}"/><line class="me-rl" x1="${PL}" x2="${W - PR}" y1="${ry(70)}" y2="${ry(70)}"/><line class="me-rl" x1="${PL}" x2="${W - PR}" y1="${ry(30)}" y2="${ry(30)}"/>`
      + `<text class="me-t" x="${W - PR + 4}" y="${ry(70) + 3}">۷۰</text><text class="me-t" x="${W - PR + 4}" y="${ry(30) + 3}">۳۰</text><path class="me-rsi" d="${path(r, x, ry)}"/><line class="me-cur" x1="0" x2="0" y1="4" y2="${RH - 4}" visibility="hidden"/>`;
    const tools = [["ma20", "میانگین ۲۰"], ["ma50", "میانگین ۵۰"], ["bb", "باند بولینگر"], ["reg", "کانال روند"], ["sr", "حمایت و مقاومت"]];
    return `<figure class="me-fig me-${o.kind}" data-me="${id}" data-kind="${o.kind}"><figcaption><b>${esc(o.title)}</b><span class="me-chg ${up ? "up" : "dn"}">${pct(last / c[0] - 1)} در این بازه</span></figcaption>`
      + `<div class="me-tools" role="group" aria-label="ابزارهای نمودار">${tools.map(([k, t]) => `<button type="button" class="me-tool me-k-${k}${T.has(k) ? " on" : ""}" data-me-tool="${k}" aria-pressed="${T.has(k)}"><i></i>${t}</button>`).join("")}</div>`
      + `<p class="me-read" aria-live="polite">انگشت را روی نمودار بکش.</p>`
      + `<svg class="me-svg" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${esc(o.title)}">${g}</svg>`
      + `<div class="me-rsiw"><span class="me-rsit">RSI ۱۴ <b>${fa(r[n - 1] ?? 50)}</b></span><svg class="me-svg me-rsis" viewBox="0 0 ${W} ${RH}" aria-hidden="true">${rs}</svg></div></figure>`;
  }
  function bubbleChart(B, n, anim) {
    const J = B.J.slice(-n); if (J.length < 5) return "";
    const p = J.map(x => x.c), a = B.a90, vals = p.concat([0, a]); let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * .1 || .01; lo -= pad; hi += pad;
    const { x, y } = frame(J.length, lo, hi), id = "me" + (++seq);
    REG[id] = { rows: J, c: p, x, y, n: J.length, fmt: v => sgn(v), unit: "pct", bub: true };
    let g = ""; for (let k = 0; k < 4; k++) { const v = lo + (hi - lo) * (k + .5) / 4; g += `<line class="me-gl" x1="${PL}" x2="${W - PR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="me-t" x="${W - PR + 4}" y="${(y(v) + 3).toFixed(1)}">${sgn(v, 0)}</text>`; }
    const z = y(0).toFixed(1), area = `M${x(0).toFixed(1)} ${z}` + p.map((v, i) => "L" + x(i).toFixed(1) + " " + y(v).toFixed(1)).join("") + `L${x(J.length - 1).toFixed(1)} ${z}Z`;
    g += `<clipPath id="${id}a"><rect x="0" y="0" width="${W}" height="${z}"/></clipPath><clipPath id="${id}b"><rect x="0" y="${z}" width="${W}" height="${Hh}"/></clipPath>`
      + `<path class="me-bpos" clip-path="url(#${id}a)" d="${area}"/><path class="me-bneg" clip-path="url(#${id}b)" d="${area}"/>`
      + `<line class="me-zero" x1="${PL}" x2="${W - PR}" y1="${z}" y2="${z}"/><line class="me-avg" x1="${PL}" x2="${W - PR}" y1="${y(a).toFixed(1)}" y2="${y(a).toFixed(1)}"/><text class="me-tr" x="${PL + 2}" y="${(y(a) - 4).toFixed(1)}">میانگین سه ماه ${sgn(a)}</text>`
      + `<path class="me-l me-lb${anim ? " me-draw" : ""}" pathLength="1" d="${path(p, x, y)}"/><line class="me-base" x1="${PL}" x2="${W - PR}" y1="${Hh - PB}" y2="${Hh - PB}"/>`;
    [0, Math.round((J.length - 1) / 2), J.length - 1].forEach((i, k) => { g += `<text class="me-t" x="${x(i).toFixed(1)}" y="${Hh - 6}" text-anchor="${k === 0 ? "start" : k === 2 ? "end" : "middle"}">${toFa(J[i].j.slice(5))}</text>`; });
    g += `<g class="me-now"><circle class="me-ring" cx="${x(J.length - 1).toFixed(1)}" cy="${y(p[p.length - 1]).toFixed(1)}" r="4"/><circle class="me-dot" cx="${x(J.length - 1).toFixed(1)}" cy="${y(p[p.length - 1]).toFixed(1)}" r="4"/></g><line class="me-cur" x1="0" x2="0" y1="${PT}" y2="${Hh - PB}" visibility="hidden"/><circle class="me-cd" r="4" cx="0" cy="0" visibility="hidden"/>`;
    return `<figure class="me-fig me-bub" data-me="${id}"><figcaption><b>حباب طلا (٪ نسبت به ارزش انس × دلار آزاد)</b><span class="me-chg ${B.prem <= B.a90 ? "up" : "dn"}">امروز ${sgn(B.prem)}</span></figcaption>`
      + `<p class="me-read" aria-live="polite">بالای صفر: گران‌تر از ارزش جهانی · زیر صفر: ارزان‌تر</p><svg class="me-svg" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="حباب طلا">${g}</svg></figure>`;
  }
  // the finger readout on every chart inside root
  function bind(root) {
    root.querySelectorAll(".me-fig").forEach(f => {
      if (f.__meb) return; f.__meb = 1; const R = REG[f.dataset.me]; if (!R) return;
      const svgs = f.querySelectorAll(".me-svg"), read = f.querySelector(".me-read");
      const go = e => { const b = svgs[0].getBoundingClientRect(), fx = (e.clientX - b.left) / b.width * W, i = Math.max(0, Math.min(R.n - 1, Math.round((fx - PL) / (W - PL - PR) * (R.n - 1)))), X = R.x(i);
        f.querySelectorAll(".me-cur").forEach(l => { l.setAttribute("x1", X); l.setAttribute("x2", X); l.setAttribute("visibility", "visible"); });
        const cd = f.querySelector(".me-cd"); if (cd) { cd.setAttribute("cx", X); cd.setAttribute("cy", R.y(R.c[i])); cd.setAttribute("visibility", "visible"); }
        const r = R.rows[i], prev = i ? R.c[i - 1] : null;
        read.innerHTML = `<b>${toFa(r.j)}</b> · ${R.bub ? "حباب " + sgn(R.c[i]) + " · طلا " + tm(r.g) + " · ارزش جهانی " + tm(r.fair) + " تومان" : R.fmt(R.c[i]) + (R.unit === "usd" ? " دلار" : " تومان") + (prev ? ` <span class="${R.c[i] >= prev ? "up" : "dn"}">${pct(R.c[i] / prev - 1, 2)}</span>` : "") + (R.m20[i] ? ` · م۲۰ ${R.fmt(R.m20[i])}` : "") + (R.m50[i] ? ` · م۵۰ ${R.fmt(R.m50[i])}` : "") + (R.r[i] != null ? ` · RSI ${fa(R.r[i])}` : "")}`; };
      svgs.forEach(s => { s.addEventListener("pointermove", go); s.addEventListener("pointerdown", go); });
    });
  }
  // a live number that changed: it rolls in and its card glows green or red for a moment
  function flash(el, dir) {
    if (!el || !el.animate || (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    const col = dir > 0 ? "rgba(15,122,82,.28)" : "rgba(163,57,43,.26)", ease = "cubic-bezier(0.23, 1, 0.32, 1)";
    el.animate([{ boxShadow: `0 0 0 3px ${col}, 0 0 28px ${col}` }, { boxShadow: "0 0 0 0 transparent, 0 0 0 transparent" }], { duration: 1400, easing: ease });
    const b = el.querySelector("b"); if (b) b.animate([{ transform: `translateY(${dir > 0 ? 40 : -40}%)`, opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 420, easing: ease });
  }
  // ---------- the whole page: verdict, events, live tiles, range, four charts, the reading ----------
  // st: { range: 30|90|180|365, tools: { gold: Set, usd: Set, oz: Set }, anim: bool }
  function page(H, L, st) {
    if (!H || !H.g || H.g.length < 20) return '<div class="me-page"><div class="me-load" role="status"><i></i><i></i><i></i><span>در حال آوردن تاریخچه‌ی قیمت…</span></div></div>';
    const G = stats(H.g), D = stats(H.d), O = stats(H.o), B = bubble(H, L), V = verdict(B), E = events(G, D, B), n = st.range;
    const gp = L && L.gp || G.last, usd = L && L.usd || D && D.last, oz = L && L.ounce || O && O.last;
    const tile = (k, name, v, unit, sub, cls) => `<div class="me-tile${cls ? " " + cls : ""}" data-me-live="${k}"><small>${name}</small><b>${v}</b><span>${unit}</span><em>${sub}</em></div>`;
    const R = reading(G, D, O, B, H);
    return '<div class="me-page">'
      + (V ? `<section class="me-hero me-tone-${V.tone}"><span class="me-hk">جمع‌بندی امروز</span><h2>${V.title}</h2><p>${V.sub}</p>`
        + (E.length ? `<div class="me-ev">${E.map((e, i) => `<span class="me-e me-e-${e.t}" style="--i:${i}">${e.h}</span>`).join("")}</div>` : "") + "</section>" : "")
      + '<div class="me-now">'
      + tile("gp", "طلای ۱۸ عیار · هر گرم", tm(gp), "تومان", `روز ${pct(G.d1, 2)} · ماه ${pct(G.d30)}`, "")
      + (usd ? tile("usd", "دلار آزاد تهران", tm(usd), "تومان", D ? `روز ${pct(D.d1, 2)} · ماه ${pct(D.d30)}` : "", "") : "")
      + (oz ? tile("oz", "انس جهانی طلا", fa(oz), "دلار", O ? `روز ${pct(O.d1, 2)} · ماه ${pct(O.d30)}` : "", "") : "")
      + (B ? tile("prem", "حباب طلا", sgn(B.prem), B.gapT >= 0 ? "گران‌تر از جهانی" : "ارزان‌تر از جهانی", `هر گرم ${tm(Math.abs(B.gapT))} تومان · انس تهران ${fa(B.impOz)} دلار`, B.z < -.5 ? "is-up" : B.z > .5 ? "is-dn" : "") : "")
      + "</div>"
      + `<div class="me-range" role="group" aria-label="بازه‌ی نمودارها">${[[30, "۱ ماه"], [90, "۳ ماه"], [180, "۶ ماه"], [365, "۱ سال"]].map(([v, t]) => `<button type="button" data-me-range="${v}" class="${n === v ? "on" : ""}" aria-pressed="${n === v}">${t}</button>`).join("")}</div>`
      + '<div class="me-charts">'
      + chart(H.g.slice(-n), H.g, { tools: st.tools.gold, kind: "gold", title: "طلای ۱۸ عیار · تومان هر گرم", unit: "rial", anim: st.anim })
      + (H.d.length > 20 ? chart(H.d.slice(-n), H.d, { tools: st.tools.usd, kind: "usd", title: "دلار آزاد · تومان", unit: "rial", anim: st.anim }) : "")
      + (B ? bubbleChart(B, n, st.anim) : "")
      + (H.o.length > 20 ? chart(H.o.slice(-n), H.o, { tools: st.tools.oz, kind: "oz", title: "انس جهانی طلا · دلار", unit: "usd", anim: st.anim }) : "")
      + "</div>"
      + `<div class="me-reading">${R.map(s => `<section class="me-rc"><h3>${s.name}</h3><ul>${s.L.map(l => `<li class="me-li me-li-${l.t}">${l.h}</li>`).join("")}</ul></section>`).join("")}</div>`
      + '<p class="me-note">این تحلیل از روی قیمت‌های گذشته (tgju و تابلوی اتحادیه) حساب شده و پیش‌بینی قطعی نیست؛ برای تصمیم، کنار تجربه‌ی بازار خودتان ببینید. حباب با فرض ۰٫۷۵ عیار و ۳۱٫۱ گرم در هر انس حساب شده.</p>'
      + "</div>";
  }
  const TOOLS0 = () => ({ gold: new Set(["ma20", "ma50", "bb", "sr"]), usd: new Set(["ma20", "ma50", "reg"]), oz: new Set(["ma50", "reg"]) });
  // the live values a page shows, to compare with the next refresh
  function liveOf(H, L) { const B = H && bubble(H, L); return { gp: L && L.gp || 0, usd: L && L.usd || 0, oz: L && L.ounce || 0, prem: B ? B.prem : 0 }; }
  // after a refresh: flash each tile whose number moved
  function flashAll(root, before, after) { if (!before) return; ["gp", "usd", "oz", "prem"].forEach(k => { const a = before[k], b = after[k]; if (a && b && Math.abs(b - a) > Math.abs(a) * 1e-6) flash(root.querySelector(`[data-me-live="${k}"]`), b > a ? 1 : -1); }); }

  return { page, TOOLS0, liveOf, flashAll, OZ, fa, tm, pct, sgn, toFa, stats, bubble, verdict, reading, events, chart, bubbleChart, bind, flash, TR };
})();
export default ME;
