let listProductHTML = document.querySelector('.listProduct');
let listCartHTML = document.querySelector('.listCart');
let iconCart = document.querySelector('.icon-cart');
let iconCartSpan = document.querySelector('.icon-cart span');
let body = document.querySelector('body');
let closeCart = document.querySelector('.close');
let products = [];
let cart = [];

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

// }

const addDataToHTML = () => {
    // remove datas default from HTML add new datas
    if (products.length > 0) { // if has data
        products.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.dataset.id = product.id;
            newProduct
                .classList
                .add('item');
            newProduct.innerHTML = `<div class="image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="info">
            <h2>${product.name}</h2>
            <div class="price">$${product.price}</div>
            <button class="addCart">Add To Cart</button>
        </div>`;
            listProductHTML.appendChild(newProduct);
        });
    }
}

listProductHTML.addEventListener('click', (event) => {
    let positionClick = event.target;
    if (positionClick.classList.contains('addCart')) {
        let id_product = positionClick
            .closest('.item')
            .dataset
            .id; // Get the closest parent with the 'item' class
        addToCart(id_product);
    }
});

const addToCart = (product_id) => {
    let positionThisProductInCart = cart.findIndex(
        (value) => value.product_id == product_id
    );
    if (cart.length <= 0) {
        cart = [
            {
                product_id: product_id,
                quantity: 1
            }
        ];
    } else if (positionThisProductInCart < 0) {
        cart.push({product_id: product_id, quantity: 1});
    } else {
        cart[positionThisProductInCart].quantity = cart[positionThisProductInCart].quantity +
                1;
    }
    addCartToHTML();
    addCartToMemory();
}
const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
}

const addCartToHTML = () => {
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0; // Tambahkan variabel untuk menyimpan total harga

    if (cart.length > 0) {
        cart.forEach(item => {
            totalQuantity = totalQuantity + item.quantity;
            let newItem = document.createElement('div');
            newItem
                .classList
                .add('item');
            newItem.dataset.id = item.product_id;

            let positionProduct = products.findIndex(
                (value) => value.id == item.product_id
            );
            let info = products[positionProduct];
            listCartHTML.appendChild(newItem);
            newItem.innerHTML = `
                <div class="image">
                    <img src="${info.image}">
                </div>
                <div class="name">
                    ${info.name}
                </div>
                <div class="totalPrice">$${info.price * item.quantity}</div>
                <div class="quantity">
                    <span class="minus">-</span> <!-- Ganti tanda < dengan - -->
                    <span>${item.quantity}</span>
                    <span class="plus">+</span> <!-- Ganti tanda > dengan + -->
                </div>
            `;

            totalPrice += info.price * item.quantity;
        });
    }
    iconCartSpan.innerText = totalQuantity;
    const totalElement = document.querySelector('.total');
    if (totalElement) {
        totalElement.textContent = `Total: $${totalPrice}`;
    }
};

listCartHTML.addEventListener('click', (event) => {
    let positionClick = event.target;
    if (positionClick.classList.contains('minus') || positionClick.classList.contains('plus')) {
        let product_id = positionClick.parentElement.parentElement.dataset.id;
        let type = 'minus';
        if (positionClick.classList.contains('plus')) {
            type = 'plus';
        }
        changeQuantityCart(product_id, type);
    }
})
const changeQuantityCart = (product_id, type) => {
    let positionItemInCart = cart.findIndex(
        (value) => value.product_id == product_id
    );
    if (positionItemInCart >= 0) {
        let info = cart[positionItemInCart];
        switch (type) {
            case 'plus':
                cart[positionItemInCart].quantity = cart[positionItemInCart].quantity + 1;
                break;

            default:
                let changeQuantity = cart[positionItemInCart].quantity - 1;
                if (changeQuantity > 0) {
                    cart[positionItemInCart].quantity = changeQuantity;
                } else {
                    cart.splice(positionItemInCart, 1);
                }
                break;
        }
    }
    addCartToHTML();
    addCartToMemory();
}

const initApp = () => {
    // get data product
    fetch('tiket.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            addDataToHTML();

            // get data cart from memory
            if (localStorage.getItem('cart')) {
                cart = JSON.parse(localStorage.getItem('cart'));
                addCartToHTML();
            }
        })
}
initApp();

document.addEventListener('DOMContentLoaded', function () {
    const checkoutButton = document.querySelector('.checkOut');

    checkoutButton.addEventListener('click', function () {
        if (cart.length === 0) {
            alert('Cart kosong. Silakan tambahkan barang ke keranjang sebelum checkout.');
        } else {
            // Empty the shopping cart
            cart = [];
            // Update the HTML representation of the cart
            addCartToHTML();
            // Update local storage
            addCartToMemory();
            // Redirect to the payment page
            window.location.href = "/payment";
        }
    });

});

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const continentSelect = document.getElementById('continent');
    const priceOrderSelect = document.getElementById('priceOrder');

    searchBtn.addEventListener('click', filterTickets);
    continentSelect.addEventListener('change', filterTickets);
    priceOrderSelect.addEventListener('change', filterTickets);

    function filterTickets() {
        const searchTerm = searchInput
            .value
            .toLowerCase();
        const selectedContinent = continentSelect.value;
        const priceOrder = priceOrderSelect.value;

        // Lakukan filter pada array products berdasarkan nama tiket
        let filteredProducts = products.filter(product => {
            // Ubah nama tiket menjadi huruf kecil untuk pencocokan yang tidak
            // case-sensitive
            const productName = product
                .name
                .toLowerCase();
            // Lakukan pencarian berdasarkan nama tiket
            return productName.includes(searchTerm);
        });

        // Hapus semua elemen tiket dari tampilan
        listProductHTML.innerHTML = '';

        // Tampilkan hasil filter ke dalam HTML
        filteredProducts.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.dataset.id = product.id;
            newProduct
                .classList
                .add('item');
            newProduct.innerHTML = `<div class="image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="info">
                <h2>${product.name}</h2>
                <div class="price">$${product.price}</div>
                <button class="addCart">Add To Cart</button>
            </div>`;
            listProductHTML.appendChild(newProduct);
        });
    }

});