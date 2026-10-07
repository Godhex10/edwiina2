/* =========================================================
   EDDIES ADMIN — dashboard script
   Products, prices & stock are real (js/products.js).
   Sales & orders are SAMPLE data until checkout is connected.
   ========================================================= */
const PRODUCTS = window.EDDY_PRODUCTS || [];
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const money = (n) => "₦" + Math.round(n).toLocaleString("en-NG");
const kNaira = (n) => (n >= 1000 ? "₦" + (n / 1000).toFixed(n >= 10000 ? 2 : 1).replace(/\.0+$/, "") + "M" : "₦" + n + "k");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const RAW = (f) => `https://dodptt9f4zk9h.cloudfront.net/stores/259228/products/${f}`;
const IMG = (f, w = 200) => `https://getbumpa.com/cdn-cgi/image/format=auto,width=${w}/${RAW(f)}`;
const img = (p, w = 160) => `<img src="${IMG(p.img, w)}" data-raw="${RAW(p.img)}" alt="" loading="lazy" decoding="async" />`;
document.addEventListener("error", (e) => { const t = e.target; if (t.tagName === "IMG" && t.dataset.raw && t.src !== t.dataset.raw) t.src = t.dataset.raw; }, true);

const CAT = { clips: "Hair Clips", bonnets: "Bonnets", scarves: "Silk Scarves", bands: "Bands & Scrunchies", pout: "Pout by Eddy", lab: "Gloss Lab", care: "Hair & Beauty Tools", pack: "Packaging" };

/* seeded random so the sample data is the same on every load */
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* =========================================================
   SAMPLE SALES DATA (₦ thousands)
   ========================================================= */
const RANGES = {
  week:  { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [12, 18, 14, 21, 15, 19, 13], orders: 18, delta: 12, ring: 61, sub: "vs last week" },
  month: { labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"], values: [102, 118, 96, 170.5], orders: 71, delta: 18, ring: 73, sub: "vs last month" },
  year:  { labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], values: [210, 245, 262, 288, 312, 356, 298, 421, 412, 486.5], orders: 472, delta: 41, ring: 92, sub: "vs last year" },
};
const WEEK_LAST = [10, 13, 17, 12, 16, 14, 18];
let range = "week";

/* =========================================================
   REAL CATALOGUE NUMBERS
   ========================================================= */
// one product lists 8,507 units, which looks like a typo — leave out anything over 1,000 units from stock totals
const sane = PRODUCTS.filter((p) => p.q <= 1000);
const inStock = PRODUCTS.filter((p) => p.q > 0);
const low = PRODUCTS.filter((p) => p.q > 0 && p.q <= 3).sort((a, b) => a.q - b.q);
const stockValue = sane.reduce((s, p) => s + p.p * Math.max(0, p.q), 0);
const units = sane.reduce((s, p) => s + Math.max(0, p.q), 0);

/* =========================================================
   SAMPLE ORDERS (built from real products)
   ========================================================= */
const NAMES = [["Amara O.", "#ff8cc0", "#d81b6a"], ["Zainab B.", "#c8a2ff", "#7c3aed"], ["Chioma E.", "#ffb38f", "#e0704a"], ["Tolu A.", "#ff7eb6", "#b3123f"],
  ["Ada N.", "#7cc7ff", "#2f55d4"], ["Funmi K.", "#8de0b5", "#1f8a5a"], ["Blessing I.", "#ffc6dd", "#ff3d8b"], ["Halima S.", "#f6c4ff", "#9b4de0"],
  ["Kemi D.", "#ffd23f", "#d1561f"], ["Ngozi U.", "#ff8cc0", "#8e0f48"]];
