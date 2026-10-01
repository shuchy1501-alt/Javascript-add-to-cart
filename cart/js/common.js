/* ===== Shared cart logic (used by shop + cart pages) ===== */
const CART_KEY = "product_cart";
const PROMO_KEY = "cart_promo";
const CONFIG = { taxRate: 0.05, shippingFee: 5.99, freeShippingOver: 100, maxQty: 10 };
const PROMOS = {
    SAVE10:   { type: "percent",  value: 10, label: "10% off" },
    WELCOME5: { type: "flat",     value: 5,  label: "$5 off" },
    FREESHIP: { type: "shipping", label: "Free shipping" },
};

// Money is calculated in cents to avoid floating point errors (0.1 + 0.2 problem)
const toCents = (n) => Math.round(Number(n) * 100);
const money = (c) => "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

function getCart() {
    try { const c = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(c) ? c : []; }
    catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateBadge(); }
function getPromo() { return localStorage.getItem(PROMO_KEY) || ""; }

const maxQtyFor = (item) => Math.min(item.stock || CONFIG.maxQty, CONFIG.maxQty);
const listPriceCents = (item) => toCents(item.price);
const unitPriceCents = (item) => toCents(item.price * (1 - (item.discountPercentage || 0) / 100));

function addToCart(p, n = 1) {
    const cart = getCart();
    const found = cart.find((i) => i.id == p.id);
    const item = found || { ...p, qty: 0 };
    const max = maxQtyFor(item);
    if (item.qty >= max) { toast(`Maximum ${max} per order for this item`, "warning"); return; }
    item.qty = Math.min(item.qty + n, max);
    if (!found) cart.push(item);
    saveCart(cart);
    toast(`<b>${esc(p.name)}</b> added to cart`, "success");
}

function setQty(id, qty) {
    const cart = getCart();
    const item = cart.find((i) => i.id == id);
    if (!item) return;
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > maxQtyFor(item)) { qty = maxQtyFor(item); toast(`Only ${qty} available per order`, "warning"); }
    item.qty = qty;
    saveCart(cart);
}
function removeFromCart(id) { saveCart(getCart().filter((i) => i.id != id)); }

/* All order calculations live here */
function calcTotals(cart, promoCode) {
    let units = 0, subtotal = 0, productDiscount = 0;
    cart.forEach((i) => {
        const list = listPriceCents(i) * i.qty, net = unitPriceCents(i) * i.qty;
        units += i.qty; subtotal += list; productDiscount += list - net;
    });
    const afterProduct = subtotal - productDiscount;
    const promo = PROMOS[promoCode];
    let promoDiscount = 0;
    if (promo?.type === "percent") promoDiscount = Math.round((afterProduct * promo.value) / 100);
    if (promo?.type === "flat") promoDiscount = Math.min(toCents(promo.value), afterProduct);
    const taxable = afterProduct - promoDiscount;
    const freeShip = cart.length === 0 || taxable >= toCents(CONFIG.freeShippingOver) || promo?.type === "shipping";
    const shipping = freeShip ? 0 : toCents(CONFIG.shippingFee);
    const tax = Math.round(taxable * CONFIG.taxRate);
    return {
        units, subtotal, productDiscount, promoDiscount, shipping, tax,
        total: taxable + shipping + tax,
        totalSaved: productDiscount + promoDiscount,
        toFreeShipping: Math.max(0, toCents(CONFIG.freeShippingOver) - taxable),
    };
}

function updateBadge() {
    const w = document.querySelector(".wish_count");
    if (w) w.innerHTML = getWish().length ? `<span class="badge rounded-pill bg-danger">${getWish().length}</span>` : "";
    const el = document.querySelector(".cart_items_count");
    if (!el) return;
    const units = getCart().reduce((a, i) => a + i.qty, 0);
    el.innerHTML = units > 0
        ? `<span class="position-absolute top-0 start-100 translate-middle badge badge-sm rounded-pill bg-danger">${units}</span>` : "";
}

