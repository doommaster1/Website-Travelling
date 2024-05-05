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
function togglePopup() {
    document
        .getElementById("popup-ticket")
        .classList
        .toggle("active");
}

// Event listener for adding to cart
listProductHTML.addEventListener('click', (event) => {
    let positionClick = event.target;
    if (positionClick.classList.contains('addCart')) {
        const productId = positionClick
            .closest('.item')
            .dataset
            .id; // Ambil ID produk dari elemen HTML
        addToCart(productId); // Panggil fungsi addToCart dengan ID produk
    }
});

const addCartToMemory = () => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const addDataToHTML = () => {
    // remove datas default from HTML add new datas
    if (products.length > 0) { // if has data
        products.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.dataset.id = product._id; // Menggunakan ID dari MongoDB
            newProduct
                .classList
                .add('item');
            newProduct.innerHTML = `<div class="image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="info">
            <h2>${product.name}</h2>
            <div class="price">Rp.${addThousandSeparator(product.price)}</div>
            <button class="addCart">Add To Cart</button>
        </div>`;
            listProductHTML.appendChild(newProduct);
        });
    }
}

// Update addToCart function to store MongoDB document ID
const addToCart = (productId) => {
    if (cart.length <= 0) {
        cart = [
            {
                productId: productId,
                quantity: 1
            }
        ];
    } else {
        let positionThisProductInCart = cart.findIndex(
            (value) => value.productId === productId
        );
        if (positionThisProductInCart < 0) {
            cart.push({productId: productId, quantity: 1});
        } else {
            cart[positionThisProductInCart].quantity++;
        }
    }
    addCartToHTML();
    addCartToMemory();
};

// Update addCartToHTML function to use MongoDB document ID
const addCartToHTML = () => {
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;

    if (cart.length > 0) {
        cart.forEach(item => {
            totalQuantity += item.quantity;
            let newItem = document.createElement('div');
            newItem
                .classList
                .add('item');
            newItem.dataset.id = item.productId; // Gunakan ID dari database
            let productId = item.productId; // Gunakan ID dari database untuk mengakses produk dari array products
            let info = products.find(product => product._id === productId);
            listCartHTML.appendChild(newItem);
            newItem.innerHTML = `
                <div class="image">
                    <img src="${info.image}">
                </div>
                <div class="name">
                    ${info.name}
                </div>
                <div class="totalPrice">Rp.${addThousandSeparator(info.price * item.quantity)}</div>
                <div class="quantity">
                    <span class="minus">-</span>
                    <span>${item.quantity}</span>
                    <span class="plus">+</span>
                </div>
            `;
            totalPrice += info.price * item.quantity;
        });
    }
    iconCartSpan.innerText = totalQuantity;
    const totalElement = document.querySelector('.total');
    if (totalElement) {
        totalElement.textContent = `Total: Rp.${addThousandSeparator(totalPrice)}`;
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

const addThousandSeparator = (price) => {
    return price
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const addThousandSeparatorToJSON = (data) => {
    return data.map(item => {
        item.price = addThousandSeparator(item.price);
        return item;
    });
};

// Hapus pemanggilan addThousandSeparatorToJSON dari initApp
const initApp = () => {
    // Saat mendapatkan data produk dari MongoDB
    fetch('/api/tiket')
        .then(response => response.json())
        .then(data => {
            products = data.tickets.map(product => ({
                ...product,
                mongoId: product._id // Simpan ID MongoDB sebagai bagian dari data produk
            }));
            addDataToHTML();
            iconCartSpan.innerText = data.totalItemsInCart || 0;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
};


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
    const continentSelect = document.getElementById('continent');
    const priceOrderSelect = document.getElementById('priceOrder');

    // Event listener untuk input pencarian
    searchInput.addEventListener('input', filterTickets);
    continentSelect.addEventListener('change', filterTickets);
    priceOrderSelect.addEventListener('change', filterTickets);

    function filterTickets() {
        const searchTerm = searchInput
            .value
            .toLowerCase();
        const selectedContinent = continentSelect.value;
        const priceOrder = priceOrderSelect.value;

        let filteredProducts = products.filter(product => {
            const productName = product
                .name
                .toLowerCase();
            return productName.includes(searchTerm);
        });

        if (selectedContinent !== 'all') {
            filteredProducts = filteredProducts.filter(
                product => product.benua === selectedContinent
            );
        }

        if (priceOrder === 'lowToHigh') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (priceOrder === 'highToLow') {
            filteredProducts.sort((a, b) => b.price - a.price);
        }

        listProductHTML.innerHTML = '';

        filteredProducts.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.dataset.id = product.mongoId;
            newProduct
                .classList
                .add('item');
            newProduct.innerHTML = `<div class="image">
        <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="info">
        <h2>${product.name}</h2>
        <div class="price">Rp.${addThousandSeparator(product.price)}</div>
        <button class="addCart">Add To Cart</button>
    </div>`;
            listProductHTML.appendChild(newProduct);
        });
    }

    // Panggil filterTickets saat halaman dimuat
    filterTickets();
});