const STATUSES = ["Pending", "Pending", "Pending", "Paid", "Paid", "Delivered", "Delivered", "Delivered", "Delivered", "Paid", "Delivered", "Delivered", "Delivered", "Delivered"];
const ORDERS = STATUSES.map((status, i) => {
  const [name, a, b] = NAMES[i % NAMES.length];
  const n = 1 + Math.floor(rnd() * 3);
  const items = Array.from({ length: n }, () => inStock[Math.floor(rnd() * inStock.length)]);
  const qty = items.map(() => 1 + Math.floor(rnd() * 2));
  const total = items.reduce((s, p, k) => s + p.p * qty[k], 0);
  const mins = i === 0 ? 4 : i * (20 + Math.floor(rnd() * 90));
  return { id: 2041 - i, name, a, b, items, qty, total, status, ago: mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.floor(mins / 60)} h ago` : `${Math.floor(mins / 1440)} d ago` };
});

/* =========================================================
   HELPERS
   ========================================================= */
function countUp(el, to, fmt = (v) => Math.round(v).toLocaleString("en-NG"), dur = 1200) {
  if (reduceMotion) { el.textContent = fmt(to); return; }
  const from = el._v || 0, t0 = performance.now();
  el._v = to;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const tip = $("#tip");
function showTip(html, x, y) {
  tip.innerHTML = html;
  tip.classList.add("show");
  const r = tip.getBoundingClientRect();
  const left = Math.min(innerWidth - r.width - 8, Math.max(8, x - r.width / 2));
  const top = y - r.height - 14 < 8 ? y + 18 : y - r.height - 14;
  tip.style.transform = `translate3d(${left}px, ${top}px, 0)`;
}
const hideTip = () => tip.classList.remove("show");
function toast(msg, icon = "fa-solid fa-heart") {
  const host = $("#toasts"), t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<i class="${icon}"></i><span>${esc(msg)}</span>`;
  host.appendChild(t);
  while (host.children.length > 2) host.firstChild.remove();
  setTimeout(() => t.remove(), 3100);
}
const NS = "http://www.w3.org/2000/svg";

/* =========================================================
   BAR CHART — sales by period (single series, current period highlighted)
   ========================================================= */
function drawBars() {
  const host = $("#barChart"), data = RANGES[range];
  const W = host.clientWidth, H = Math.max(200, host.clientHeight);
  const pad = { l: 40, r: 6, t: 26, b: 26 };
  // round axis steps (1, 2, 2.5 or 5 × 10ⁿ) so ticks read like ₦50k, ₦100k…
  const raw = (Math.max(...data.values) * 1.15) / 3, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const tickStep = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const max = tickStep * 3;
  const step = (W - pad.l - pad.r) / data.values.length;
  const bw = Math.min(46, step * 0.56);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, tickStep, tickStep * 2, tickStep * 3];
  $(".c-stats .card-head p").textContent = { week: "Daily revenue from website orders", month: "Weekly revenue from website orders", year: "Monthly revenue from website orders" }[range];
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sales by ${range === "year" ? "month" : range === "month" ? "week" : "day"}, sample data">
    <defs><linearGradient id="barHi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7eb6"/><stop offset="1" stop-color="#d81b6a"/></linearGradient></defs>`;
  ticks.forEach((t) => { s += `<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-label" x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end">${t ? kNaira(t) : "0"}</text>`; });
  data.values.forEach((v, i) => {
    const x = pad.l + step * i + (step - bw) / 2, top = y(v), h = H - pad.b - top, hi = i === data.values.length - 1;
    const r = Math.min(6, bw / 2);
    // rounded top only, flat on the baseline
    const d = `M${x} ${H - pad.b} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + bw - r} Q${x + bw} ${top} ${x + bw} ${top + r} V${H - pad.b} Z`;
    s += `<path class="bar${hi ? " hi" : ""}" d="${d}" style="transform-origin:${x}px ${H - pad.b}px;animation:barGrow .9s ${0.06 * i}s cubic-bezier(.22,1,.36,1) backwards"/>`;
    if (hi) s += `<text class="val-label" x="${x + bw / 2}" y="${top - 8}" text-anchor="middle">${kNaira(v)}</text>`;
    s += `<text class="axis-label" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${data.labels[i]}</text>`;
    s += `<rect class="bar-hit" data-i="${i}" x="${pad.l + step * i}" y="${pad.t}" width="${step}" height="${H - pad.t - pad.b}"/>`;
  });
  s += `</svg>`;
  host.innerHTML = s;
  if (!$("#barGrowKF")) document.head.insertAdjacentHTML("beforeend", `<style id="barGrowKF">@keyframes barGrow{from{transform:scaleY(0)}}</style>`);
  const bars = $$(".bar", host);
  $$(".bar-hit", host).forEach((hit) => {
    const i = +hit.dataset.i;
    hit.addEventListener("pointermove", (e) => {
      bars.forEach((b, k) => b.classList.toggle("hover", k === i));
      showTip(`<b>${data.labels[i]}</b><br>${kNaira(data.values[i])} in sales`, e.clientX, e.clientY);
    });
    hit.addEventListener("pointerleave", () => { bars[i].classList.remove("hover"); hideTip(); });
  });
}

/* =========================================================
   LINE CHART — this week vs last week (2 series, one axis)
   ========================================================= */
function drawLine() {
  const host = $("#lineChart"), labels = RANGES.week.labels, A = RANGES.week.values, B = WEEK_LAST;
  const W = host.clientWidth, H = Math.max(200, host.clientHeight);
  const pad = { l: 34, r: 14, t: 34, b: 26 };
  const max = Math.max(...A, ...B) * 1.2;
  const x = (i) => pad.l + ((W - pad.l - pad.r) * i) / (labels.length - 1);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const smooth = (vals) => vals.map((v, i) => {
    if (!i) return `M${x(0)} ${y(v)}`;
    const cx = (x(i - 1) + x(i)) / 2;
    return `C${cx} ${y(vals[i - 1])} ${cx} ${y(v)} ${x(i)} ${y(v)}`;
  }).join(" ");
  const pA = smooth(A), pB = smooth(B);
  const peak = A.indexOf(Math.max(...A));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily sales this week compared with last week, sample data">
    <defs><linearGradient id="areaA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0287a"/><stop offset="1" stop-color="#e0287a" stop-opacity="0"/></linearGradient></defs>`;
  [0, 10, 20].forEach((t) => { s += `<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-label" x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end">${t}k</text>`; });
  labels.forEach((l, i) => { s += `<text class="axis-label" x="${x(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`; });
  s += `<path class="area" fill="url(#areaA)" d="${pA} L${x(A.length - 1)} ${H - pad.b} L${x(0)} ${H - pad.b} Z"/>`;
  s += `<path class="series draw" stroke="#7c3aed" d="${pB}"/>`;
  s += `<path class="series draw" stroke="#e0287a" d="${pA}"/>`;
  // callout on this week's best day (like the "27 tasks" bubble in the reference)
  const cx = x(peak), cy = y(A[peak]), label = `₦${A[peak]}k best day`, bw = label.length * 6.4 + 16;
  s += `<g class="callout"><line x1="${cx}" x2="${cx}" y1="${cy}" y2="${H - pad.b}" stroke="#e0287a" stroke-opacity=".25" stroke-dasharray="3 4"/>
    <rect x="${cx - bw / 2}" y="${cy - 34}" width="${bw}" height="22" rx="8"/><path d="M${cx - 5} ${cy - 12.5} L${cx} ${cy - 7} L${cx + 5} ${cy - 12.5}Z" fill="#ff3d8b"/>
    <text x="${cx}" y="${cy - 19}" text-anchor="middle">${label}</text>
    <circle class="pt" cx="${cx}" cy="${cy}" r="6" fill="#e0287a"/></g>`;
  s += `<g class="hover-layer" opacity="0"><line class="cross" y1="${pad.t - 10}" y2="${H - pad.b}"/><circle class="pt pa" r="5.5" fill="#e0287a"/><circle class="pt pb" r="5.5" fill="#7c3aed"/></g>`;
  s += `<rect x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${H}" fill="transparent" class="line-hit"/></svg>`;
  host.innerHTML = s;

  // draw-on animation
  $$(".draw", host).forEach((p, k) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len; p.style.strokeDashoffset = reduceMotion ? 0 : len;
    p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset 1.6s ${0.2 * k}s cubic-bezier(.22,1,.36,1)`;
    p.style.strokeDashoffset = 0;
  });

  const layer = $(".hover-layer", host), cross = $(".cross", host), pa = $(".pa", host), pb = $(".pb", host);
  const hit = $(".line-hit", host);
  hit.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(labels.length - 1, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (labels.length - 1))));
    layer.setAttribute("opacity", 1);
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
    pa.setAttribute("cx", x(i)); pa.setAttribute("cy", y(A[i]));
    pb.setAttribute("cx", x(i)); pb.setAttribute("cy", y(B[i]));
    const diff = A[i] - B[i];
    showTip(`<b>${labels[i]}</b><br><span class="k" style="background:#e0287a"></span>This week: ₦${A[i]}k<br><span class="k" style="background:#7c3aed"></span>Last week: ₦${B[i]}k<br>${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)}k`,
      r.left + (x(i) / W) * r.width, r.top + (y(Math.max(A[i], B[i])) / H) * r.height);
  });
  hit.addEventListener("pointerleave", () => { layer.setAttribute("opacity", 0); hideTip(); });
}

/* =========================================================
   KPI CARDS
   ========================================================= */
function setRing(pct) {
  const c = $("#ringVal"), len = 2 * Math.PI * 46;
  c.style.strokeDasharray = len;
  if (c.style.strokeDashoffset === "") { c.style.strokeDashoffset = len; c.getBoundingClientRect(); }
  c.style.strokeDashoffset = len * (1 - pct / 100);
  countUp($("#ringLabel"), pct, (v) => Math.round(v) + "%");
  $("#ringPct").textContent = pct + "%";
}
function updateRange() {
  const d = RANGES[range], total = d.values.reduce((a, b) => a + b, 0) * 1000;
  countUp($("#salesTotal"), total, money);
  countUp($("#reportNum"), total, money);
  $("#salesDelta").innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> +${d.delta}%`;
  $("#reportSub").textContent = `from ${d.orders} orders · +${d.delta}% ${d.sub}`;
  setRing(d.ring);
  drawBars();
}

