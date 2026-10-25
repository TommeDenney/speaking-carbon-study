(() => {
  "use strict";

  // ---------- utils ----------
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem("sc:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("sc:" + k, JSON.stringify(v)); } catch {} },
  };
  const guideByN = Object.fromEntries(GUIDE.map((g) => [g.n, g]));

  // ---------- source references ----------
  function lectureRanges(item) {
    let r = item.p ? item.p.map((x) => x.slice()) : [];
    if (!r.length && item.g && guideByN[item.g]) {
      r = guideByN[item.g].s.map(([w, a, b]) => [a + WEEK_OFFSET[w], b + WEEK_OFFSET[w]]);
    }
    r.sort((x, y) => x[0] - y[0]);
    const out = [];
    for (const x of r) {
      const last = out[out.length - 1];
      if (last && x[0] <= last[1] + 1) last[1] = Math.max(last[1], x[1]);
      else out.push(x);
    }
    return out;
  }
  const fmtRanges = (r) => r.map(([a, b]) => (a === b ? a : a + "–" + b)).join(", ");

  function refsHTML(item) {
    const parts = [];
    if (item.g) {
      const g = guideByN[item.g];
      parts.push(`<a href="#q${item.g}" class="ref" data-guide="${item.g}" title="Open in the Guide tab">📖 Study Guide Q${item.g} · p. ${g.gp}</a>`);
    }
    const r = lectureRanges(item);
    if (r.length) parts.push(`<span class="ref" title="Page numbers in the combined SpeakingCarbonLectures PDF">🖥 Lectures PDF p. ${fmtRanges(r)}</span>`);
    return parts.join("");
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-guide]");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    openGuide(+a.dataset.guide);
  });

  // ---------- figures (recreated from lecture graphs, illustrative) ----------
  const C = { plum: "#7b569f", rose: "#d889a6", sage: "#5d8a63", mint: "#9fc1a2", lav: "#a98fd1", ink: "#6d5d79", line: "#e3d8e6", teal: "#4c7e86" };
  const svg = (w, h, body, title) =>
    `<svg class="svgfig" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">${body}</svg>`;
  const pts = (arr) => arr.map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)).join(" ");

  const FIGS = {
    keeling() {
      const W = 420, H = 210, L = 40, R = 410, T = 26, B = 180;
      const x = (t) => L + ((t - 1958) / 68) * (R - L);
      const y = (v) => B - ((v - 270) / 170) * (B - T);
      const p = [];
      for (let m = 0; m <= 68 * 12; m += 2) {
        const t = 1958 + m / 12, d = t - 1958;
        p.push([x(t), y(315 + 0.825 * d + 0.0123 * d * d + 3 * Math.sin(2 * Math.PI * (t - 0.1)))]);
      }
      return svg(W, H, `
        <text class="ttl" x="${L}" y="16">Keeling Curve · Mauna Loa CO₂ (ppm)</text>
        <line x1="${L}" y1="${y(280)}" x2="${R}" y2="${y(280)}" stroke="${C.rose}" stroke-dasharray="5 4" stroke-width="1.5"/>
        <text x="${L + 6}" y="${y(280) - 5}" style="fill:${C.rose}">pre-industrial ≈ 280</text>
        <polyline points="${pts(p)}" fill="none" stroke="${C.plum}" stroke-width="1.6"/>
        <circle cx="${x(2026)}" cy="${y(428)}" r="4" fill="${C.rose}"/>
        <text x="${x(2026) - 4}" y="${y(428) - 9}" text-anchor="end" style="fill:${C.plum}">~428 (2026)</text>
        <text x="${x(1975)}" y="${y(370)}" style="fill:${C.sage}">sawtooth = NH seasons 🌱</text>
        <line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${C.line}"/>
        ${[1960, 1980, 2000, 2020].map((t) => `<text x="${x(t)}" y="${B + 16}" text-anchor="middle">${t}</text>`).join("")}
        ${[300, 350, 400].map((v) => `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
      `, "Keeling Curve sketch");
    },
    reservoirs() {
      const rows = [["Rocks / geological", 1e8, C.ink], ["Ocean", 38000, C.teal], ["Plants & soils", 3800, C.sage], ["Atmosphere", 590, C.lav]];
      const L = 120, R = 400, x = (v) => L + ((Math.log10(v) - 2) / 6) * (R - L);
      return svg(420, 170, `
        <text class="ttl" x="10" y="16">Pre-industrial carbon stocks (GtC, log scale)</text>
        ${rows.map(([n, v, c], i) => {
          const yy = 32 + i * 32;
          return `<text x="${L - 8}" y="${yy + 15}" text-anchor="end">${n}</text>
            <rect x="${L}" y="${yy}" width="${x(v) - L}" height="22" rx="6" fill="${c}" opacity=".85"/>
            <text x="${Math.min(x(v), R) - 6}" y="${yy + 15}" text-anchor="end" style="fill:#fff">${v.toLocaleString()}</text>`;
        }).join("")}
        <text x="${L}" y="164">10²</text><text x="${(L + R) / 2}" y="164" text-anchor="middle">10⁵</text><text x="${R}" y="164" text-anchor="end">10⁸</text>
      `, "Carbon reservoir sizes");
    },
    waterfall() {
      const steps = [["GPP", 0, 100, C.sage], ["−R_A", 50, 100, C.rose], ["NPP", 0, 50, C.sage], ["−R_H", 10, 50, C.rose], ["NEP", 0, 10, C.sage], ["−fire/\nharvest", 4, 10, C.rose], ["NBP", 0, 4, C.plum]];
      const T = 30, B = 170, y = (v) => B - (v / 100) * (B - T), bw = 44, gap = 12, L = 22;
      return svg(420, 200, `
        <text class="ttl" x="10" y="16">GPP → NPP → NEP → NBP (illustrative)</text>
        ${steps.map(([n, lo, hi, c], i) => {
          const xx = L + i * (bw + gap);
          return `<rect x="${xx}" y="${y(hi)}" width="${bw}" height="${y(lo) - y(hi)}" rx="5" fill="${c}" opacity=".88"/>
            <text x="${xx + bw / 2}" y="${B + 15}" text-anchor="middle">${n.split("\n")[0]}</text>
            ${n.includes("\n") ? `<text x="${xx + bw / 2}" y="${B + 27}" text-anchor="middle">${n.split("\n")[1]}</text>` : ""}`;
        }).join("")}
        <line x1="14" y1="${B}" x2="410" y2="${B}" stroke="${C.line}"/>
        <text x="410" y="${y(100) + 10}" text-anchor="end" style="fill:${C.rose}">R_A ≈ 50% of GPP</text>
      `, "Production waterfall");
    },
    bjerrum() {
      const L = 36, R = 408, T = 26, B = 160, pK1 = 6.0, pK2 = 9.1;
      const x = (pH) => L + ((pH - 4) / 8) * (R - L), y = (f) => B - f * (B - T);
      const s = [[], [], []];
      for (let pH = 4; pH <= 12.001; pH += 0.1) {
        const H = 10 ** -pH, K1 = 10 ** -pK1, K2 = 10 ** -pK2, d = H * H + K1 * H + K1 * K2;
        s[0].push([x(pH), y((H * H) / d)]); s[1].push([x(pH), y((K1 * H) / d)]); s[2].push([x(pH), y((K1 * K2) / d)]);
      }
      return svg(420, 196, `
        <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${C.rose}"/></marker></defs>
        <text class="ttl" x="${L}" y="16">Bjerrum plot · fraction of DIC vs pH</text>
        <rect x="${x(7.8)}" y="${T}" width="${x(8.3) - x(7.8)}" height="${B - T}" fill="${C.mint}" opacity=".45"/>
        <polyline points="${pts(s[0])}" fill="none" stroke="${C.teal}" stroke-width="2.2"/>
        <polyline points="${pts(s[1])}" fill="none" stroke="${C.plum}" stroke-width="2.2"/>
        <polyline points="${pts(s[2])}" fill="none" stroke="${C.rose}" stroke-width="2.2"/>
        <text x="${x(4.3)}" y="${y(0.9)}" style="fill:${C.teal}">CO₂*</text>
        <text x="${x(7.1)}" y="${y(0.94)}" style="fill:${C.plum}">HCO₃⁻</text>
        <text x="${x(10.6)}" y="${y(0.9)}" style="fill:${C.rose}">CO₃²⁻</text>
        <text x="${x(8.05)}" y="${y(0.5)}" text-anchor="middle" style="fill:${C.sage}">ocean</text>
        <text x="${x(8.05)}" y="${y(0.5) + 12}" text-anchor="middle" style="fill:${C.sage}">~8.1</text>
        <line x1="${x(8.1)}" y1="${y(0.18)}" x2="${x(7.25)}" y2="${y(0.18)}" stroke="${C.rose}" stroke-width="2" marker-end="url(#ah)"/>
        <text x="${x(7.2)}" y="${y(0.18) - 7}" text-anchor="end" style="fill:${C.rose}">+CO₂ → lower pH</text>
        <line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${C.line}"/>
        ${[4, 6, 8, 10, 12].map((v) => `<text x="${x(v)}" y="${B + 15}" text-anchor="middle">${v}</text>`).join("")}
        <text x="${(L + R) / 2}" y="${B + 30}" text-anchor="middle">pH</text>
      `, "Bjerrum plot");
    },
    dpco2() {
      const panel = (x0, title, sub, up, col) => `
        <rect x="${x0}" y="28" width="190" height="56" rx="10" fill="${C.lav}" opacity=".35"/>
        <text x="${x0 + 95}" y="50" text-anchor="middle">Air pCO₂</text>
        <text x="${x0 + 95}" y="66" text-anchor="middle" style="fill:${C.plum}">${up ? "lower" : "higher"}</text>
        <rect x="${x0}" y="112" width="190" height="56" rx="10" fill="${C.teal}" opacity=".25"/>
        <text x="${x0 + 95}" y="134" text-anchor="middle">Sea pCO₂</text>
        <text x="${x0 + 95}" y="150" text-anchor="middle" style="fill:${C.teal}">${up ? "higher" : "lower"}</text>
        <path d="M${x0 + 95},${up ? 108 : 88} L${x0 + 95},${up ? 90 : 106}" stroke="${col}" stroke-width="4" marker-end="url(#a${up ? "u" : "d"})"/>
        <text x="${x0 + 95}" y="186" text-anchor="middle" class="ttl" style="fill:${col}">${title}</text>
        <text x="${x0 + 95}" y="200" text-anchor="middle">${sub}</text>`;
      return svg(420, 210, `
        <defs>
          <marker id="ad" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${C.sage}"/></marker>
          <marker id="au" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${C.rose}"/></marker>
        </defs>
        <text class="ttl" x="10" y="16">ΔpCO₂ = pCO₂(sea) − pCO₂(air)</text>
        ${panel(10, "ΔpCO₂ < 0 → SINK", "cold high latitudes", false, C.sage)}
        ${panel(220, "ΔpCO₂ > 0 → SOURCE", "equatorial upwelling", true, C.rose)}
      `, "Delta pCO2 sink vs source");
    },
    solubility() {
      const L = 46, R = 400, T = 28, B = 160;
      const f = (t) => 0.064 * Math.exp(-0.0268 * t);
      const x = (t) => L + (t / 30) * (R - L), y = (v) => B - ((v - 0.02) / 0.05) * (B - T);
      const p = []; for (let t = 0; t <= 30; t += 1) p.push([x(t), y(f(t))]);
      return svg(420, 196, `
        <text class="ttl" x="10" y="16">CO₂ solubility vs sea-surface temperature</text>
        <polyline points="${pts(p)}" fill="none" stroke="${C.teal}" stroke-width="2.6"/>
        <circle cx="${x(2)}" cy="${y(f(2))}" r="5" fill="${C.teal}"/><text x="${x(2) + 10}" y="${y(f(2)) + 4}" style="fill:${C.teal}">cold → holds more CO₂</text>
        <circle cx="${x(28)}" cy="${y(f(28))}" r="5" fill="${C.rose}"/><text x="${x(28) - 10}" y="${y(f(28)) - 10}" text-anchor="end" style="fill:${C.rose}">warm → holds less</text>
        <line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${C.line}"/>
        ${[0, 10, 20, 30].map((t) => `<text x="${x(t)}" y="${B + 15}" text-anchor="middle">${t}°C</text>`).join("")}
        <text x="${L - 8}" y="${(T + B) / 2}" text-anchor="end" transform="rotate(-90 ${L - 22} ${(T + B) / 2})">solubility</text>
      `, "CO2 solubility decreases with temperature");
    },
    martin() {
      const L = 70, R = 400, T = 34, B = 176;
      const x = (F) => L + F * (R - L), y = (z) => T + ((z - 100) / 3900) * (B - T);
      const p = []; for (let z = 100; z <= 4000; z += 50) p.push([x(Math.pow(z / 100, -0.858)), y(z)]);
      return svg(420, 196, `
        <text class="ttl" x="10" y="16">Martin curve · sinking organic C flux vs depth</text>
        <polyline points="${pts(p)}" fill="none" stroke="${C.plum}" stroke-width="2.6"/>
        <text x="${x(1) - 6}" y="${y(100) + 4}" text-anchor="end" style="fill:${C.plum}">100% leaves surface layer</text>
        <text x="${x(0.12) + 10}" y="${y(1500)}" style="fill:${C.rose}">respired → DIC at depth</text>
        <text x="${x(0.05) + 10}" y="${y(3600)}" style="fill:${C.sage}">tiny fraction reaches seafloor</text>
        <line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="${C.line}"/>
        ${[100, 1000, 2000, 3000, 4000].map((z) => `<text x="${L - 6}" y="${y(z) + 4}" text-anchor="end">${z} m</text>`).join("")}
      `, "Martin curve");
    },
    split() {
      const L = 20, W = 380;
      const seg = [["Atmosphere ~50%", 0.5, C.lav], ["Ocean ~25%", 0.25, C.teal], ["Land ~25%", 0.25, C.sage]];
      let acc = 0;
      return svg(420, 110, `
        <text class="ttl" x="10" y="16">Where human CO₂ emissions go (simplified)</text>
        ${seg.map(([n, f, c]) => {
          const xx = L + acc * W; acc += f;
          return `<rect x="${xx}" y="30" width="${f * W - 3}" height="42" rx="8" fill="${c}"/>
            <text x="${xx + (f * W) / 2}" y="56" text-anchor="middle" style="fill:#fff">${n}</text>`;
        }).join("")}
        <text x="${L}" y="96">Illustrative proportions, not fixed annual constants.</text>
      `, "Emissions partition");
    },
  };
  const fig = (id) => (id && FIGS[id] ? FIGS[id]() : "");

  // ---------- topic chips ----------
  let topics = new Set(store.get("topics", Object.keys(TOPICS)));
  if (!topics.size) topics = new Set(Object.keys(TOPICS));
  const chipsEl = $("#chips");
  function renderChips() {
    const all = topics.size === Object.keys(TOPICS).length;
    chipsEl.innerHTML = `<button class="chip ${all ? "on" : ""}" data-t="*">All topics</button>` +
      Object.entries(TOPICS).map(([k, v]) => `<button class="chip ${!all && topics.has(k) ? "on" : ""}" data-t="${k}">${v}</button>`).join("");
  }
  chipsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const t = b.dataset.t, all = topics.size === Object.keys(TOPICS).length;
    if (t === "*") topics = new Set(Object.keys(TOPICS));
    else if (all) topics = new Set([t]);
    else { topics.has(t) ? topics.delete(t) : topics.add(t); if (!topics.size) topics = new Set(Object.keys(TOPICS)); }
    store.set("topics", [...topics]);
    renderChips();
    onTopicsChanged();
  });
  const pool = (arr) => arr.filter((c) => topics.has(c.t));

  // ---------- tabs ----------
  let view = "cards";
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
  function showView(v) {
    view = v;
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
    document.querySelectorAll(".view").forEach((s) => s.classList.toggle("active", s.id === "view-" + v));
    chipsEl.classList.toggle("hidden", v === "guide");
    if (v === "learn") Learn.ensure();
    if (v === "match") Match.ensure();
    if (v === "kahoot") K.ensure();
    if (v === "guide") Guide.ensure();
    if (v !== "kahoot") K.pause();
  }
  function onTopicsChanged() {
    Cards.rebuild();
    Learn.reset();
    Match.reset();
    if (view === "learn") Learn.ensure();
    if (view === "match") Match.ensure();
    K.onTopics();
  }

  // ---------- FLASHCARDS ----------
  const Cards = (() => {
    const cardEl = $("#card");
    let deck = [], i = 0, defFirst = false, onlyLearning = false;
    let known = new Set(store.get("known", []));
    let learning = new Set(store.get("learning", []));
    const save = () => { store.set("known", [...known]); store.set("learning", [...learning]); };

    function rebuild(keepShuffle) {
      let d = pool(CARDS);
      if (onlyLearning) d = d.filter((c) => learning.has(c.term));
      deck = keepShuffle ? shuffle(d) : d;
      i = 0;
      render(false);
    }
    function paint() {
      const c = deck[i];
      if (!c) {
        $("#cardFront").textContent = onlyLearning ? "No “still learning” cards here 🎉" : "No cards in this topic.";
        $("#cardBack").textContent = "";
        $("#cardTag").textContent = $("#cardTag2").textContent = "";
        $("#cardFig").innerHTML = $("#cardRefs").innerHTML = "";
        $("#cardCount").textContent = "0 / 0";
        $("#cardBar").style.width = "0";
        return;
      }
      $("#cardFront").textContent = defFirst ? c.def : c.term;
      $("#cardBack").textContent = defFirst ? c.term : c.def;
      $("#cardTag").textContent = $("#cardTag2").textContent = TOPICS[c.t];
      $("#cardFig").innerHTML = fig(c.fig);
      $("#cardRefs").innerHTML = refsHTML(c);
      $("#cardCount").textContent = `${i + 1} / ${deck.length}`;
      $("#cardBar").style.width = ((i + 1) / deck.length) * 100 + "%";
      const k = pool(CARDS).filter((x) => known.has(x.term)).length;
      $("#knowCount").textContent = `${k} known`;
    }
    // animate a slide between cards; un-flip invisibly so the next answer is never shown early
    function render(animate = true) {
      if (!animate) { cardEl.classList.remove("flipped"); paint(); return; }
      cardEl.style.setProperty("--ry", cardEl.classList.contains("flipped") ? "180deg" : "0deg");
      cardEl.classList.add("slide-out");
      setTimeout(() => {
        cardEl.style.transition = "none";
        cardEl.classList.remove("flipped", "slide-out");
        paint();
        void cardEl.offsetWidth;
        cardEl.style.transition = "";
        cardEl.classList.add("slide-in");
        setTimeout(() => cardEl.classList.remove("slide-in"), 230);
      }, 170);
    }
    const flip = () => deck.length && cardEl.classList.toggle("flipped");
    const go = (d) => { if (!deck.length) return; i = (i + d + deck.length) % deck.length; render(); };
    function mark(isKnown) {
      const c = deck[i]; if (!c) return;
      if (isKnown) { known.add(c.term); learning.delete(c.term); } else { learning.add(c.term); known.delete(c.term); }
      save();
      if (onlyLearning && isKnown) {
        deck.splice(i, 1);
        if (i >= deck.length) i = 0;
        render();
      } else go(1);
    }

    cardEl.addEventListener("click", (e) => { if (!e.target.closest("a")) flip(); });
    $("#prevCard").onclick = () => go(-1);
    $("#nextCard").onclick = () => go(1);
    $("#markKnow").onclick = () => mark(true);
    $("#markLearning").onclick = () => mark(false);
    $("#shuffleCards").onclick = () => { rebuild(true); };
    $("#flipSide").onclick = (e) => { defFirst = !defFirst; cardEl.classList.toggle("defFirst", defFirst); e.currentTarget.classList.toggle("on", defFirst); render(); };
    $("#onlyLearning").onclick = (e) => { onlyLearning = !onlyLearning; e.currentTarget.classList.toggle("on", onlyLearning); rebuild(); };
    $("#resetCards").onclick = () => { if (confirm("Reset Know it / Still learning progress?")) { known.clear(); learning.clear(); save(); rebuild(); } };

    document.addEventListener("keydown", (e) => {
      if (view !== "cards" || e.target.matches("input, textarea")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "1") mark(false);
      else if (e.key === "2") mark(true);
    });
    // swipe on phones
    let sx = null;
    cardEl.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    cardEl.addEventListener("touchend", (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 60) { e.preventDefault(); go(dx < 0 ? 1 : -1); }
    });

    return { rebuild };
  })();

  // ---------- LEARN (Quizlet-style) ----------
  const Learn = (() => {
    const panel = $("#learnPanel");
    let level = store.get("learnLevel", {}); // term -> 0..2 (2 = mastered)
    let current = null, answered = false, last = null;

    function stats() {
      const p = pool(CARDS), m = p.filter((c) => (level[c.term] || 0) >= 2).length;
      $("#learnBar").style.width = (p.length ? (m / p.length) * 100 : 0) + "%";
      $("#learnCount").textContent = `${m} / ${p.length}`;
      return { p, m };
    }
    function next() {
      const { p, m } = stats();
      if (!p.length) { panel.innerHTML = `<p class="center">No cards in this topic.</p>`; return; }
      if (m === p.length) {
        panel.innerHTML = `<div class="center"><h2 style="color:var(--plum)">All mastered! 🌸</h2><p>You got every card in this set right twice in a row.</p><button class="btn primary" id="learnAgain">Start over</button></div>`;
        $("#learnAgain").onclick = () => { p.forEach((c) => (level[c.term] = 0)); store.set("learnLevel", level); next(); };
        return;
      }
      const open = p.filter((c) => (level[c.term] || 0) < 2 && c !== last);
      const card = (open.length ? open : p.filter((c) => (level[c.term] || 0) < 2))[Math.floor(Math.random() * (open.length || 1))];
      last = card;
      const askTerm = Math.random() < 0.5; // show definition, pick term (or the reverse)
      const same = CARDS.filter((c) => c !== card && c.t === card.t);
      const others = shuffle(same.length >= 3 ? same : CARDS.filter((c) => c !== card)).slice(0, 3);
      const choices = shuffle([card, ...others]);
      current = { card, askTerm, choices };
      answered = false;
      const lvl = level[card.term] || 0;
      panel.innerHTML = `
        <div class="qlabel">${askTerm ? "Which term matches this definition?" : "What does this term mean?"} ${lvl === 1 ? "· one more to master ✨" : ""}</div>
        <div class="qtext ${askTerm ? "" : "term"}">${esc(askTerm ? card.def : card.term)}</div>
        <div class="opts">${choices.map((c, k) => `<button class="opt" data-k="${k}"><span class="k">${k + 1}</span>${esc(askTerm ? c.term : c.def)}</button>`).join("")}</div>
        <div id="learnFb"></div>`;
      panel.querySelectorAll(".opt").forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
    }
    function answer(k) {
      if (answered) return;
      answered = true;
      const { card, choices, askTerm } = current;
      const ok = choices[k] === card;
      const btns = panel.querySelectorAll(".opt");
      btns.forEach((b, j) => { b.disabled = true; if (choices[j] === card) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
      level[card.term] = ok ? (level[card.term] || 0) + 1 : 0;
      store.set("learnLevel", level);
      $("#learnFb").innerHTML = `
        <div class="feedback ${ok ? "good" : "bad"}">${ok ? "Nice! ✓" : "Not quite."} <strong>${esc(card.term)}</strong>: ${esc(card.def)}</div>
        ${fig(card.fig) ? `<div class="fig">${fig(card.fig)}</div>` : ""}
        <div class="refs" style="justify-content:flex-start">${refsHTML(card)}</div>
        <div class="row-end"><button class="btn primary" id="learnNext">Continue →</button></div>`;
      $("#learnNext").onclick = next;
      $("#learnNext").focus({ preventScroll: true });
      stats();
    }
    document.addEventListener("keydown", (e) => {
      if (view !== "learn" || e.target.matches("input")) return;
      if (!answered && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
      else if (answered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    });
    let started = false;
    return {
      ensure() { if (!started) { started = true; next(); } },
      reset() { started = false; last = null; },
    };
  })();

  // ---------- MATCH ----------
  const Match = (() => {
    const grid = $("#matchGrid");
    let sel = null, left = 0, t0 = 0, timer = null, started = false, lock = false;
    const short = (d) => { const s = d.split(/(?<=[a-z0-9)%°][.!?])\s+(?=[A-Z])/)[0]; return s.length > 110 ? s.slice(0, 107).trimEnd() + "…" : s; };
    function best() { const b = store.get("matchBest", null); $("#matchBest").textContent = b ? `best ${b.toFixed(1)}s` : ""; }
    function round() {
      clearInterval(timer); timer = null; sel = null; lock = false;
      $("#matchTime").textContent = "0.0s";
      const picks = shuffle(pool(CARDS)).slice(0, 6);
      left = picks.length;
      const tiles = shuffle(picks.flatMap((c, k) => [{ k, txt: c.term, term: true }, { k, txt: short(c.def), term: false }]));
      grid.innerHTML = tiles.map((t) => `<button class="tile ${t.term ? "term" : ""}" data-k="${t.k}">${esc(t.txt)}</button>`).join("");
      best();
    }
    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".tile"); if (!b || lock || b.classList.contains("done")) return;
      if (!timer) { t0 = performance.now(); timer = setInterval(() => { $("#matchTime").textContent = ((performance.now() - t0) / 1000).toFixed(1) + "s"; }, 100); }
      if (!sel) { sel = b; b.classList.add("sel"); return; }
      if (sel === b) { b.classList.remove("sel"); sel = null; return; }
      if (sel.dataset.k === b.dataset.k) {
        sel.classList.add("done"); b.classList.add("done"); sel = null;
        if (--left === 0) {
          clearInterval(timer); timer = null;
          const t = (performance.now() - t0) / 1000;
          $("#matchTime").textContent = t.toFixed(1) + "s 🎉";
          const b0 = store.get("matchBest", null);
          if (!b0 || t < b0) store.set("matchBest", t);
          best();
          setTimeout(() => { grid.innerHTML = `<div class="panel center" style="grid-column:1/-1"><h2 style="color:var(--plum)">${t.toFixed(1)} seconds!</h2><p>${!b0 || t < b0 ? "New personal best 🌸" : "Nice matching!"}</p><button class="btn primary" id="matchAgain">Play again</button></div>`; $("#matchAgain").onclick = round; }, 420);
        }
      } else {
        lock = true;
        const a = sel; sel = null;
        a.classList.remove("sel"); a.classList.add("bad"); b.classList.add("bad");
        t0 -= 1000; // 1s penalty
        setTimeout(() => { a.classList.remove("bad"); b.classList.remove("bad"); lock = false; }, 380);
      }
    });
    $("#matchNew").onclick = round;
    return { ensure() { if (!started) { started = true; round(); } }, reset() { started = false; clearInterval(timer); timer = null; } };
  })();

  // ---------- CARBOOT (Kahoot-style) ----------
  const K = (() => {
    const root = $("#kRoot");
    const LIMIT = 20;
    const SHAPES = [
      '<svg class="shape" viewBox="0 0 30 30"><path d="M15 3 L28 26 H2 Z" fill="#fff"/></svg>',
      '<svg class="shape" viewBox="0 0 30 30"><path d="M15 2 L28 15 L15 28 L2 15 Z" fill="#fff"/></svg>',
      '<svg class="shape" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#fff"/></svg>',
      '<svg class="shape" viewBox="0 0 30 30"><rect x="4" y="4" width="22" height="22" rx="3" fill="#fff"/></svg>',
    ];
    let st = null, raf = null, started = false;

    function lobby() {
      cancelAnimationFrame(raf); st = null;
      const n = pool(QUIZ).length;
      const name = store.get("kName", "Divine");
      const hs = store.get("kScores", []).slice(0, 5);
      root.innerHTML = `
        <div class="k-stage"><div class="k-lobby">
          <h2>Carboot! 🌿</h2>
          <p>Kahoot-style speed quiz · ${n} questions in the selected topics · ${LIMIT}s each.<br>Answer faster for more points, build streaks for bonuses, and read the explanation after every question.</p>
          <input id="kName" maxlength="20" value="${esc(name)}" aria-label="Your name">
          <div class="k-len">
            ${[10, 20].filter((x) => x < n).map((x) => `<button class="btn soft" data-len="${x}">${x} questions</button>`).join("")}
            <button class="btn soft on" data-len="${n}">All ${n}</button>
          </div>
          <button class="btn primary" id="kStart" ${n ? "" : "disabled"}>Start game ▶</button>
          ${hs.length ? `<div class="review" style="max-width:360px;margin:22px auto 0"><h3>High scores</h3>${hs.map((h, j) => `<div class="ref" style="display:flex;justify-content:space-between;margin-bottom:6px"><span>${j + 1}. ${esc(h.name)}</span><span>${h.score.toLocaleString()} · ${h.right}/${h.total}</span></div>`).join("")}</div>` : ""}
        </div></div>`;
      let len = n;
      root.querySelectorAll("[data-len]").forEach((b) => (b.onclick = () => { root.querySelectorAll("[data-len]").forEach((x) => x.classList.remove("on")); b.classList.add("on"); len = +b.dataset.len; }));
      $("#kStart").onclick = () => {
        const nm = $("#kName").value.trim() || "Player";
        store.set("kName", nm);
        start(nm, len);
      };
    }

    function start(name, len) {
      const qs = shuffle(pool(QUIZ)).slice(0, len).map((q) => {
        const order = shuffle([0, 1, 2, 3]);
        return { ...q, c: order.map((o) => q.c[o]), a: order.indexOf(q.a) };
      });
      st = { name, qs, i: 0, score: 0, streak: 0, best: 0, right: 0, missed: [], locked: false };
      question();
    }

    function question() {
      const q = st.qs[st.i];
      st.locked = false;
      root.innerHTML = `
        <div class="k-stage">
          <div class="k-top">
            <span>Question ${st.i + 1} / ${st.qs.length} · ${TOPICS[q.t]}</span>
            <span>${st.streak >= 2 ? `<span class="k-streak">🔥 ${st.streak} streak</span> ` : ""}<span class="k-score">${st.score.toLocaleString()} pts</span></span>
          </div>
          <div class="k-q">${esc(q.q)}</div>
          <div class="k-timer-wrap"><div class="k-clock" id="kClock">${LIMIT}</div><div class="k-timer"><i id="kBar"></i></div></div>
          <div class="k-grid">${q.c.map((c, k) => `<button class="k-ans" data-k="${k}">${SHAPES[k]}<span>${esc(c)}</span></button>`).join("")}</div>
          <div id="kReveal"></div>
        </div>`;
      root.querySelectorAll(".k-ans").forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
      st.t0 = performance.now();
      const bar = $("#kBar"), clock = $("#kClock");
      const tick = () => {
        const el = (performance.now() - st.t0) / 1000, left = Math.max(0, LIMIT - el);
        bar.style.transform = `scaleX(${left / LIMIT})`;
        clock.textContent = Math.ceil(left);
        if (left <= 0) return answer(-1);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    function answer(k) {
      if (!st || st.locked) return;
      st.locked = true;
      cancelAnimationFrame(raf);
      const q = st.qs[st.i];
      const el = Math.min(LIMIT, (performance.now() - st.t0) / 1000);
      const ok = k === q.a;
      let pts = 0, bonus = 0;
      if (ok) {
        st.streak++; st.right++; st.best = Math.max(st.best, st.streak);
        pts = Math.round(1000 * (1 - el / LIMIT / 2));
        bonus = st.streak >= 2 ? Math.min(st.streak - 1, 5) * 100 : 0;
        st.score += pts + bonus;
      } else {
        st.streak = 0;
        st.missed.push({ q, picked: k });
      }
      root.querySelectorAll(".k-ans").forEach((b, j) => {
        b.disabled = true;
        if (j === q.a) { b.classList.add("correct"); b.insertAdjacentHTML("beforeend", '<span class="mark">✓</span>'); }
        else if (j === k) { b.classList.add("picked-wrong"); b.insertAdjacentHTML("beforeend", '<span class="mark">✗</span>'); }
        else b.classList.add("dim");
      });
      const title = ok ? ["Correct! 🌸", "Nailed it! 🌿", "Yes! 💜", "Correct! ✨"][Math.floor(Math.random() * 4)] : k === -1 ? "Time's up ⏰" : "Not quite 🍂";
      const last = st.i === st.qs.length - 1;
      $("#kReveal").innerHTML = `
        <div class="k-reveal">
          <div class="k-verdict ${ok ? "good" : "bad"}"><h3>${title}</h3>
            <span class="k-pts">${ok ? `+${pts}${bonus ? ` +${bonus} streak` : ""}` : "+0"}</span></div>
          <p class="k-answer">Correct answer: <span>${esc(q.c[q.a])}</span></p>
          <p class="k-why">${esc(q.why)}</p>
          ${q.fig ? `<div class="fig">${fig(q.fig)}</div>` : ""}
          <div class="refs">${refsHTML(q)}</div>
          <div class="row-end"><button class="btn primary" id="kNext">${last ? "See results 🏆" : "Next question →"}</button></div>
        </div>`;
      const nb = $("#kNext");
      nb.onclick = () => { st.i++; st.i < st.qs.length ? question() : end(); };
      nb.focus({ preventScroll: true });
      $("#kReveal").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function end() {
      const total = st.qs.length, acc = Math.round((st.right / total) * 100);
      const scores = store.get("kScores", []);
      scores.push({ name: st.name, score: st.score, right: st.right, total });
      scores.sort((a, b) => b.score - a.score);
      store.set("kScores", scores.slice(0, 10));
      const top = scores.slice(0, 3);
      const podium = [top[1], top[0], top[2]].map((h, j) => h ? `<div class="p${[2, 1, 3][j]}"><b>${[2, 1, 3][j]}</b>${esc(h.name)}<br>${h.score.toLocaleString()}</div>` : "").join("");
      root.innerHTML = `
        <div class="k-stage k-end">
          <h2>${acc >= 80 ? "Amazing! 🌸" : acc >= 60 ? "Nice work! 🌿" : "Keep going! 💜"}</h2>
          <div class="k-stats">
            <span class="pill soft">${st.score.toLocaleString()} pts</span>
            <span class="pill">${st.right}/${total} correct · ${acc}%</span>
            <span class="pill soft">🔥 best streak ${st.best}</span>
          </div>
          <div class="podium">${podium}</div>
          <div class="row-end" style="justify-content:center"><button class="btn primary" id="kAgain">Play again</button>${st.missed.length ? `<button class="btn soft" id="kRetry">Retry missed (${st.missed.length})</button>` : ""}</div>
          ${st.missed.length ? `<div class="review"><h3>Review what you missed</h3>${st.missed.map(({ q, picked }) => `
            <details><summary>${esc(q.q)}</summary>
              <p>${picked >= 0 ? `You picked: <em>${esc(q.c[picked])}</em><br>` : "Time ran out.<br>"}<strong>Answer: ${esc(q.c[q.a])}</strong></p>
              <p>${esc(q.why)}</p><div class="refs" style="justify-content:flex-start">${refsHTML(q)}</div></details>`).join("")}</div>` : `<p>Perfect game, no misses! 🎉</p>`}
        </div>`;
      confetti(root.firstElementChild);
      const missedQs = st.missed.map((m) => m.q);
      $("#kAgain").onclick = lobby;
      if ($("#kRetry")) $("#kRetry").onclick = () => {
        const name = st.name;
        st = { name, qs: shuffle(missedQs).map((q) => { const o = shuffle([0, 1, 2, 3]); const orig = q.c.slice(); return { ...q, c: o.map((x) => orig[x]), a: o.indexOf(q.a) }; }), i: 0, score: 0, streak: 0, best: 0, right: 0, missed: [], locked: false };
        question();
      };
    }

    function confetti(el) {
      const cols = ["#a98fd1", "#d889a6", "#9fc1a2", "#f4d3dd", "#7b569f"];
      for (let j = 0; j < 60; j++) {
        const s = document.createElement("span");
        s.className = "confetti";
        s.style.left = Math.random() * 100 + "%";
        s.style.background = cols[j % cols.length];
        s.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
        s.style.animationDelay = Math.random() * 0.6 + "s";
        el.appendChild(s);
        setTimeout(() => s.remove(), 4200);
      }
    }

    document.addEventListener("keydown", (e) => {
      if (view !== "kahoot" || !st || e.target.matches("input")) return;
      if (!st.locked && /^[1-4]$/.test(e.key)) answer(+e.key - 1);
      else if (st.locked && e.key === "Enter" && $("#kNext")) { e.preventDefault(); $("#kNext").click(); }
    });

    return {
      ensure() { if (!started) { started = true; lobby(); } },
      pause() { if (st && !st.locked) { cancelAnimationFrame(raf); st.paused = performance.now(); } },
      onTopics() { if (started && (!st || st.i === 0)) lobby(); },
      resume() {
        if (st && st.paused && !st.locked) {
          st.t0 += performance.now() - st.paused; st.paused = null;
          const bar = $("#kBar"), clock = $("#kClock");
          const tick = () => {
            const left = Math.max(0, LIMIT - (performance.now() - st.t0) / 1000);
            bar.style.transform = `scaleX(${left / LIMIT})`; clock.textContent = Math.ceil(left);
            if (left <= 0) return answer(-1);
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      },
    };
  })();
  // resume a paused Kahoot timer when returning to the tab
  document.querySelector('.tab[data-view="kahoot"]').addEventListener("click", () => K.resume());

  // ---------- GUIDE ----------
  const GUIDE_FIG = { 3: "keeling", 6: "reservoirs", 17: "waterfall", 23: "dpco2", 26: "bjerrum", 28: "solubility", 29: "martin", 33: "split" };
  const Guide = (() => {
    const list = $("#guideList");
    let built = false;
    function slideText(s) {
      return s.map(([w, a, b]) => `Wk ${w} slides ${a === b ? a : a + "–" + b}`).join("; ");
    }
    function build() {
      let sec = "", html = "";
      for (const g of GUIDE) {
        if (g.sec !== sec) { sec = g.sec; html += `<h3 class="g-sec" data-sec="${esc(sec)}">${esc(sec)}</h3>`; }
        const r = lectureRanges({ g: g.n });
        html += `<article class="g-item" id="q${g.n}" data-text="${esc((g.q + " " + g.a).toLowerCase())}">
          <h3><span class="n">Q${g.n}.</span><span class="qq">${esc(g.q)}</span></h3>
          <p class="aa">${esc(g.a)}</p>
          ${GUIDE_FIG[g.n] ? `<div class="fig">${fig(GUIDE_FIG[g.n])}</div>` : ""}
          <div class="refs" style="margin-top:12px">
            <span class="ref">📖 Study Guide PDF p. ${g.gp}</span>
            <span class="ref" title="${esc(slideText(g.s))}">🖥 Lectures PDF p. ${fmtRanges(r)}</span>
            <span class="ref" style="opacity:.8">${esc(slideText(g.s))}</span>
          </div>
        </article>`;
      }
      html += `<article class="g-item g-eq" id="qeq" data-text="${esc(GUIDE_EQUATIONS.join(" ").toLowerCase())}"><h3>🧮 Quick equations &amp; distinctions to memorize <span class="ref" style="margin-left:6px">Study Guide p. 9</span></h3><ul>${GUIDE_EQUATIONS.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></article>`;
      list.innerHTML = html;
      built = true;
    }
    function filter(qs) {
      const q = qs.trim().toLowerCase();
      list.querySelectorAll(".g-item").forEach((el) => {
        const hit = !q || el.dataset.text.includes(q);
        el.style.display = hit ? "" : "none";
        const a = el.querySelector(".aa"), t = el.querySelector(".qq");
        const g = guideByN[+el.id.slice(1)];
        if (g && a) {
          if (q && hit) {
            const re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
            a.innerHTML = esc(g.a).replace(re, "<mark>$1</mark>");
            t.innerHTML = esc(g.q).replace(re, "<mark>$1</mark>");
          } else { a.textContent = g.a; t.textContent = g.q; }
        }
      });
      list.querySelectorAll(".g-sec").forEach((h) => {
        let n = h.nextElementSibling, any = false;
        while (n && !n.classList.contains("g-sec")) { if (n.style.display !== "none") any = true; n = n.nextElementSibling; }
        h.style.display = any ? "" : "none";
      });
    }
    let deb;
    $("#guideSearch").addEventListener("input", (e) => { clearTimeout(deb); deb = setTimeout(() => filter(e.target.value), 120); });
    return { ensure() { if (!built) build(); }, filter };
  })();

  function openGuide(n) {
    const s = $("#guideSearch");
    if (s.value) { s.value = ""; Guide.filter(""); }
    showView("guide");
    const el = document.getElementById("q" + n);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }

  // ---------- boot ----------
  renderChips();
  Cards.rebuild();
  if (/^#q\d+$/.test(location.hash)) openGuide(+location.hash.slice(2));
})();
