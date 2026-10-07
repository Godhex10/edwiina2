/* =========================================================
   ACCESSORIES BY EDDY — storefront script
   ========================================================= */

/* ---- Store settings ---- */
const CONFIG = {
  currency: "₦",
  whatsapp: "2348139688880",   // checkout + chat buttons go here
  pageSize: 12,
};

const PRODUCTS = window.EDDY_PRODUCTS || [];
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const isSmall = matchMedia("(max-width: 640px)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => CONFIG.currency + Number(n).toLocaleString("en-NG");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- images (resized via Bumpa's CDN, falls back to the original) ---------- */
const RAW = (f) => `https://dodptt9f4zk9h.cloudfront.net/stores/259228/products/${f}`;
const IMG = (f, w = 500) => `https://getbumpa.com/cdn-cgi/image/format=auto,width=${w}/${RAW(f)}`;
const img = (p, w = 500, alt = p.n, eager = false) =>
  `<img src="${IMG(p.img, w)}" data-raw="${RAW(p.img)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />`;
function setImg(el, p, w = 600) { el.classList.remove("ok"); el.dataset.raw = RAW(p.img); el.src = IMG(p.img, w); el.alt = p.n; }
document.addEventListener("load", (e) => { if (e.target.tagName === "IMG") e.target.classList.add("ok"); }, true);
document.addEventListener("error", (e) => {
  const t = e.target;
  if (t.tagName === "IMG" && t.dataset.raw && t.src !== t.dataset.raw) t.src = t.dataset.raw;
}, true);

/* =========================================================
   CATEGORIES
   ========================================================= */
const CATS = {
  clips:   { label: "Hair Clips", chip: "Clips", img: 5389653, blurb: "Bows, claws, pearls & flowers",
             desc: "Cute hair clips to finish every look — from soft bows to statement flowers. Pick your colour below." },
  bonnets: { label: "Bonnets", chip: "Bonnets", img: 5411241, blurb: "Satin sleep for pretty hair",
             desc: "Soft satin bonnets that protect your hair while you get your beauty sleep. Reversible styles available." },
  scarves: { label: "Silk Scarves", chip: "Scarves", img: 5427280, blurb: "Polka dots, prints & classics",
             desc: "Silky-smooth scarves to wear on your head, neck or bag. Most prints are one-of-a-kind — grab yours fast." },
  bands:   { label: "Bands & Scrunchies", chip: "Bands", img: 5389876, blurb: "Headbands & scrunchies",
             desc: "Headbands and scrunchies in every shade, gentle on your hair and cute on your wrist." },
  pout:    { label: "Pout by Eddy", chip: "Pout by Eddy", img: 5323253, blurb: "Our own glosses & lip care",
             desc: "From the Pout by Eddy line — glossy, juicy and made to keep your lips soft and kissable." },
  lab:     { label: "Gloss Lab", chip: "Gloss Lab", img: 5389465, blurb: "Tubes & DIY gloss supplies",
             desc: "Everything you need to make your own lip gloss — tubes, bases, pigments, oils and more." },
  care:    { label: "Hair & Beauty Tools", chip: "Tools", img: 5389901, blurb: "Brushes, combs & self-care",
             desc: "Hair and self-care must-haves for your routine." },
  pack:    { label: "Packaging", chip: "Packaging", img: PRODUCTS.find((p) => /Pink Bow Nylon/i.test(p.n))?.id, blurb: "Cute bags for your own brand",
             desc: "Pretty packaging for small businesses — make every order feel like a gift." },
};
const CAT_ORDER = ["clips", "bonnets", "scarves", "bands", "pout", "lab", "care", "pack"];
const catCount = (c) => PRODUCTS.filter((p) => p.c === c).length;

/* colour words → swatch colours */
const COLORS = {
  "dark pink": "#e0457b", "light pink": "#ffc6dd", "sky blue": "#7cc7ff", "lemon green": "#c6e85b", "royal blue": "#2f55d4",
  red: "#e53950", pink: "#ff8cc0", chocolate: "#6b3e2e", brown: "#7b4a32", black: "#222", blue: "#3d6be0", purple: "#9b5de5",
  green: "#3fb37f", yellow: "#ffd23f", wine: "#7a1d3a", white: "#fff", ash: "#b8b8c0", orange: "#ff8a3d", peach: "#ffb38f",
  cream: "#f3e6c8", lilac: "#c8a2ff", nude: "#d9a58f", bronze: "#b5733a", silver: "#c9ccd3", transparent: "#f4f4f8",
  multicolor: "conic-gradient(#ff5f6d,#ffc371,#3fb37f,#3d6be0,#9b5de5,#ff5f6d)", rainbow: "conic-gradient(#ff5f6d,#ffc371,#3fb37f,#3d6be0,#9b5de5,#ff5f6d)",
};
const colorOf = (name) => {
  const n = name.toLowerCase();
  const k = Object.keys(COLORS).find((c) => n.includes(c));
  return k ? COLORS[k] : null;
};
const hasVariants = (p) => p.v && p.v.length > 0;
const priceLabel = (p) => (p.px ? `<small>from</small>${money(p.p)}` : money(p.p));

/* =========================================================
   STATE
   ========================================================= */
function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
let cart = load("eddy-cart", {});
let wish = new Set(load("eddy-wish", []).filter((id) => byId[id]));
cart = Object.fromEntries(Object.entries(cart).filter(([k]) => byId[k.split("::")[0]]));

/* =========================================================
   SMOOTH SCROLL (Lenis on desktop, native elsewhere)
   ========================================================= */
let lenis = null;
function initScroll() {
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } else {
    document.documentElement.style.scrollBehavior = "smooth";
  }
}
function scrollToEl(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.2 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: reduceMotion ? "auto" : "smooth" });
}
function lockScroll(on) {
  document.body.classList.toggle("locked", on);
  if (lenis) on ? lenis.stop() : lenis.start();
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.hasAttribute("data-wa")) return;
  const id = a.getAttribute("href");
  if (id.length < 2) return;
  e.preventDefault();
  if (a.dataset.cat) setFilter(a.dataset.cat);
  scrollToEl($(id));
  burger.classList.remove("open"); navLinks.classList.remove("open");
});

