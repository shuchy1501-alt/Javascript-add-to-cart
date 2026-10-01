/* ===== Order confirmation + order history ===== */
const orders = getOrders();
const newId = new URLSearchParams(location.search).get("new");
const fmtDate = (d) => new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const placed = orders.find((o) => o.id === newId);
if (placed) {
    document.getElementById("banner").innerHTML = `
      <div class="bg-white rounded-3 shadow-sm p-4 text-center mb-4">
        <i class="bi bi-check-circle-fill text-success display-3"></i>
        <h4 class="mt-2">Thank you, ${esc(placed.customer.name.split(" ")[0])}! Your order is placed.</h4>
        <p class="text-muted mb-1">Order number: <b>${esc(placed.id)}</b></p>
        <p class="text-muted mb-3">Total ${money(placed.totals.total)} &middot; ${esc(placed.payment)}</p>
        <a href="Ecommerce.html" class="btn btn-primary">Continue shopping</a>
      </div>`;
}

const row = (l, v, cls = "") => `<div class="d-flex justify-content-between small ${cls}"><span class="text-muted">${l}</span><span>${v}</span></div>`;
document.getElementById("orders").innerHTML = orders.length === 0
    ? `<div class="bg-white rounded-3 shadow-sm p-5 text-center"><i class="bi bi-receipt display-4 text-muted"></i>
       <h5 class="mt-3">No orders yet</h5><a href="Ecommerce.html" class="btn btn-primary mt-2">Start shopping</a></div>`
    : orders.map((o) => `
      <details class="bg-white rounded-3 shadow-sm p-3 mb-3" ${o.id === newId ? "open" : ""}>
        <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2" role="button">
          <span><b>${esc(o.id)}</b> <span class="text-muted small ms-2">${fmtDate(o.date)}</span></span>
          <span><span class="badge bg-primary-subtle text-primary-emphasis me-2">${esc(o.status)}</span><b>${money(o.totals.total)}</b></span>
        </summary>
        <hr>
        ${o.items.map((i) => `
          <div class="d-flex align-items-center gap-3 mb-2">
            <img src="${esc(i.thumbnail)}" alt="" width="52" height="52" class="rounded" style="object-fit:cover;background:#f3f4f6">
            <div class="flex-grow-1">${esc(i.name)}<div class="small text-muted">${money(i.unit)} &times; ${i.qty}</div></div>
            <b>${money(i.unit * i.qty)}</b></div>`).join("")}
        <hr>
        <div class="row g-3">
          <div class="col-md-6 small">
            <div class="fw-semibold mb-1">Delivery to</div>
            ${esc(o.customer.name)}<br>${esc(o.customer.address)}, ${esc(o.customer.city)}<br>${esc(o.customer.phone)}
            <div class="fw-semibold mt-2 mb-1">Payment</div>${esc(o.payment)}
            ${o.customer.note ? `<div class="fw-semibold mt-2 mb-1">Note</div>${esc(o.customer.note)}` : ""}
          </div>
          <div class="col-md-6">
            ${row("Subtotal", money(o.totals.subtotal))}
            ${row("Product discount", "-" + money(o.totals.productDiscount), "text-success")}
            ${o.totals.promoDiscount ? row(`Promo (${esc(o.promo)})`, "-" + money(o.totals.promoDiscount), "text-success") : ""}
            ${row("Shipping", o.totals.shipping ? money(o.totals.shipping) : "Free")}
            ${row("Tax", money(o.totals.tax))}
            <div class="d-flex justify-content-between fw-bold mt-1"><span>Total</span><span>${money(o.totals.total)}</span></div>
          </div>
        </div>
      </details>`).join("");