function renderStatic() {
  const now = new Date();
  $("#today").textContent = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · here's how the store is doing";

  // chat faces
  $("#faces").innerHTML = NAMES.slice(0, 5).map(([n, a, b], i) => `<span style="--a:${a};--b:${b};animation-delay:${0.4 + i * 0.08}s">${n[0]}</span>`).join("") + `<span class="more" style="animation-delay:.85s">+7</span>`;

  // low stock
  countUp($("#lowCount"), low.length);
  $("#lowThumbs").innerHTML = low.slice(0, 5).map((p) => img(p, 120)).join("") + (low.length > 5 ? `<span>+${low.length - 5}</span>` : "");

  // top seller (sample)
  const top = byId[5390033] || inStock[0];
  $("#topImg").src = IMG(top.img, 240); $("#topImg").dataset.raw = RAW(top.img);
  $("#topName").textContent = top.n;
  $("#topMeta").textContent = `${money(top.p)} · 48 sold this month (sample)`;

  // inventory gauge (real)
  const pct = Math.round((inStock.length / PRODUCTS.length) * 1000) / 10;
  const g = $("#gaugeVal"), len = g.getTotalLength();
  g.style.strokeDasharray = len; g.style.strokeDashoffset = len; g.getBoundingClientRect();
  g.style.strokeDashoffset = len * (1 - pct / 100);
  countUp($("#gaugeNum"), pct, (v) => v.toFixed(1) + "%", 1600);
  $("#gaugeSub").textContent = `${inStock.length} of ${PRODUCTS.length} products`;
  countUp($("#invValue"), stockValue, money, 1600);
  countUp($("#invUnits"), units);

  // category bars (real)
  const counts = Object.keys(CAT).map((c) => [c, PRODUCTS.filter((p) => p.c === c).length]).sort((a, b) => b[1] - a[1]);
  const max = counts[0][1];
  $("#catBars").innerHTML = counts.map(([c, n]) => `<div class="hbar" data-c="${c}" data-n="${n}"><span>${CAT[c]}</span><span class="track"><i class="fill" data-w="${(n / max) * 100}"></i></span><b>${n}</b></div>`).join("");
  requestAnimationFrame(() => $$(".hbar .fill").forEach((f, i) => setTimeout(() => (f.style.width = f.dataset.w + "%"), i * 60)));
  $$(".hbar").forEach((h) => {
    h.addEventListener("pointermove", (e) => {
      const c = h.dataset.c, inS = PRODUCTS.filter((p) => p.c === c && p.q > 0).length;
      showTip(`<b>${CAT[c]}</b><br>${h.dataset.n} products · ${inS} in stock`, e.clientX, e.clientY);
    });
    h.addEventListener("pointerleave", hideTip);
  });
}