/* =========================================================
   WHATSAPP LINKS
   ========================================================= */
const waLink = (msg, num = CONFIG.whatsapp) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
$$("[data-wa]").forEach((a) => {
  a.href = waLink("Hi Eddy! 🎀 I'm shopping on your website and have a question.", a.dataset.wa || CONFIG.whatsapp);
  a.target = "_blank"; a.rel = "noopener";
});

/* =========================================================
   HERO
   ========================================================= */
$("#statCount").textContent = Math.floor(PRODUCTS.length / 10) * 10 + "+";
const HERO = [
  [".p-main", 5411183, "two-in-one bonnets"],
  [".p-left", 5323224, "pout by eddy"],
  [".p-right", 5390033, "bow clips"],
];
HERO.forEach(([sel, id, cap]) => {
  const p = byId[id], fig = $(sel);
  if (!p) return;
  const im = $("img", fig);
  im.fetchPriority = "high";
  setImg(im, p, 560);
  $("figcaption", fig).textContent = cap;
  fig.style.cursor = "pointer";
  fig.addEventListener("click", () => openModal(id));
});
$("#heroGlitter").innerHTML = Array.from({ length: 22 }, () =>
  `<circle cx="${(70 + Math.random() * 100).toFixed(1)}" cy="${(270 + Math.random() * 250).toFixed(1)}" r="${(Math.random() * 2.4 + 1).toFixed(1)}" style="animation-delay:${(-Math.random() * 2.4).toFixed(2)}s"/>`).join("");

// parallax on the photo collage
if (finePointer && !reduceMotion) {
  const stage = $("#heroStage"), photos = $$(".collage .photo");
  let tx = 0, ty = 0, pending = false;
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      photos.forEach((ph) => { const d = +ph.dataset.depth; ph.style.setProperty("--px", tx * d + "px"); ph.style.setProperty("--py", ty * d + "px"); });
      pending = false;
    });
  });
  stage.addEventListener("pointerleave", () => photos.forEach((ph) => { ph.style.setProperty("--px", "0px"); ph.style.setProperty("--py", "0px"); }));
}

/* marquee */
const mq = ["🎀 bow clips", "✦ satin bonnets", "💋 pout by eddy", "✦ silk scarves", "🌸 flower clips", "✦ scrunchies", "🧴 gloss lab", "✦ pretty girls shop here"];
$("#marqueeTrack").innerHTML = [...mq, ...mq].map((t) => `<span>${t}</span>`).join("");

/* =========================================================
   CATEGORY TILES
   ========================================================= */
$("#vibeGrid").innerHTML = CAT_ORDER.map((c) => {
  const cat = CATS[c], p = byId[cat.img];
  return `<a href="#shop" class="vibe reveal" data-cat="${c}">
    ${p ? img(p, 480, cat.label) : ""}
    <span class="vibe-go">→</span>
    <span class="vibe-label"><strong>${cat.label}</strong><span><em class="vb" style="font-style:normal">${cat.blurb} · </em>${catCount(c)} items</span></span>
  </a>`;
}).join("");

/* =========================================================
   SHOP — filters, search, sort, paging
   ========================================================= */
const grid = $("#grid"), filtersEl = $("#filters"), glider = $("#chipGlider");
filtersEl.insertAdjacentHTML("beforeend",
  `<button class="chip active" data-filter="all">All</button>` +
  CAT_ORDER.map((c) => `<button class="chip" data-filter="${c}">${CATS[c].chip}</button>`).join(""));

// "Featured" order: a pretty mix across categories, sold-out items last
const FEATURED = [5390033, 5411183, 5323224, 5389653, 5389759, 5389876, 5427280, 5389465, 5323253, 5411241, 5379798, 5389434];
const featuredOrder = (() => {
  const inStock = PRODUCTS.filter((p) => p.q > 0 && !FEATURED.includes(p.id));
  const buckets = CAT_ORDER.map((c) => inStock.filter((p) => p.c === c));
  const mixed = [];
  for (let i = 0; buckets.some((b) => b[i]); i++) buckets.forEach((b) => b[i] && mixed.push(b[i]));
  return [...FEATURED.map((id) => byId[id]).filter(Boolean), ...mixed, ...PRODUCTS.filter((p) => p.q <= 0)];
})();

