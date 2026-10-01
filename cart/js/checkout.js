/* ===== Checkout page ===== */
const $ = (s) => document.querySelector(s);
const form = $("#checkout-form");
const cart = getCart();

if (cart.length === 0) {
    location.replace("cart.html");
} else {
    const promo = getPromo(), t = calcTotals(cart, promo);
    $("#sum-items").innerHTML = cart.map((i) => `
      <div class="d-flex align-items-center gap-2 mb-2">
        <img src="${esc(i.thumbnail)}" alt="" width="48" height="48" class="rounded" style="object-fit:cover;background:#f3f4f6">
        <div class="flex-grow-1 small">${esc(i.name)}<div class="text-muted">Qty ${i.qty}</div></div>
        <b class="small">${money(unitPriceCents(i) * i.qty)}</b></div>`).join("");
    const row = (l, v, cls = "") => `<div class="d-flex justify-content-between mb-2 ${cls}"><span class="text-muted">${l}</span><span>${v}</span></div>`;
    $("#sum-rows").innerHTML = row("Subtotal", money(t.subtotal))
        + row("Product discount", "-" + money(t.productDiscount), "text-success")
        + (t.promoDiscount ? row(`Promo (${esc(promo)})`, "-" + money(t.promoDiscount), "text-success") : "")
        + row("Shipping", t.shipping ? money(t.shipping) : "Free") + row("Tax", money(t.tax))
        + `<hr><div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>${money(t.total)}</span></div>`;

    const method = () => form.elements.pay.value;
    function syncPay() {
        ["bkash", "card"].forEach((k) => {
            const on = method() === k;
            $("#pay-" + k).classList.toggle("d-none", !on);
            $("#pay-" + k).querySelectorAll("input").forEach((i) => (i.required = on));
        });
    }
    form.querySelectorAll("input[name=pay]").forEach((r) => r.addEventListener("change", syncPay));

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.classList.add("was-validated"); form.querySelector(":invalid")?.focus(); return; }
        const f = Object.fromEntries(new FormData(form));
        const pay = f.pay === "cod" ? "Cash on delivery" : f.pay === "bkash" ? `bKash (TrxID ${f.trx})`
            : `Card ending ${f.cardno.replace(/\D/g, "").slice(-4)}`;       // card details are never stored
        const order = {
            id: "SE-" + Date.now().toString(36).toUpperCase(), date: new Date().toISOString(), status: "Processing",
            customer: { name: f.name.trim(), phone: f.phone, email: f.email, address: f.address.trim(), city: f.city.trim(), note: f.note },
            payment: pay, promo,
            items: cart.map((i) => ({ name: i.name, thumbnail: i.thumbnail, qty: i.qty, unit: unitPriceCents(i) })),
            totals: calcTotals(cart, promo),
        };
        $("#place-order").disabled = true;
        saveOrder(order);
        saveCart([]); localStorage.removeItem(PROMO_KEY);
        location.href = "orders.html?new=" + order.id;
    });
}
