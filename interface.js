// GLOBAL STATE
let currentProducts = [...products]; // active filtered/sorted product list for analytics
let cart = JSON.parse(localStorage.getItem('cart')) || []; // cart load from localStorage

// FILTER
function applyFilters() {
    // get active category filter (all/phone/laptop/tablet)
    const activeType = document.querySelector('.filter-btn.active').dataset.type;
    
    // base filter by type
    let filtered = activeType === 'all' 
        ? [...products] 
        : products.filter(p => p.type === activeType);
    
    // text search filter
    const query = document.getElementById('main-search').value.toLowerCase();
    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }

    // price range filter
    const min = parseFloat(document.getElementById('min-price').value) || 0;
    const max = parseFloat(document.getElementById('max-price').value) || Infinity;
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    // sorting logic
    const sortVal = document.getElementById('sort-select').value;
    if (sortVal === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortVal === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortVal === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortVal === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));

    // re-render UI + analytics
    renderProducts(filtered);
    // sync analytics with current filtered data
    currentProducts = filtered;
    renderAnalytics();
}

// EVENT BINDINGS for filters
document.querySelector('.search-box button').onclick = applyFilters;
// category filter buttons
document.querySelectorAll('.filter-btn').forEach(button => {
    button.onclick = () => {
        // update active btn visual state
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        applyFilters();
    };
});

document.getElementById('sort-select').onchange = applyFilters;
document.getElementById('apply-price-filter').onclick = applyFilters;

// RENDER PRODUCTS GRID (discount + description toggle)
function renderProducts(productsList) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // enable drag-and-drop to cart icon (ID passed via dataTransfer)
        card.setAttribute('draggable', 'true');
        card.ondragstart = (event) => {
            event.dataTransfer.setData("productId", product.id);
        };
        
        card.innerHTML = `
            <div class="img-container">
                ${product.discount > 0 ? `<div class="discount-badge">-${product.discount}%</div>` : ''}
                <img src="${product.image}" alt="${product.name}">
            </div>
            <h3>${product.name}</h3>
            <p>Ціна: <strong>${product.price} грн</strong></p>
            <button class="toggle-desc-btn">Показати опис</button>
            <div class="product-desc modal-hidden">${product.desc}</div>
            <button class="add-to-cart-btn" data-id="${product.id}">Додати до кошика</button>
        `;
        
        // toggle product description visibility
        card.querySelector('.toggle-desc-btn').onclick = (event) => {
            const desc = card.querySelector('.product-desc');
            const isHidden = desc.classList.toggle('modal-hidden');
            event.target.textContent = isHidden ? 'Показати опис' : 'Сховати опис';
        };
        grid.appendChild(card);
    });
}

// MODAL HANDLERS (auth + cart)
const authModal = document.getElementById('auth-modal');
const cartModal = document.getElementById('cart-modal');
// open auth + cart modal on button click
document.getElementById('auth-btn').onclick = () => authModal.classList.remove('modal-hidden');
document.getElementById('cart-btn').onclick = () => { 
    cartModal.classList.remove('modal-hidden');
    cartModal.style.display = 'flex';
    updateCartUI(); // refresh cart content
};
document.getElementById('close-auth').onclick = () => authModal.classList.add('modal-hidden');
document.getElementById('close-cart').onclick = () => {
    cartModal.classList.add('modal-hidden');
    cartModal.style.display = 'none';
};

// switch between login/register forms
document.getElementById('show-register').onclick = () => {
    document.getElementById('login-form').classList.add('modal-hidden');
    document.getElementById('register-form').classList.remove('modal-hidden');
};
document.getElementById('show-login').onclick = () => {
    document.getElementById('register-form').classList.add('modal-hidden');
    document.getElementById('login-form').classList.remove('modal-hidden');
};

// close modals on overlay click
window.onclick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        authModal.classList.add('modal-hidden');
        cartModal.classList.add('modal-hidden');
    }
};

// CAROUSEL LOGIC for hot deals
function renderCarousel() {
    const inner = document.getElementById('carousel-inner');
    if (!inner) return;
    // render carousel from hotDeals array
    inner.innerHTML = hotDeals.map(deal => `
        <div class="carousel-item">
            <img src="${deal.image}" alt="${deal.title}">
            <div class="carousel-caption">${deal.title}</div>
        </div>`).join('');
}

let currentSlide = 0;
// carousel navigation buttons
document.getElementById('carousel-next').onclick = () => {
    currentSlide = (currentSlide + 1) % hotDeals.length;
    document.getElementById('carousel-inner').style.transform = `translateX(-${currentSlide * 100}%)`;
};
document.getElementById('carousel-prev').onclick = () => {
    currentSlide = (currentSlide - 1 + hotDeals.length) % hotDeals.length;
    document.getElementById('carousel-inner').style.transform = `translateX(-${currentSlide * 100}%)`;
};

// PROMO AD modal with countdown timer(5sec)
// btn active after timer ends
function showAd() {
    const ad = document.createElement('div');
    ad.className = 'modal-overlay';
    ad.innerHTML = `
        <div class="modal-content">
            <h3>АКЦІЯ!</h3>
            <p>Тільки сьогодні знижки 20%!</p>
            <p>Закрити через: <strong id="ad-timer">5</strong> сек</p>
            <button id="close-ad" disabled>Закрити</button>
        </div>`;
    document.body.appendChild(ad);
    let timeLeft = 5;
    const interval = setInterval(() => {
        timeLeft--;
        document.getElementById('ad-timer').textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            const closeBtn = document.getElementById('close-ad');
            closeBtn.disabled = false;
            closeBtn.onclick = () => ad.remove();
        }
    }, 1000);
}

// SUBSCRIPTION modal handling
document.getElementById('sub-accept').onclick = () => {
    localStorage.setItem('subscribed', 'true');
    document.getElementById('subscribe-window').classList.add('modal-hidden');
};
document.getElementById('sub-decline').onclick = () => {
    document.getElementById('subscribe-window').classList.add('modal-hidden');
};

// SEARCH
// const searchInput = document.getElementById('main-search'); for live search ^^ have btn-_-
searchInput.addEventListener('input', applyFilters);

// price filter inputs
const minPrice = document.getElementById('min-price');
const maxPrice = document.getElementById('max-price');
if (minPrice) minPrice.addEventListener('input', applyFilters);
if (maxPrice) maxPrice.addEventListener('input', applyFilters);