const view = { filter: "all", query: "", sort: "featured", shown: CONFIG.pageSize };

function currentList() {
  let list = featuredOrder;
  if (view.filter === "wish") list = list.filter((p) => wish.has(p.id));
  else if (view.filter !== "all") list = list.filter((p) => p.c === view.filter);
  if (view.query) {
    const q = view.query.toLowerCase();
    list = list.filter((p) => (p.n + " " + CATS[p.c].label + " " + (p.v || []).map((v) => v[0]).join(" ")).toLowerCase().includes(q));
  }
  const sold = (p) => (p.q > 0 ? 0 : 1);
  if (view.sort === "low") list = [...list].sort((a, b) => sold(a) - sold(b) || a.p - b.p);
  if (view.sort === "high") list = [...list].sort((a, b) => sold(a) - sold(b) || b.p - a.p);
  if (view.sort === "az") list = [...list].sort((a, b) => a.n.localeCompare(b.n));
  return list;
}

function cardHTML(p) {
  const out = p.q <= 0, low = !out && p.q <= 3;
  const swatches = (p.v || []).map((v) => colorOf(v[0])).filter(Boolean);
  const dots = swatches.length
    ? `<div class="dots">${swatches.slice(0, 6).map((c) => `<i style="background:${c}"></i>`).join("")}<em>${p.v.length} colour${p.v.length > 1 ? "s" : ""}</em></div>`
    : hasVariants(p) ? `<div class="dots"><em style="margin:0">${p.v.length} option${p.v.length > 1 ? "s" : ""}</em></div>` : `<div class="dots"></div>`;
  return `<article class="card${out ? " sold" : ""}" data-id="${p.id}">
    <div class="card-media">
      ${out ? `<span class="badge out">Sold out</span>` : low ? `<span class="badge low">Only ${p.q} left</span>` : ""}
      <button class="heart ${wish.has(p.id) ? "on" : ""}" data-wish="${p.id}" aria-label="Save ${esc(p.n)}">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>
      </button>
      ${img(p, isSmall ? 360 : 460)}
    </div>
    <div class="card-body">
      <span class="card-cat">${CATS[p.c].label}</span>
      <h3 class="card-name">${esc(p.n)}</h3>
      ${dots}
      <div class="card-foot">
        <span class="price">${priceLabel(p)}</span>
        <button class="add" data-add="${p.id}" ${out ? "disabled" : ""}>${out ? "Sold out" : hasVariants(p) && p.v.length > 1 ? "Choose ✨" : "+ Add"}</button>
      </div>
    </div>
  </article>`;
}

function renderGrid(append = false) {
  const list = currentList();
  const from = append ? grid.children.length : 0;
  const slice = list.slice(from, view.shown);
  if (!append) grid.innerHTML = "";
  if (!list.length) {
    grid.innerHTML = `<div class="empty-grid"><b>🥺</b>${view.filter === "wish" ? "No saved faves yet — tap the 💗 on anything you love." : "Nothing matches that search, pretty. Try another word?"}</div>`;
  } else {
    grid.insertAdjacentHTML("beforeend", slice.map(cardHTML).join(""));
    $$("img", grid).forEach((im) => im.complete && im.naturalWidth && im.classList.add("ok"));
    if (!reduceMotion) [...grid.children].slice(from).forEach((c, i) => { c.style.animationDelay = Math.min(i, 11) * 45 + "ms"; c.classList.add("enter"); });
  }
  const shown = Math.min(view.shown, list.length);
  $("#gridCount").textContent = list.length ? `Showing ${shown} of ${list.length} pretty things` : "";
  $("#loadMore").hidden = shown >= list.length;
  $("#shopSub").textContent = view.filter === "wish" ? "Your saved faves 💗" :
    view.filter === "all" ? "Tap any item to pick your colour." : `${CATS[view.filter].label} — ${CATS[view.filter].blurb.toLowerCase()}.`;
}

function moveGlider() {
  const a = $(".chip.active", filtersEl);
  glider.style.opacity = a ? 1 : 0;
  if (!a) return;
  glider.style.width = a.offsetWidth + "px";
  glider.style.height = a.offsetHeight + "px";
  glider.style.transform = `translate(${a.offsetLeft - 6}px, ${a.offsetTop - 6}px)`;
}
function setFilter(f) {
  view.filter = f; view.shown = CONFIG.pageSize;
  $$(".chip", filtersEl).forEach((c) => c.classList.toggle("active", c.dataset.filter === f));
  const active = $(".chip.active", filtersEl);
  if (active && filtersEl.scrollWidth > filtersEl.clientWidth) filtersEl.scrollTo({ left: active.offsetLeft - 40, behavior: "smooth" });
  moveGlider();
  renderGrid();
}
filtersEl.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) setFilter(c.dataset.filter); });
$("#loadMore").addEventListener("click", () => { view.shown += CONFIG.pageSize; renderGrid(true); });
$("#sort").addEventListener("change", (e) => { view.sort = e.target.value; view.shown = CONFIG.pageSize; renderGrid(); });
let searchT;
$("#search").addEventListener("input", (e) => {
  clearTimeout(searchT);
  searchT = setTimeout(() => { view.query = e.target.value.trim(); view.shown = CONFIG.pageSize; renderGrid(); }, 180);
});
window.addEventListener("resize", moveGlider);
document.fonts && document.fonts.ready.then(moveGlider);
renderGrid();
moveGlider();