function toast(message, type = "success") {
    let box = document.getElementById("toast-box");
    if (!box) {
        box = document.createElement("div");
        box.id = "toast-box";
        box.className = "toast-container position-fixed top-0 end-0 p-3";
        box.style.zIndex = 2000;
        document.body.appendChild(box);
    }
    const el = document.createElement("div");
    el.className = `toast align-items-center text-bg-${type} border-0`;
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    box.appendChild(el);
    el.addEventListener("hidden.bs.toast", () => el.remove());
    new bootstrap.Toast(el, { delay: 2200 }).show();
}

window.addEventListener("storage", () => { updateBadge(); if (typeof renderCart === "function") renderCart(); }); // sync other tabs
document.addEventListener("DOMContentLoaded", () => { renderChrome(); initTheme(); updateBadge(); });

/* ===== Wishlist ===== */
const WISH_KEY = "wishlist";
function getWish() { try { const w = JSON.parse(localStorage.getItem(WISH_KEY)); return Array.isArray(w) ? w : []; } catch { return []; } }
function toggleWish(id) {
    let w = getWish(); const has = w.includes(id);
    w = has ? w.filter((x) => x !== id) : [...w, id];
    localStorage.setItem(WISH_KEY, JSON.stringify(w));
    updateBadge();
    toast(has ? "Removed from wishlist" : "Added to wishlist", has ? "secondary" : "success");
    return !has;
}
function stars(r) {
    let h = "";
    for (let i = 1; i <= 5; i++) h += `<i class="bi ${r >= i - 0.25 ? "bi-star-fill" : r >= i - 0.75 ? "bi-star-half" : "bi-star"}"></i>`;
    return `<span class="stars">${h}</span>`;
}

/* ===== Shared navbar + footer ===== */
function renderChrome() {
    const page = document.body.dataset.page;
    const nav = document.getElementById("site-nav"), foot = document.getElementById("site-footer");
    if (nav) nav.innerHTML = `
    <nav class="navbar navbar-expand-lg site-nav sticky-top"><div class="container">
      <a class="navbar-brand" href="Ecommerce.html"><i class="bi bi-bag-heart-fill"></i> ShopEase</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
      <div class="collapse navbar-collapse" id="mainNav"><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-3">
        <li class="nav-item"><a class="nav-link ${page === "shop" ? "active" : ""}" href="Ecommerce.html">Shop</a></li>
        <li class="nav-item"><a class="nav-link" href="Ecommerce.html?wishlist=1"><i class="bi bi-heart"></i> Wishlist <span class="wish_count"></span></a></li>
        <li class="nav-item"><a class="nav-link ${page === "orders" ? "active" : ""}" href="orders.html">My Orders</a></li>
        <li class="nav-item"><a class="nav-link ${page === "cart" ? "active" : ""}" href="cart.html"><i class="bi bi-cart3 fs-5 position-relative cart_items_count"></i> Cart</a></li>
      <li class="nav-item"><button class="nav-link btn btn-link" id="theme-toggle" aria-label="Toggle dark mode"></button></li>
      </ul></div></div></nav>`;
    if (foot) foot.innerHTML = `
    <footer class="site-footer mt-5"><div class="container py-4 d-flex flex-column flex-md-row justify-content-between gap-2">
      <div><b><i class="bi bi-bag-heart-fill"></i> ShopEase</b><div class="small opacity-75">Quality products, simple shopping.</div></div>
      <div class="small opacity-75 align-self-md-end">&copy; ${new Date().getFullYear()} ShopEase. Product data by DummyJSON.</div>
    </div></footer>`;
}

/* ===== Orders ===== */
const ORDERS_KEY = "orders";
function getOrders() { try { const o = JSON.parse(localStorage.getItem(ORDERS_KEY)); return Array.isArray(o) ? o : []; } catch { return []; } }
function saveOrder(order) { localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...getOrders()])); }

/* ===== Dark mode toggle (remembers choice, defaults to system setting) ===== */
function initTheme() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const root = document.documentElement;
    const set = (t) => {
        root.setAttribute("data-bs-theme", t); localStorage.setItem("theme", t);
        btn.innerHTML = t === "dark" ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    };
    set(root.getAttribute("data-bs-theme") || "light");
    btn.onclick = () => set(root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
}
