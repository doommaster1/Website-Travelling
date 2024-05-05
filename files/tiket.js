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
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        renderCart(); // Render ulang keranjang saat halaman dimuat untuk menampilkan item yang tersimpan
    }
    function addToCart(ticket) {
        // Cek apakah tiket sudah ada di keranjang
        const existingItem = cartItems.find(item => item.ticket.kota === ticket.kota && item.ticket.negara === ticket.negara);
        if (existingItem) {
            existingItem.quantity++; // Jika sudah ada, tingkatkan jumlahnya
        } else {
            cartItems.push({ ticket: ticket, quantity: 1 }); // Jika belum, tambahkan dengan jumlah 1
        }
        renderCart();
        
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
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

                
                localStorage.removeItem('cartItems');
                // Redirect to the payment page
                window.location.href = "/payment";
            }
        });
    }
    

    
});

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.card');

    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase().trim();

        cards.forEach(card => {
            const cityName = card.querySelector('.card-title').textContent.toLowerCase();

            if (cityName.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const continentSelect = document.getElementById('continent');
    const cards = document.querySelectorAll('.card');

    continentSelect.addEventListener('change', function () {
        const selectedContinent = continentSelect.value.toLowerCase();

        cards.forEach(card => {
            const cardContinent = card.querySelector('.card-subtitle').textContent.toLowerCase();

            if (selectedContinent === 'all' || cardContinent === selectedContinent) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}); 

document.addEventListener('DOMContentLoaded', function () {
    const priceOrderSelect = document.getElementById('priceOrder');
    const cardsContainer = document.querySelector('.row.my-4');

    priceOrderSelect.addEventListener('change', function () {
        const selectedOrder = priceOrderSelect.value;

        const cards = Array.from(cardsContainer.querySelectorAll('.card'));

        cards.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.card-text').textContent.replace('Rp.', '').replace(',', ''));
            const priceB = parseFloat(b.querySelector('.card-text').textContent.replace('Rp.', '').replace(',', ''));

            if (selectedOrder === 'lowToHigh') {
                return priceA - priceB;
            } else if (selectedOrder === 'highToLow') {
                return priceB - priceA;
            }
        });

        cards.forEach(card => {
            cardsContainer.appendChild(card);
        });
    });
});