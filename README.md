# ShopEase

A responsive e-commerce front-end built with plain HTML, CSS, JavaScript and Bootstrap 5.
Products come from the free [DummyJSON](https://dummyjson.com/products) API. Cart, wishlist and orders are saved in the browser (`localStorage`), so no backend is needed.

## Features
- **Shop:** search, category filter, sorting, ratings, stock status, "Load more", product details modal with image gallery
- **Wishlist:** save favourites (persists after refresh), filter "Wishlist only"
- **Cart:** change quantity (buttons or typing), remove items, clear cart, stock-based max quantity
- **Calculations:** subtotal, product discount, promo code, shipping (free over $100), tax, grand total, total savings. All money maths is done in cents, so there are no floating-point errors
- **Checkout:** validated delivery form (Bangladeshi phone format), Cash on delivery / bKash / Card (demo)
- **Orders:** confirmation page and order history with full price breakdown
- **Dark mode:** toggle in the navbar, remembers your choice and follows the system setting by default

## Project structure
```
cart/
├── index.html     Shop page (start here)
├── cart.html          Shopping cart
├── checkout.html      Checkout form
├── orders.html        Order confirmation + My Orders
├── css/
│   ├── style.css      Product card styles
│   └── theme.css      Theme, layout, dark mode
├── js/
│   ├── common.js      Shared logic: cart, calculations, wishlist, orders, navbar/footer, toasts
│   ├── script.js      Shop page
│   ├── cart.js        Cart page
│   ├── checkout.js    Checkout page
│   └── orders.js      Orders page
└── extras/
    └── todolist.html  Unrelated practice page
```

## How to run
No install needed. Open `index.html` in a browser (internet is required for the product API and Bootstrap CDN).
For best results use a local server, e.g. the VS Code **Live Server** extension, or `python -m http.server`.

## Settings
Edit the top of `js/common.js`:
```js
const CONFIG = { taxRate: 0.05, shippingFee: 5.99, freeShippingOver: 100, maxQty: 10 };
const PROMOS = { SAVE10: ..., WELCOME5: ..., FREESHIP: ... };   // add your own codes here
```
Promo codes to try: `SAVE10` (10% off), `WELCOME5` ($5 off), `FREESHIP` (free shipping).

## Notes
- Data lives in the browser only: clearing browser data clears the cart and orders.
- Card payment is a demo. Nothing is charged and card details are never stored.
- To make this production-ready you would add a backend (user accounts, real orders, real payments).
