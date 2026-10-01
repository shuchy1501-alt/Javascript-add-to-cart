/* ===== Shop page: search, filter, sort, wishlist, details modal, load more ===== */
const PAGE_SIZE = 12;
const $ = (s) => document.querySelector(s);
const grid = $(".showProduct");
let all = [], view = [], shown = 0;
const state = { q: "", cat: "", sort: "", wish: new URLSearchParams(location.search).has("wishlist") };

const label = (slug) => slug.replace(/-/g, " ");
const cartItem = (p) => ({ id: p.id, name: p.name, price: p.price, discountPercentage: p.discountPercentage,
    thumbnail: p.thumbnail, stock: p.stock, brand: p.brand, category: label(p.category) });

function stockInfo(p) {
    if (p.stock <= 0) return `<span class="stock text-danger">Out of stock</span>`;
    if (p.stock <= 5) return `<span class="stock text-warning">Only ${p.stock} left</span>`;
    return `<span class="stock text-success">In stock</span>`;
}
const priceHtml = (p) => `${p.discountPercentage > 0 ? `<span>${money(listPriceCents(p))}</span> ` : ""}${money(unitPriceCents(p))}`;

function card(p) {
    const w = getWish().includes(p.id);
    return `
    <div class="col-lg-3 col-md-4 col-6"><div class="product-grid">
        <div class="product-image">
            <a href="#" class="image" data-view="${p.id}">
                <img class="pic-1" src="${esc(p.thumbnail)}" alt="${esc(p.name)}" loading="lazy">
                <img class="pic-2" src="${esc(p.images[1] || p.thumbnail)}" alt="${esc(p.name)}" loading="lazy">
            </a>
            ${p.discountPercentage >= 1 ? `<span class="product-sale-label">-${Math.round(p.discountPercentage)}%</span>` : ""}
            <a href="#" class="product-like-icon" data-wish="${p.id}" data-tip="Wishlist"><i class="${w ? "fas wished" : "far"} fa-heart"></i></a>
            <ul class="product-links">
                <li data-view="${p.id}"><a href="#"><i class="fa fa-search"></i></a></li>
                ${p.stock > 0 ? `<li data-add="${p.id}"><a href="#"><i class="fas fa-shopping-cart"></i></a></li>` : ""}
            </ul>
        </div>
        <div class="product-content">
            <small class="text-muted brand">${esc(p.brand || label(p.category))}</small>
            <h3 class="title"><a href="#" data-view="${p.id}">${esc(p.name)}</a></h3>
            <div>${stars(p.rating)} <small class="text-muted">(${p.rating.toFixed(1)})</small></div>
            <div class="price">${priceHtml(p)}</div>
            ${stockInfo(p)}
        </div>
    </div></div>`;
}

function applyFilters() {
    const q = state.q.toLowerCase(), wish = getWish();
    view = all.filter((p) => (!state.cat || p.category === state.cat) && (!state.wish || wish.includes(p.id))
        && (!q || (p.name + " " + p.brand + " " + p.category).toLowerCase().includes(q)));
    const sorts = { "price-asc": (a, b) => unitPriceCents(a) - unitPriceCents(b), "price-desc": (a, b) => unitPriceCents(b) - unitPriceCents(a),
        rating: (a, b) => b.rating - a.rating, discount: (a, b) => b.discountPercentage - a.discountPercentage };
    if (sorts[state.sort]) view.sort(sorts[state.sort]);
    shown = 0; grid.innerHTML = ""; showMore();
}

function showMore() {
    const next = view.slice(shown, shown + PAGE_SIZE);
    grid.insertAdjacentHTML("beforeend", next.map(card).join(""));
    shown += next.length;
    $("#result-count").textContent = `Showing ${shown} of ${view.length} products`;
    $("#load-more").classList.toggle("d-none", shown >= view.length);
    if (!view.length) grid.innerHTML = `<div class="text-center text-muted py-5"><i class="bi bi-emoji-frown display-4"></i>
        <p class="mt-2">${state.wish ? "Your wishlist is empty." : "No products match your search."}</p></div>`;
}