grid.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]"), heart = e.target.closest("[data-wish]");
  if (heart) return toggleWish(+heart.dataset.wish, heart);
  if (add) {
    const p = byId[add.dataset.add];
    if (hasVariants(p) && p.v.length > 1) return openModal(p.id);
    addToCart(p.id, hasVariants(p) ? 0 : -1, 1, add);
    add.classList.add("added"); add.textContent = "✓ Added";
    clearTimeout(add._t);
    add._t = setTimeout(() => { add.classList.remove("added"); add.textContent = "+ Add"; }, 1400);
    return;
  }
  const card = e.target.closest(".card");
  if (card) openModal(+card.dataset.id);
});

/* 3D tilt (rAF-throttled, desktop only) */
if (finePointer && !reduceMotion) {
  let target = null, ev = null, pending = false;
  grid.addEventListener("pointermove", (e) => {
    target = e.target.closest(".card"); ev = e;
    if (!target || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      if (!target) return;
      const r = target.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      target.style.setProperty("--ry", (x - 0.5) * 10 + "deg");
      target.style.setProperty("--rx", (0.5 - y) * 8 + "deg");
      target.style.setProperty("--mx", x * 100 + "%");
      target.style.setProperty("--my", y * 100 + "%");
    });
  });
  grid.addEventListener("pointerout", (e) => {
    const card = e.target.closest(".card");
    if (card && !card.contains(e.relatedTarget)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
  });
}

/* =========================================================
   WISHLIST
   ========================================================= */
function updateWishCount(pop) {
  const el = $("#wishCount");
  el.textContent = wish.size;
  if (pop) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
}
function toggleWish(id, btn) {
  const on = !wish.has(id);
  on ? wish.add(id) : wish.delete(id);
  save("eddy-wish", [...wish]);
  btn.classList.toggle("on", on);
  updateWishCount(true);
  toast(on ? `💗 Saved ${byId[id].n}` : "Removed from your faves");
  if (on) burst(btn);
}
$("#wishBtn").addEventListener("click", () => { setFilter("wish"); scrollToEl($("#shop")); });
updateWishCount();

/* =========================================================
   CART
   ========================================================= */
const drawer = $("#drawer"), scrim = $("#scrim");
const parseKey = (k) => { const [id, vi] = k.split("::"); return { p: byId[id], vi: +vi }; };
const lineInfo = (k) => {
  const { p, vi } = parseKey(k);
  const v = vi >= 0 && p.v ? p.v[vi] : null;
  return { p, v, name: p.n, opt: v ? v[0] : "", price: v ? v[1] || p.p : p.p, stock: v ? v[2] : p.q };
};
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartTotal = () => Object.entries(cart).reduce((s, [k, q]) => s + lineInfo(k).price * q, 0);

function addToCart(id, vi = -1, qty = 1, srcEl) {
  const k = `${id}::${vi}`, info = lineInfo(k);
  const max = info.stock > 0 ? info.stock : 99;
  if ((cart[k] || 0) >= max) return toast(`Only ${max} available, pretty 🥺`);
  cart[k] = Math.min(max, (cart[k] || 0) + qty);
  save("eddy-cart", cart);
  if (srcEl) flyToBag(srcEl);
  setTimeout(() => {
    renderCart();
    const bag = $("#bagBtn"); bag.classList.remove("bump"); void bag.offsetWidth; bag.classList.add("bump");
    const c = $("#bagCount"); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop");
  }, srcEl && !reduceMotion ? 700 : 0);
  toast(`🛍️ ${info.name}${info.opt ? " (" + info.opt + ")" : ""} added to your bag`);
}

function flyToBag(el) {
  if (reduceMotion) return;
  const a = el.getBoundingClientRect(), b = $("#bagBtn").getBoundingClientRect();
  const dot = document.createElement("div");
  dot.className = "fly";
  const x0 = a.left + a.width / 2 - 13, y0 = a.top + a.height / 2 - 13;
  dot.style.transform = `translate3d(${x0}px, ${y0}px, 0)`;
  document.body.appendChild(dot);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    dot.style.transform = `translate3d(${b.left + b.width / 2 - 13}px, ${b.top + b.height / 2 - 13}px, 0) scale(.4)`;
    dot.style.opacity = ".5";
  }));
  setTimeout(() => dot.remove(), 800);
  burst(el);
}