/* =========================================================
   ORDERS
   ========================================================= */
const pendingCount = () => ORDERS.filter((o) => o.status === "Pending").length;
function updatePending() {
  $("#pendingPill").textContent = pendingCount();
  $("#newCount").textContent = pendingCount() ? `· ${pendingCount()} new` : "· all caught up";
}
function orderLine(o) {
  return `${o.items.map((p, k) => `${o.qty[k]}× ${p.n}`).join(", ")}`;
}
function renderOrderStack() {
  $("#orderStack").innerHTML = ORDERS.slice(0, 4).map((o) => `
    <li class="order ${o.status === "Pending" ? "pending" : ""}" data-o="${o.id}">
      <span class="who" style="--a:${o.a};--b:${o.b}">${o.name[0]}</span>
      <div><strong>${esc(o.name)} · ${money(o.total)}</strong><span>${esc(orderLine(o))}</span></div>
      ${o.status === "Pending" ? `<button class="confirm" data-confirm="${o.id}">Confirm</button>` : `<span class="done-badge"><i class="fa-solid fa-circle-check"></i> ${o.status}</span>`}
    </li>`).join("");
}
let orderFilter = "all";
function renderOrdersTable() {
  const list = ORDERS.filter((o) => orderFilter === "all" || o.status === orderFilter);
  const cls = { Pending: "pending", Paid: "paid", Delivered: "ok" };
  $("#ordersTable").innerHTML = `<thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>When</th><th></th></tr></thead><tbody>` +
    list.map((o, i) => `<tr class="row" style="animation-delay:${i * 35}ms">
      <td><b>#${o.id}</b></td>
      <td><div class="prod-cell"><span class="who" style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;background:linear-gradient(140deg,${o.a},${o.b})">${o.name[0]}</span>${esc(o.name)}</div></td>
      <td style="max-width:280px">${esc(orderLine(o))}</td>
      <td><b>${money(o.total)}</b></td>
      <td><span class="status ${cls[o.status]}">${o.status}</span></td>
      <td style="color:var(--muted)">${o.ago}</td>
      <td>${o.status === "Pending" ? `<button class="confirm" data-confirm="${o.id}">Confirm</button>` : ""}</td>
    </tr>`).join("") + `</tbody>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-confirm]");
  if (!b) return;
  const o = ORDERS.find((x) => x.id === +b.dataset.confirm);
  o.status = "Paid";
  b.outerHTML = `<span class="done-badge"><i class="fa-solid fa-circle-check"></i> Paid</span>`;
  updatePending();
  setTimeout(() => { renderOrderStack(); if ($("#view-orders").classList.contains("active")) renderOrdersTable(); }, 900);
  toast(`Order #${o.id} confirmed — ${o.name} will be notified`, "fa-solid fa-circle-check");
});
$("#orderFilter").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  orderFilter = b.dataset.s;
  $$("#orderFilter button").forEach((x) => x.classList.toggle("active", x === b));
  renderOrdersTable();
});

