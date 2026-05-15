// GLOBAL STATE
// Поточний відфільтрований/відсортований список товарів для аналітики
// Використовується spread operator [...] для створення копії масиву (щоб не змінювати оригінал)
let currentProducts = [...products];
// Кошик: завантажуємо з localStorage або створюємо порожній масив
// JSON.parse() перетворює рядок JSON назад в об'єкт/масив
// || [] — якщо в localStorage нічого немає, повертаємо порожній масив
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// FILTER
/**
 * Функція фільтрації товарів за категорією, пошуком, ціною та сортуванням
 * Викликається при зміні будь-якого фільтру
 */
function applyFilters() {
    // Отримуємо активну категорію з кнопки (all/phone/laptop/tablet)
    // dataset.type читає data-type атрибут елемента
    const activeType = document.querySelector(".filter-btn.active").dataset.type;

    let filtered =
        activeType === "all"
            ? [...products]
            : products.filter((p) => p.type === activeType);

    // текстовий пошук по назві (case-insensitive)
    const query = document.getElementById("main-search").value.toLowerCase();
    if (query) {
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(query));
    }

    // ціновий діапазон
    const min = parseFloat(document.getElementById("min-price").value) || 0;
    const max =
        parseFloat(document.getElementById("max-price").value) || Infinity;
    filtered = filtered.filter((p) => p.price >= min && p.price <= max);

    // сортування
    // parseFloat() перетворює рядок в число
    // || 0 та || Infinity — значення за замовчуванням, якщо поле порожнє
    const sortVal = document.getElementById("sort-select").value;
    if (sortVal === "price-asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortVal === "price-desc") filtered.sort((a, b) => b.price - a.price);
    else if (sortVal === "name-asc")
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortVal === "name-desc")
        filtered.sort((a, b) => b.name.localeCompare(a.name));

    renderProducts(filtered);
    // currentProducts оновлюється після застосування всіх фільтрів та сортування, щоб аналітика працювала з актуальним списком товарів
    currentProducts = filtered;
    renderAnalytics();
}

// EVENT BINDINGS for filters
// кнопка пошуку
document.querySelector('.search-box button').onclick = applyFilters;
// кнопки категорій
document.querySelectorAll('.filter-btn').forEach(button => {
    button.onclick = () => {
        // знімаємо клас active з усіх кнопок, потім додаємо його до натиснутої
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        applyFilters();
    };
});
// сортування та ціновий фільтр
document.getElementById('sort-select').onchange = applyFilters;
document.getElementById('apply-price-filter').onclick = applyFilters;

// RENDER PRODUCTS GRID (discount + description toggle)
/**
 * Відмальовує сітку товарів на сторінці
 * @param {Array} productsList - масив товарів для відображення
 */
function renderProducts(productsList) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = ''; // очищаємо сітку перед рендером

    productsList.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // додаємо атрибут draggable для підтримки drag-and-drop
        card.setAttribute('draggable', 'true');
        // при початку перетягування зберігаємо id товару в dataTransfer, щоб потім додати його в кошик
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

        // обробник для кнопки показу/приховування опису товару
        card.querySelector('.toggle-desc-btn').onclick = (event) => {
            const desc = card.querySelector('.product-desc');
            // toggle класу modal-hidden для показу або приховування опису
            const isHidden = desc.classList.toggle('modal-hidden');
            // змінюємо текст кнопки в залежності від стану опису
            event.target.textContent = isHidden ? 'Показати опис' : 'Сховати опис';
        };
        grid.appendChild(card); // додаємо картку товару в сітку
    });
}

// MODAL HANDLERS (auth + cart)
// отримуємо посилання на модальні вікна
const authModal = document.getElementById('auth-modal');
const cartModal = document.getElementById('cart-modal');
// кнопки для відкриття та закриття модальних вікон
document.getElementById('auth-btn').onclick = () => authModal.classList.remove('modal-hidden');
document.getElementById('cart-btn').onclick = () => {
    cartModal.classList.remove('modal-hidden');
    cartModal.style.display = 'flex';
    updateCartUI(); // оновлюємо вміст кошика при відкритті модального вікна, щоб відобразити актуальні товари та загальну суму замовлення
};
document.getElementById('close-auth').onclick = () => authModal.classList.add('modal-hidden');
document.getElementById('close-cart').onclick = () => {
    cartModal.classList.add('modal-hidden');
    cartModal.style.display = 'none';
};

// перемикання між формами входу та реєстрації в модальному вікні аутентифікації
document.getElementById('show-register').onclick = () => {
    document.getElementById('login-form').classList.add('modal-hidden');
    document.getElementById('register-form').classList.remove('modal-hidden');
};
document.getElementById('show-login').onclick = () => {
    document.getElementById('register-form').classList.add('modal-hidden');
    document.getElementById('login-form').classList.remove('modal-hidden');
};

// закриття модальних вікон при кліку поза їх межами (на оверлей)
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
    // map cтворює новий масив з результатами виклику функції для кожного елемента, а join('') об'єднує всі рядки в один
    inner.innerHTML = hotDeals.map(deal => `
        <div class="carousel-item">
            <img src="${deal.image}" alt="${deal.title}">
            <div class="carousel-caption">${deal.title}</div>
        </div>`).join('');
}

let currentSlide = 0;
// при кліку на кнопки "наступний" та "попередній" змінюємо поточний слайд та застосовуємо CSS трансформацію для переміщення каруселі
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
            clearInterval(interval); // зупиняємо таймер
            const closeBtn = document.getElementById('close-ad');
            closeBtn.disabled = false; // активуємо кнопку після закінчення таймера
            closeBtn.onclick = () => ad.remove(); // видаляємо модальне вікно при кліку на кнопку закриття
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
searchInput.addEventListener('input', applyFilters);

// price filter inputs
const minPrice = document.getElementById('min-price');
const maxPrice = document.getElementById('max-price');
if (minPrice) minPrice.addEventListener('input', applyFilters);
if (maxPrice) maxPrice.addEventListener('input', applyFilters);