function renderCart() {
  $("#bagCount").textContent = cartCount();
  $("#subtotal").textContent = money(cartTotal());
  const items = $("#drawerItems");
  if (!cartCount()) {
    items.innerHTML = `<div class="empty"><span class="big-emoji">🛍️</span><h4>Your bag is feeling empty</h4><p>Let's fix that, pretty.</p><br><button class="btn btn-gloss btn-sm" data-shopnow><span>Start shopping</span></button></div>`;
    return;
  }
  items.innerHTML = Object.entries(cart).map(([k, q]) => {
    const L = lineInfo(k);
    return `<div class="line" data-line="${k}">
      <div class="line-media">${img(L.p, 160)}</div>
      <div><h4>${esc(L.name)}</h4>${L.opt ? `<div class="opt">${esc(L.opt)}</div>` : ""}<div class="lp">${money(L.price * q)}</div><button class="remove" data-remove="${k}">remove</button></div>
      <div class="qty"><button data-dec="${k}" aria-label="Decrease">−</button><span>${q}</span><button data-inc="${k}" aria-label="Increase">+</button></div>
    </div>`;
  }).join("");
}
$("#drawerItems").addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.hasAttribute("data-shopnow")) { closeDrawer(); return scrollToEl($("#shop")); }
  const k = t.dataset.inc || t.dataset.dec || t.dataset.remove;
  if (!k) return;
  if (t.dataset.inc) { const s = lineInfo(k).stock; if (s > 0 && cart[k] >= s) return toast(`Only ${s} available 🥺`); cart[k]++; }
  if (t.dataset.dec) cart[k]--;
  if (t.dataset.remove || cart[k] <= 0) {
    t.closest(".line").classList.add("out");
    delete cart[k]; save("eddy-cart", cart);
    setTimeout(renderCart, 280);
    return;
  }
  save("eddy-cart", cart); renderCart();
});
function openDrawer() { drawer.classList.add("open"); scrim.classList.add("show"); drawer.setAttribute("aria-hidden", "false"); lockScroll(true); }
function closeDrawer() { drawer.classList.remove("open"); scrim.classList.remove("show"); drawer.setAttribute("aria-hidden", "true"); lockScroll(false); }
$("#bagBtn").addEventListener("click", openDrawer);
$("#closeDrawer").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);

$("#checkoutBtn").addEventListener("click", () => {
  if (!cartCount()) return toast("Your bag is empty — go treat yourself 💕");
  const lines = Object.entries(cart).map(([k, q]) => {
    const L = lineInfo(k);
    return `• ${q} × ${L.name}${L.opt ? " (" + L.opt + ")" : ""} — ${money(L.price * q)}`;
  });
  const msg = `Hi Eddy! 🎀 I'd like to order:\n\n${lines.join("\n")}\n\nSubtotal: ${money(cartTotal())}\n\nPlease confirm delivery & payment details. Thank you! 💕`;
  confetti();
  setTimeout(() => window.open(waLink(msg), "_blank"), 450);
});
renderCart();

/* =========================================================
   QUICK VIEW
   ========================================================= */