function openModal(id) {
    const p = all.find((x) => x.id == id), max = Math.min(p.stock, CONFIG.maxQty);
    const w = getWish().includes(p.id), imgs = p.images.length ? p.images : [p.thumbnail];
    $("#modal-body").innerHTML = `<div class="row g-4">
      <div class="col-md-6"><img id="g-main" class="gallery-main" src="${esc(imgs[0])}" alt="${esc(p.name)}">
        <div class="d-flex gap-2 mt-2 flex-wrap">${imgs.slice(0, 5).map((u, i) => `<img class="gallery-thumb ${i ? "" : "active"}" src="${esc(u)}" data-img="${esc(u)}" alt="">`).join("")}</div></div>
      <div class="col-md-6">
        <small class="text-muted text-uppercase">${esc(p.brand)} ${p.brand ? "&middot;" : ""} <span class="text-cap">${esc(label(p.category))}</span></small>
        <h4 class="mt-1">${esc(p.name)}</h4>
        <div class="mb-2">${stars(p.rating)} <small class="text-muted">${p.rating.toFixed(1)}</small></div>
        <div class="fs-4 fw-bold">${money(unitPriceCents(p))}
          ${p.discountPercentage >= 1 ? `<small class="fs-6 text-muted text-decoration-line-through ms-1">${money(listPriceCents(p))}</small> <span class="discount-badge badge bg-success-subtle text-success-emphasis">${Math.round(p.discountPercentage)}% OFF</span>` : ""}</div>
        <p class="text-muted mt-2">${esc(p.description)}</p>
        <div class="mb-3">${stockInfo(p)}</div>
        <div class="d-flex gap-2 align-items-center">
          ${max > 0 ? `<select id="m-qty" class="form-select w-auto">${Array.from({ length: max }, (_, i) => `<option>${i + 1}</option>`).join("")}</select>
          <button class="btn btn-primary flex-grow-1" data-modal-add="${p.id}"><i class="bi bi-cart-plus"></i> Add to cart</button>` : `<button class="btn btn-secondary flex-grow-1" disabled>Out of stock</button>`}
          <button class="btn btn-outline-danger" data-wish="${p.id}" title="Wishlist"><i class="bi ${w ? "bi-heart-fill" : "bi-heart"}"></i></button>
        </div></div></div>`;
    bootstrap.Modal.getOrCreateInstance("#productModal").show();
}

document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("a[href='#']")) e.preventDefault();
    let el;
    if ((el = t.closest("[data-wish]"))) {
        const id = +el.dataset.wish, on = toggleWish(id);
        document.querySelectorAll(`[data-wish="${id}"] i`).forEach((i) => {
            if (i.classList.contains("fa-heart")) { i.className = `${on ? "fas wished" : "far"} fa-heart`; }
            else i.className = `bi ${on ? "bi-heart-fill" : "bi-heart"}`;
        });
        if (state.wish) applyFilters();
    } else if ((el = t.closest("[data-modal-add]"))) {
        addToCart(cartItem(all.find((p) => p.id == el.dataset.modalAdd)), +$("#m-qty").value);
    } else if ((el = t.closest("[data-add]"))) {
        addToCart(cartItem(all.find((p) => p.id == el.dataset.add)));
    } else if ((el = t.closest("[data-view]"))) openModal(el.dataset.view);
    else if ((el = t.closest("[data-img]"))) {
        $("#g-main").src = el.dataset.img;
        document.querySelectorAll(".gallery-thumb").forEach((i) => i.classList.toggle("active", i === el));
    }
});

$("#search").addEventListener("input", (e) => { state.q = e.target.value.trim(); applyFilters(); });
$("#category").addEventListener("change", (e) => { state.cat = e.target.value; applyFilters(); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; applyFilters(); });
$("#load-more").addEventListener("click", showMore);
$("#wish-toggle").addEventListener("click", () => { state.wish = !state.wish; syncWishBtn(); applyFilters(); });
function syncWishBtn() {
    const b = $("#wish-toggle");
    b.classList.toggle("btn-danger", state.wish); b.classList.toggle("btn-outline-danger", !state.wish);
}

async function init() {
    grid.innerHTML = Array(8).fill(`<div class="col-lg-3 col-md-4 col-6"><div class="skeleton"></div></div>`).join("");
    syncWishBtn();
    try {
        const res = await fetch("https://dummyjson.com/products?limit=0");
        if (!res.ok) throw new Error("HTTP " + res.status);
        all = (await res.json()).products.map((p) => ({
            id: p.id, name: p.title, price: p.price, discountPercentage: p.discountPercentage || 0, thumbnail: p.thumbnail,
            images: p.images || [], stock: p.stock ?? 0, brand: p.brand || "", category: p.category || "other",
            rating: p.rating || 0, description: p.description || "" }));
        const cats = [...new Set(all.map((p) => p.category))].sort();
        $("#category").innerHTML += cats.map((c) => `<option value="${c}">${esc(label(c))}</option>`).join("");
        applyFilters();
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<div class="alert alert-danger text-center">Products load kora jayni. Internet check kore <a href="">reload</a> korun.</div>`;
    }
}
init();
