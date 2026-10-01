/* ===== Cart page ===== */
const $ = (s) => document.querySelector(s);

function renderCart() {
    const cart = getCart();
    const t = calcTotals(cart, getPromo());

    $(".item_count").textContent = `${t.units} ${t.units === 1 ? "item" : "items"}`;

    $(".show_products").innerHTML = cart.length === 0
        ? `<div class="product-card p-5 shadow-sm text-center">
             <i class="bi bi-cart-x display-4 text-muted"></i>
             <h5 class="mt-3">Your cart is empty</h5>
             <a href="Ecommerce.html" class="btn btn-primary mt-2">Continue shopping</a>
           </div>`
        : cart.map((p) => {
            const d = p.discountPercentage || 0;
            return `
          <div class="product-card p-3 shadow-sm">
            <div class="row align-items-center g-2">
              <div class="col-md-2 col-3"><img src="${esc(p.thumbnail)}" alt="${esc(p.name)}" class="product-image"></div>
              <div class="col-md-4 col-9">
                <h6 class="mb-1">${esc(p.name)}</h6>
                <p class="text-muted mb-0">${esc([p.brand, p.category].filter(Boolean).join(" | "))}</p>
                ${d > 0 ? `<span class="discount-badge mt-2 d-inline-block">${Math.round(d)}% OFF</span>` : ""}
              </div>
              <div class="col-md-2 col-6">
                <div class="d-flex align-items-center gap-2">
                  <button class="quantity-btn" data-action="dec" data-id="${p.id}" ${p.qty <= 1 ? "disabled" : ""}>-</button>
                  <input type="number" class="quantity-input" data-action="set" data-id="${p.id}" value="${p.qty}" min="1" max="${maxQtyFor(p)}">
                  <button class="quantity-btn" data-action="inc" data-id="${p.id}" ${p.qty >= maxQtyFor(p) ? "disabled" : ""}>+</button>
                </div>
              </div>
              <div class="col-md-3 col-5">
                <div><span class="fw-bold">${money(unitPriceCents(p))}</span>
                  ${d > 0 ? `<small class="text-muted text-decoration-line-through ms-1">${money(listPriceCents(p))}</small>` : ""}
                  <small class="text-muted"> each</small></div>
                <div><span class="fw-bold">${money(unitPriceCents(p) * p.qty)}</span> <small class="text-muted">Subtotal</small></div>
              </div>
              <div class="col-md-1 col-1 text-end"><i class="bi bi-trash remove-btn" role="button" data-action="del" data-id="${p.id}" title="Remove"></i></div>
            </div>
          </div>`;
        }).join("");

    // Summary
    $("#subtotal").textContent = money(t.subtotal);
    $("#product-discount").textContent = "-" + money(t.productDiscount);
    $("#promo-row").classList.toggle("d-none", t.promoDiscount === 0);
    $("#promo-discount").textContent = "-" + money(t.promoDiscount);
    $("#shipping").innerHTML = t.shipping === 0 ? `<span class="text-success">Free</span>` : money(t.shipping);
    $("#tax").textContent = money(t.tax);
    $("#total").textContent = money(t.total);
    $("#saved").textContent = t.totalSaved > 0 ? `You are saving ${money(t.totalSaved)} on this order` : "";
    $("#ship-hint").textContent = cart.length && t.toFreeShipping > 0 && !(PROMOS[getPromo()]?.type === "shipping")
        ? `Add ${money(t.toFreeShipping)} more for free shipping` : "";
    $("#checkout").disabled = cart.length === 0;
    $("#clear-cart").classList.toggle("d-none", cart.length === 0);
    renderPromo();
    updateBadge();
}

function renderPromo() {
    const code = getPromo();
    $("#promo-input").value = code;
    $("#promo-input").disabled = !!code;
    $("#promo-btn").textContent = code ? "Remove" : "Apply";
    $("#promo-msg").innerHTML = code ? `<span class="text-success">${esc(code)} applied: ${PROMOS[code].label}</span>` : "";
}

$(".show_products").addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "INPUT") return;
    const item = getCart().find((i) => i.id == el.dataset.id);
    if (!item) return;
    if (el.dataset.action === "inc") setQty(item.id, item.qty + 1);
    if (el.dataset.action === "dec") setQty(item.id, item.qty - 1);
    if (el.dataset.action === "del") removeFromCart(item.id);
    renderCart();
});
$(".show_products").addEventListener("change", (e) => {
    if (e.target.dataset.action === "set") { setQty(e.target.dataset.id, e.target.value); renderCart(); }
});

$("#promo-btn").addEventListener("click", () => {
    if (getPromo()) { localStorage.removeItem(PROMO_KEY); return renderCart(); }
    const code = $("#promo-input").value.trim().toUpperCase();
    if (!PROMOS[code]) { $("#promo-msg").innerHTML = `<span class="text-danger">Invalid promo code</span>`; return; }
    localStorage.setItem(PROMO_KEY, code);
    renderCart();
});

$("#clear-cart").addEventListener("click", () => {
    if (confirm("Remove all items from your cart?")) { saveCart([]); localStorage.removeItem(PROMO_KEY); renderCart(); }
});

$("#checkout").addEventListener("click", () => { location.href = "checkout.html"; });

renderCart();