const modal = $("#modal");
let mId = null, mVar = -1, mQty = 1;
function stockLabel(n) {
  const el = $("#modalStock");
  el.className = "stock" + (n <= 0 ? " out" : n <= 3 ? " low" : "");
  el.textContent = n <= 0 ? "Sold out" : n <= 3 ? `Only ${n} left` : "In stock";
}
function selectVar(i) {
  const p = byId[mId];
  mVar = i; mQty = 1; $("#qtyVal").textContent = 1;
  $$(".var", $("#modalVariants")).forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
  const v = i >= 0 ? p.v[i] : null;
  $("#modalPrice").innerHTML = v ? money(v[1] || p.p) : priceLabel(p);
  const stock = v ? v[2] : p.q;
  stockLabel(stock);
  $("#modalAdd").disabled = stock <= 0 || (hasVariants(p) && i < 0);
  $("#modalAdd span").textContent = stock <= 0 ? "Sold out" : hasVariants(p) && i < 0 ? "Pick an option ↑" : "Add to bag";
}
function openModal(id) {
  const p = byId[id];
  if (!p) return;
  mId = id;
  setImg($("#modalImg"), p, 800);
  $("#modalCat").textContent = CATS[p.c].label;
  $("#modalName").textContent = p.n;
  $("#modalDesc").textContent = CATS[p.c].desc;
  $("#modalVariants").innerHTML = (p.v || []).map((v, i) => {
    const c = colorOf(v[0]);
    return `<button class="var${c ? "" : " noswatch"}" data-i="${i}" ${v[2] <= 0 ? "disabled" : ""}>${c ? `<i style="background:${c}"></i>` : ""}${esc(v[0])}</button>`;
  }).join("");
  const firstIn = (p.v || []).findIndex((v) => v[2] > 0);
  selectVar(hasVariants(p) ? (p.v.length === 1 ? 0 : -1) : -1);
  if (hasVariants(p) && p.v.length > 1 && firstIn < 0) selectVar(-1);
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); lockScroll(true);
}
function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); lockScroll(false); }
$("#modalVariants").addEventListener("click", (e) => { const b = e.target.closest(".var"); if (b && !b.disabled) selectVar(+b.dataset.i); });
$("#closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
$("#qtyMinus").addEventListener("click", () => { mQty = Math.max(1, mQty - 1); $("#qtyVal").textContent = mQty; });
$("#qtyPlus").addEventListener("click", () => {
  const p = byId[mId], s = mVar >= 0 ? p.v[mVar][2] : p.q;
  mQty = Math.min(s > 0 ? s : 20, mQty + 1); $("#qtyVal").textContent = mQty;
});
$("#modalAdd").addEventListener("click", (e) => { addToCart(mId, mVar, mQty, e.currentTarget); setTimeout(closeModal, 300); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (modal.classList.contains("open")) closeModal();
  else if (drawer.classList.contains("open")) closeDrawer();
});

/* =========================================================
   POUT BY EDDY — virtual swatch
   ========================================================= */
const SHADES = [
  [5323224, "#ff4fa0", "#c8156c", "barbie pink", "Hot, juicy, main-character pink. Instantly makes any outfit a moment."],
  [5323249, "#d4143f", "#8a0623", "glossy cherry red", "A glassy cherry shine — classic, flirty and bold."],
  [5323253, "#f7997f", "#d0603f", "peachy glow", "Sun-kissed peach that warms up every skin tone."],
  [5323217, "#c9826f", "#8f5040", "pigmented nude", "Your lips but better. The everyday nude that goes with everything."],
  [5323246, "#8a4636", "#5a2618", "rich chocolate", "Deep, sweet and a little bit dangerous. Perfect over a brown liner."],
  [5323231, "#ef8fa3", "#c9566f", "clear · fruity", "Crystal-clear shine that smells like a fruit basket."],
  [5323233, "#e88e9d", "#c25a6c", "clear · minty", "Clear gloss with a cool, fresh minty tingle."],
].filter(([id]) => byId[id]);

const shadeSw = $("#shadeSwatches");
shadeSw.innerHTML = SHADES.map(([id, c, cd], i) =>
  `<button class="swatch ${i === 0 ? "active" : ""}" data-shade="${id}" style="--c:${c};--cd:${cd}" aria-label="${esc(byId[id].n)}" title="${esc(byId[id].n)}"></button>`).join("");
let currentShade = null, swipeRaf = 0;
const lipBase = $("#lipBase"), lipSwipe = $("#lipSwipe");

function showShadeInfo(s) {
  const p = byId[s[0]];
  $("#shadeKicker").textContent = s[3];
  $("#shadeName").textContent = p.n;
  $("#shadeVibe").textContent = s[4];
  $("#shadePrice").textContent = money(p.p);
  setImg($("#shadeImg"), p, 300);
  const btn = $("#shadeAdd");
  btn.disabled = p.q <= 0;
  $("span", btn).textContent = p.q <= 0 ? "Sold out" : "Add to bag";
}
function setShade(id, instant) {
  if (id === currentShade) return;
  const s = SHADES.find((x) => x[0] === id);
  currentShade = id;
  $$(".swatch", shadeSw).forEach((b) => b.classList.toggle("active", +b.dataset.shade === id));
  const info = $(".shade-info"); info.classList.remove("fade-swap"); void info.offsetWidth; info.classList.add("fade-swap");
  showShadeInfo(s);
  if (instant || reduceMotion) { lipBase.setAttribute("fill", s[1]); return; }
  cancelAnimationFrame(swipeRaf);
  lipSwipe.setAttribute("fill", s[1]);
  const wand = $("#swipeWand");
  wand.style.setProperty("--wc", s[1]);
  wand.classList.remove("go"); void wand.offsetWidth; wand.classList.add("go");
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
    lipSwipe.setAttribute("width", (e * 400).toFixed(1));
    if (k < 1) swipeRaf = requestAnimationFrame(step);
    else { lipBase.setAttribute("fill", s[1]); lipSwipe.setAttribute("width", 0); sparkleLips(); }
  };
  swipeRaf = requestAnimationFrame(step);
}
shadeSw.addEventListener("click", (e) => { const b = e.target.closest("[data-shade]"); if (b) setShade(+b.dataset.shade); });
$("#shadeAdd").addEventListener("click", (e) => addToCart(currentShade, -1, 1, e.currentTarget));
$("#shadeImg").addEventListener("click", () => openModal(currentShade));
if (SHADES.length) setShade(SHADES[0][0], true);

function sparkleLips() {
  const host = $("#lipsSparkles");
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    const size = 8 + Math.random() * 14;
    Object.assign(s.style, { left: 18 + Math.random() * 64 + "%", top: 25 + Math.random() * 50 + "%", width: size + "px", height: size + "px", animationDelay: Math.random() * 0.4 + "s" });
    host.appendChild(s);
    setTimeout(() => s.remove(), 1500);
  }
}

/* =========================================================
   GLOSS LAB
   ========================================================= */
const kit = PRODUCTS.find((p) => /Starter/i.test(p.n));
if (kit) {
  setImg($("#kitImg"), kit, 600);
  $("#kitPrice").textContent = money(kit.p);
  $("#kitBtn").addEventListener("click", (e) => addToCart(kit.id, -1, 1, e.currentTarget));
  $(".lab-photo").addEventListener("click", () => openModal(kit.id));
}
if (byId[5389465]) setImg($("#tubeImg"), byId[5389465], 400);
$("#labList").innerHTML = ["Heart tubes", "Maxi wand tubes", "Squeeze tubes", "Pigments", "Versagel", "Flavouring oils", "Glitters", "Mica shimmer"]
  .map((t) => `<li>${t}</li>`).join("");