/* =========================================================
   PRODUCTS TABLE (real catalogue)
   ========================================================= */
let prodShown = 20;
const pf = $("#prodFilter");
pf.innerHTML = `<option value="all">All categories</option><option value="low">Low stock (≤ 3)</option><option value="out">Sold out</option>` +
  Object.entries(CAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
function renderProducts() {
  const q = $("#prodSearch").value.trim().toLowerCase(), f = pf.value;
  let list = PRODUCTS.filter((p) => (!q || p.n.toLowerCase().includes(q)) &&
    (f === "all" || (f === "low" ? p.q > 0 && p.q <= 3 : f === "out" ? p.q <= 0 : p.c === f)));
  if (f === "low") list = [...list].sort((a, b) => a.q - b.q);
  $("#prodCount").textContent = `· ${list.length}`;
  const rows = list.slice(0, prodShown).map((p, i) => {
    const st = p.q <= 0 ? ["out", "Sold out"] : p.q <= 3 ? ["warn", `Low · ${p.q} left`] : ["ok", "In stock"];
    return `<tr class="row" style="animation-delay:${Math.min(i, 15) * 30}ms">
      <td><div class="prod-cell">${img(p, 120)}<b>${esc(p.n)}</b></div></td>
      <td>${CAT[p.c]}</td>
      <td><b>${money(p.p)}</b>${p.px ? ` – ${money(p.px)}` : ""}</td>
      <td>${p.q > 1000 ? "—" : p.q}<div class="stock-bar"><i style="width:${Math.min(100, (Math.max(0, p.q) / 30) * 100)}%"></i></div></td>
      <td>${p.v ? p.v.length : "—"}</td>
      <td><span class="status ${st[0]}">${st[1]}</span></td>
    </tr>`;
  }).join("");
  $("#productsTable").innerHTML = `<thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Options</th><th>Status</th></tr></thead><tbody>${rows}</tbody>` +
    (list.length > prodShown ? `<tfoot><tr><td colspan="6" style="background:none;text-align:center"><button class="btn btn-gloss btn-sm" id="moreProds"><span>Show more (${list.length - prodShown})</span></button></td></tr></tfoot>` : "");
}
let st;
$("#prodSearch").addEventListener("input", () => { clearTimeout(st); st = setTimeout(() => { prodShown = 20; renderProducts(); }, 160); });
pf.addEventListener("change", () => { prodShown = 20; renderProducts(); });
document.addEventListener("click", (e) => { if (e.target.closest("#moreProds")) { prodShown += 20; renderProducts(); } });

/* =========================================================
   NAVIGATION — tabs, sidebar, range switch
   ========================================================= */
function moveGlider(container, glider, active, vertical = false) {
  if (!active) return;
  glider.style.width = active.offsetWidth + "px";
  glider.style.transform = `translateX(${active.offsetLeft - (vertical ? 0 : 0)}px)`;
}
const tabs = $("#tabs"), tabLine = $(".tab-line");
function showView(v, filter) {
  $$(".view").forEach((s) => s.classList.toggle("active", s.id === "view-" + v));
  $$("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
  moveGlider(tabs, tabLine, $("#tabs button.active"));
  if (v === "orders") renderOrdersTable();
  if (v === "products") { if (filter) pf.value = filter; prodShown = 20; renderProducts(); }
  if (v === "overview") requestAnimationFrame(() => { drawBars(); drawLine(); });
  closeSide();
}
tabs.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showView(b.dataset.view); });
$$(".side-link").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  $$(".side-link").forEach((x) => x.classList.toggle("active", x === a));
  if (a.dataset.toast) toast(a.dataset.toast, "fa-solid fa-wand-magic-sparkles");
  showView(a.dataset.view, a.dataset.filter);
}));
document.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) showView(g.dataset.goto, g.dataset.filter); });

