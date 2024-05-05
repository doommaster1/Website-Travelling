let iconCart = document.querySelector('.icon-cart');
let body = document.querySelector('body');
let closeCart = document.querySelector('.close');

iconCart.addEventListener('click', () => {
    body
        .classList
        .toggle('showCart');
})
closeCart.addEventListener('click', () => {
    body
        .classList
        .toggle('showCart');
})
document.addEventListener('DOMContentLoaded', function () {
    let cartItems = [];

    function addToCart(ticket) {
        // Cek apakah tiket sudah ada di keranjang
        const existingItem = cartItems.find(item => item.ticket.kota === ticket.kota && item.ticket.negara === ticket.negara);
        if (existingItem) {
            existingItem.quantity++; // Jika sudah ada, tingkatkan jumlahnya
        } else {
            cartItems.push({ ticket: ticket, quantity: 1 }); // Jika belum, tambahkan dengan jumlah 1
        }
        renderCart();
    }

    function renderCart() {
        const listCart = document.querySelector('.listCart');
        let totalPrice = 0;
        listCart.innerHTML = '';

        cartItems.forEach(item => {
            const ticket = item.ticket;
            const ticketItem = document.createElement('div');
            ticketItem.classList.add('item');
            ticketItem.innerHTML = `
                <div class="image">
                    <img src="${ticket.image}">
                </div>
                <div class="name">
                    ${ticket.kota}, ${ticket.negara}
                </div>
                <div class="totalPrice">Rp.${ticket.harga * item.quantity}</div>
                <div class="quantity">
                    <span>${item.quantity}</span>
                </div>
            `;
            listCart.appendChild(ticketItem);
            totalPrice += ticket.harga * item.quantity;
        });

        const totalElement = document.querySelector('.total');
        totalElement.textContent = `Total: Rp.${totalPrice}`;

        const cartCounter = document.querySelector('.icon-cart span');
        cartCounter.textContent = cartItems.reduce((total, item) => total + item.quantity, 0); // Menghitung total jumlah item di keranjang
    }

    const buyNowButtons = document.querySelectorAll('.btn.btn-primary');
    buyNowButtons.forEach(button => {
        button.addEventListener('click', function () {
            const card = button.closest('.card');
            const cityName = card.querySelector('.card-title').textContent;
            const countryName = card.querySelector('.card-subtitle').textContent;
            const price = parseFloat(card.querySelector('.card-text').textContent.replace('Rp.', ''));
            const image = card.querySelector('.card-img-top').getAttribute('src');

            const ticket = {
                kota: cityName,
                negara: countryName,
                harga: price,
                image: image
            };

            addToCart(ticket);
        });
    });


    // Event listener untuk tombol checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutButton.addEventListener('click', function () {
            if (cartItems.length === 0) {
                alert('Cart kosong. Silakan tambahkan barang ke keranjang sebelum checkout.');
            } else {
                // Empty the shopping cart
                cartItems = [];
                // Redirect to the payment page
                window.location.href = "/payment";
            }
        });
    }
    

    
});