$("#labShop").addEventListener("click", () => { setFilter("lab"); scrollToEl($("#shop")); });

/* =========================================================
   LOOKBOOK
   ========================================================= */
const LOOK = [5427404, 5411060, 5389759, 5427411, 5411175, 5427161].map((id) => byId[id]).filter(Boolean);
$("#insta").innerHTML = LOOK.map((p) =>
  `<button class="insta-tile reveal" data-look="${p.id}" aria-label="${esc(p.n)}">${img(p, 400)}<span class="ig-over">${esc(p.n)}<br>Shop it →</span></button>`).join("");
$("#insta").addEventListener("click", (e) => { const t = e.target.closest("[data-look]"); if (t) openModal(+t.dataset.look); });

/* =========================================================
   DECOR — drips, bubbles, footer pool
   ========================================================= */
function buildDrips() {
  // each drip and its drop share one timing, so the drop lets go right as the drip is longest
  let x = 10, html = "";
  while (x < innerWidth) {
    const dw = 14 + Math.random() * 20, dh = 26 + Math.random() * 40;
    const t = `animation-duration:${(3.5 + Math.random() * 3).toFixed(2)}s;animation-delay:${(-Math.random() * 6).toFixed(2)}s`;
    html += `<span class="drip" style="left:${x}px;width:${dw}px;height:${dh}px;${t}"></span>`;
    if (Math.random() < 0.7) {
      const s = dw * 0.6;
      html += `<span class="drip-drop" style="left:${x + dw / 2 - s / 2}px;top:${14 + dh * 1.12 - s * 0.6}px;width:${s}px;height:${s * 1.2}px;${t}"></span>`;
    }
    x += dw + 36 + Math.random() * 90;
  }
  $("#drips").innerHTML = html;
}
// gloss drops falling into the footer pool (positions in %, so no rebuild on resize)
const dropCount = isSmall ? 4 : 7;
$("#poolDrops").innerHTML = Array.from({ length: dropCount }, (_, i) => {
  const left = ((i + 0.5) / dropCount) * 100 + (Math.random() - 0.5) * 8;
  const dur = (3.2 + Math.random() * 2.5).toFixed(2), delay = (-Math.random() * 5).toFixed(2);
  const t = `left:${left.toFixed(1)}%;animation-duration:${dur}s;animation-delay:${delay}s`;
  return `<span class="pool-drop" style="${t}"></span><span class="pool-ripple" style="${t}"></span>`;
}).join("");

buildDrips();
let lastW = innerWidth, rz;
window.addEventListener("resize", () => {
  if (innerWidth === lastW) return; // ignore mobile URL-bar height changes
  lastW = innerWidth;
  clearTimeout(rz); rz = setTimeout(buildDrips, 250);
});
if (!reduceMotion) {
  const n = isSmall ? 4 : 8;
  $("#bubbles").innerHTML = Array.from({ length: n }, () => {
    const s = 12 + Math.random() * 30;
    return `<span class="bubble" style="width:${s}px;height:${s}px;left:${Math.random() * 100}%;animation-duration:${16 + Math.random() * 16}s;animation-delay:${-Math.random() * 30}s"></span>`;
  }).join("");
}

/* =========================================================
   BUBBLE TRAIL — glossy bubbles follow the mouse / finger.
   Drawn on one canvas from pre-rendered sprites, and only
   animates while bubbles are alive, so it stays cheap.
   ========================================================= */
(function bubbleTrail() {
  if (reduceMotion) return;
  const cvs = document.createElement("canvas");
  cvs.className = "trail-canvas";
  cvs.setAttribute("aria-hidden", "true");
  document.body.appendChild(cvs);
  const c = cvs.getContext("2d");
  let W = 0, H = 0;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cvs.width = W * dpr; cvs.height = H * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const sprites = ["#ff3d8b", "#ff7eb6", "#c86bfa", "#ffb38f", "#ff5fa2"].map((tint) => {
    const s = 72, r = s / 2 - 2, o = document.createElement("canvas");
    o.width = o.height = s;
    const g = o.getContext("2d");
    const body = g.createRadialGradient(s * 0.38, s * 0.34, 1, s / 2, s / 2, r);
    body.addColorStop(0, "rgba(255,255,255,.85)");
    body.addColorStop(0.3, "rgba(255,255,255,.18)");
    body.addColorStop(0.75, rgba(tint, 0.16));
    body.addColorStop(1, rgba(tint, 0.6));
    g.fillStyle = body;
    g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = "rgba(255,255,255,.95)";
    g.beginPath(); g.ellipse(s * 0.36, s * 0.3, r * 0.24, r * 0.12, -0.6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(s * 0.68, s * 0.7, r * 0.07, 0, Math.PI * 2); g.fill();
    return o;
  });

  const parts = [];
  let raf = 0, lx = null, ly = null;
  function spawn(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (parts.length > 80) parts.shift();
      parts.push({ x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 12, vx: (Math.random() - 0.5) * 0.9, vy: -(Math.random() * 1.3 + 0.4),
        r: 4 + Math.random() * 11, life: 0, max: 45 + Math.random() * 45, s: sprites[(Math.random() * sprites.length) | 0], w: Math.random() * 60 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    c.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const k = ++p.life / p.max;
      if (k >= 1) { parts.splice(i, 1); continue; }
      p.x += p.vx + Math.sin((p.life + p.w) / 9) * 0.4;  // gentle wobble as they float up
      p.y += p.vy; p.vy *= 0.995;
      const r = p.r * (k < 0.15 ? 0.5 + (k / 0.15) * 0.5 : 1 + (k - 0.15) * 0.3);
      c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.drawImage(p.s, p.x - r, p.y - r, r * 2, r * 2);
    }
    c.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; c.clearRect(0, 0, W, H); }
  }
  function move(x, y) {
    if (lx === null) { lx = x; ly = y; return; }
    const d = Math.hypot(x - lx, y - ly);
    if (d < 16) return;
    lx = x; ly = y;
    spawn(x, y, d > 70 ? 2 : 1);
  }
  addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") move(e.clientX, e.clientY); }, { passive: true });
  addEventListener("touchstart", (e) => { const t = e.touches[0]; if (t) { lx = t.clientX; ly = t.clientY; spawn(lx, ly, 3); } }, { passive: true });
  addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }, { passive: true });
})();