const seg = $("#range"), segGlider = $(".seg-glider", seg);
seg.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.dataset.range === range) return;
  range = b.dataset.range;
  $$("button", seg).forEach((x) => x.classList.toggle("active", x === b));
  moveGlider(seg, segGlider, b);
  updateRange();
});

const side = $("#side"), scrim = $("#sideScrim");
function closeSide() { side.classList.remove("open"); scrim.classList.remove("show"); document.body.classList.remove("locked"); }
$("#menuBtn").addEventListener("click", () => { side.classList.add("open"); scrim.classList.add("show"); document.body.classList.add("locked"); });
scrim.addEventListener("click", closeSide);
$("#bellBtn").addEventListener("click", (e) => {
  const b = e.currentTarget; b.classList.remove("ring"); void b.offsetWidth; b.classList.add("ring");
  toast(`${pendingCount()} orders waiting for confirmation`, "fa-solid fa-bell");
});
$("#addProduct").addEventListener("click", () => toast("Product editor arrives in the full build", "fa-solid fa-wand-magic-sparkles"));

let rz, lastW = innerWidth;
addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    moveGlider(seg, segGlider, $("button.active", seg));
    moveGlider(tabs, tabLine, $("#tabs button.active"));
    if (innerWidth !== lastW && $("#view-overview").classList.contains("active")) { drawBars(); drawLine(); }
    lastW = innerWidth;
  }, 150);
});

/* =========================================================
   BUBBLE TRAIL (same glossy bubbles as the store)
   ========================================================= */
(function bubbleTrail() {
  if (reduceMotion) return;
  const cvs = document.createElement("canvas");
  cvs.className = "trail-canvas"; cvs.setAttribute("aria-hidden", "true");
  document.body.appendChild(cvs);
  const c = cvs.getContext("2d");
  let W = 0, H = 0;
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cvs.width = W * d; cvs.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); };
  size(); addEventListener("resize", size);
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const sprites = ["#ff3d8b", "#ff7eb6", "#c86bfa", "#ffb38f"].map((tint) => {
    const s = 64, r = s / 2 - 2, o = document.createElement("canvas"); o.width = o.height = s;
    const g = o.getContext("2d"), body = g.createRadialGradient(s * 0.38, s * 0.34, 1, s / 2, s / 2, r);
    body.addColorStop(0, "rgba(255,255,255,.85)"); body.addColorStop(0.3, "rgba(255,255,255,.18)"); body.addColorStop(0.75, rgba(tint, 0.16)); body.addColorStop(1, rgba(tint, 0.6));
    g.fillStyle = body; g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.ellipse(s * 0.36, s * 0.3, r * 0.24, r * 0.12, -0.6, 0, Math.PI * 2); g.fill();
    return o;
  });
  const parts = []; let raf = 0, lx = null, ly = null;
  const spawn = (x, y, n) => {
    for (let i = 0; i < n; i++) { if (parts.length > 60) parts.shift();
      parts.push({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vx: (Math.random() - 0.5) * 0.8, vy: -(Math.random() * 1.2 + 0.4), r: 3 + Math.random() * 9, life: 0, max: 40 + Math.random() * 40, s: sprites[(Math.random() * sprites.length) | 0], w: Math.random() * 60 }); }
    if (!raf) raf = requestAnimationFrame(tick);
  };
  function tick() {
    c.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], k = ++p.life / p.max;
      if (k >= 1) { parts.splice(i, 1); continue; }
      p.x += p.vx + Math.sin((p.life + p.w) / 9) * 0.4; p.y += p.vy;
      const r = p.r * (k < 0.15 ? 0.5 + (k / 0.15) * 0.5 : 1 + (k - 0.15) * 0.3);
      c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.drawImage(p.s, p.x - r, p.y - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; c.clearRect(0, 0, W, H); }
  }
  const move = (x, y) => { if (lx === null) { lx = x; ly = y; return; } const d = Math.hypot(x - lx, y - ly); if (d < 18) return; lx = x; ly = y; spawn(x, y, d > 70 ? 2 : 1); };
  addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") move(e.clientX, e.clientY); }, { passive: true });
  addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
})();

/* =========================================================
   START — loader, reveal, first render
   ========================================================= */
function start() {
  window.__adminReady = true;
  $("#loader").classList.add("done");
  setTimeout(() => $("#loader")?.remove(), 700);
  moveGlider(seg, segGlider, $("button.active", seg));
  moveGlider(tabs, tabLine, $("#tabs button.active"));
  updatePending();
  renderOrderStack();
  const cards = $$(".reveal");
  cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), reduceMotion ? 0 : 80 + i * 70));
  setTimeout(() => { renderStatic(); updateRange(); drawLine(); }, reduceMotion ? 0 : 350);
}
const t0 = performance.now();
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))])
  .then(() => setTimeout(start, Math.max(0, (reduceMotion ? 0 : 1100) - (performance.now() - t0))));