/* =========================================================
   FX — toast, burst, confetti
   ========================================================= */
function toast(msg) {
  const host = $("#toasts"), t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  host.appendChild(t);
  while (host.children.length > 2) host.firstChild.remove();
  setTimeout(() => t.remove(), 3100);
}
const PINKS = ["#ff3d8b", "#ff7eb6", "#ffc6dd", "#d81b6a", "#f6c4ff", "#ffffff", "#ffb38f"];
function burst(el) {
  if (reduceMotion) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const frag = document.createDocumentFragment(), nodes = [];
  for (let i = 0; i < 10; i++) {
    const d = document.createElement("span"), a = (Math.PI * 2 * i) / 10, dist = 28 + Math.random() * 26;
    d.className = "burst";
    d.style.cssText = `background:${PINKS[i % PINKS.length]};--x:${cx}px;--y:${cy}px;--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist}px`;
    frag.appendChild(d); nodes.push(d);
  }
  document.body.appendChild(frag);
  setTimeout(() => nodes.forEach((n) => n.remove()), 850);
}
const cv = $("#confetti"), ctx = cv.getContext("2d");
let parts = [], confettiRaf = 0;
function heart(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s * 0.3);
  ctx.bezierCurveTo(x - s / 2, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s * 0.6, x + s / 2, y + s * 0.3);
  ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s * 0.3); ctx.fill();
}
function confetti() {
  if (reduceMotion) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (let i = 0; i < 120; i++) parts.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 15 - 6,
    s: 6 + Math.random() * 10, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: PINKS[(Math.random() * PINKS.length) | 0], k: (Math.random() * 3) | 0, life: 0 });
  cancelAnimationFrame(confettiRaf);
  const loop = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - p.life / 150);
      if (p.k === 0) heart(0, -p.s / 2, p.s);
      else if (p.k === 1) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.5, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.s / 2, -p.s / 5, p.s, p.s / 2.5);
      ctx.restore();
    }
    parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 150);
    if (parts.length) confettiRaf = requestAnimationFrame(loop); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  loop();
}

/* =========================================================
   NAV, REVEAL, OFF-SCREEN PAUSING, LOADER
   ========================================================= */
const nav = $("#nav"), burger = $("#burger"), navLinks = $("#navLinks");
let navTick = false;
window.addEventListener("scroll", () => {
  if (navTick) return;
  navTick = true;
  requestAnimationFrame(() => { nav.classList.toggle("scrolled", scrollY > 40); navTick = false; });
}, { passive: true });
burger.addEventListener("click", () => { burger.classList.toggle("open"); navLinks.classList.toggle("open"); });

// pause looping animations in sections that are off-screen
const animIO = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle("is-off", !en.isIntersecting)), { rootMargin: "100px" });
$$("[data-anim]").forEach((el) => animIO.observe(el));

function startReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const sibs = [...en.target.parentElement.children].filter((c) => c.classList.contains("reveal"));
      en.target.style.transitionDelay = Math.min(sibs.indexOf(en.target), 7) * 70 + "ms";
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));
}

$("#year").textContent = new Date().getFullYear();

// Loader: waits for fonts (max 1.5s) — never for images — then fades out.
const loader = $("#loader");
const seen = document.documentElement.classList.contains("seen");
const minShow = seen || reduceMotion ? 0 : 700;
const t0 = performance.now();
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(() => {
  setTimeout(() => {
    window.__eddyReady = true;
    initScroll();
    loader.classList.add("done");
    try { sessionStorage.setItem("eddy-seen", "1"); } catch {}
    requestAnimationFrame(() => { startReveal(); moveGlider(); });
    setTimeout(() => loader.remove(), 700);
  }, Math.max(0, minShow - (performance.now() - t0)));
});
