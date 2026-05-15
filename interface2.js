// CART MODULE
/**
 * Додає товар до кошика з перевіркою на дублікати та збільшенням кількості
 * @param {number} productId - ID товару для додавання
 */
function addToCartAdvanced(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1; // збільшуємо кількість, якщо товар вже в кошику
    } else {
        cart.push({ ...product, quantity: 1 }); // додаємо новий товар з початковою кількістю 1
    }
    renderCartUI(); // оновлюємо UI кошика після зміни
}

// відображаємо вміст кошика, суму та кількість товарів, а також зберігаємо стан у localStorage
function renderCartUI() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    if (!container) return;

    container.innerHTML = '';
    let totalSum = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalSum += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;";

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:2">
                <img src="${item.image}" width="40" height="40" style="object-fit:contain;">
                <strong>${item.name}</strong>
            </div>
            <div style="flex:1">
                <input type="number" min="1" value="${item.quantity}" 
                    onchange="updateQty(${index}, this.value)" style="width:45px">
            </div>
            <div style="flex:1">${item.price} грн</div>
            <div style="flex:1; font-weight:bold;">Сума: ${itemTotal} грн</div>
            <button onclick="deleteItem(${index})" style="color:red; border:none; background:none; cursor:pointer; font-size:1.2rem;">&times;</button>
        `;
        container.appendChild(div);
    });

    // оновлюємо загальну суму та кількість товарів у кошику
    totalEl.textContent = totalSum;
    countEl.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem('cart', JSON.stringify(cart));
}

// оновлюємо кількість товару в кошику за індексом та новим значенням
window.updateQty = (index, val) => {
    cart[index].quantity = Math.max(1, parseInt(val) || 1);
    renderCartUI();
};

// видаляємо товар з кошика за індексом
window.deleteItem = (index) => {
    cart.splice(index, 1);
    renderCartUI();
};

// NEWS SIDEBAR MODULE
let newsLimit = 3; // початкова кількість новин для відображення
// відображаємо список новин з можливістю розгортання та згортання, а також стилізацією за статусом
function renderNewsSidebar() {
    const list = document.getElementById('news-headers-list');
    const btn = document.getElementById('load-more-news');

    // сортуємо новини за датою та часом, щоб найновіші були вгорі
    const sorted = [...newsData].sort((a, b) =>
        new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );
    const display = sorted.slice(0, newsLimit);

    // відображаємо заголовки новин з класами для статусу та обробником кліку для відкриття повного тексту
    list.innerHTML = display.map(news => `
    <li onclick="openNews(${news.id})" 
        class="status-${news.status}"
        style="cursor:pointer; padding:10px; margin-bottom:8px; border-radius:4px;">
        <div>
            <small>${news.date} ${news.time}</small><br>
            ${news.title}
        </div>
    </li>
`).join('');

    // оновлюємо текст кнопки в залежності від поточного стану (показано все чи ні)
    if (newsLimit >= newsData.length) {
        btn.textContent = "Менше новин";
    } else {
        btn.textContent = "Більше новин";
    }
}

// обробник кліку для кнопки "Більше новин"/"Менше новин", який змінює кількість відображуваних новин та оновлює інтерфейс
document.getElementById('load-more-news').onclick = () => {
    if (newsLimit >= newsData.length) {
        newsLimit = 3; // згортання до початкової кількості
    } else {
        newsLimit = newsData.length; // розгортання до повного списку
    }
    renderNewsSidebar();
};

/**
 * Відкриває повний текст новини в центральній області
 * @param {number} id - ID новини
 */
window.openNews = (id) => {
    const news = newsData.find(n => n.id === id);
    const contentArea = document.getElementById('news-content-area');

    contentArea.innerHTML = `
        <h3>${news.title}</h3>
        <p><small>${news.date} | ${news.time}</small></p>
        <hr>
        <p style="font-size:1.1rem; line-height:1.6;">${news.text}</p>
    `;

    // на мобільних пристроях прокручуємо до області з текстом новини для кращого UX
    if (window.innerWidth <= 770) {
        contentArea.scrollIntoView({ behavior: 'smooth' });
    }
};

// ANALYTICS / CHARTS MODULE
let myChartInstance = null; // Зберігаємо екземпляр графіка для знищення перед створенням нового
/**
 * Відмальовує графік на основі обраного типу та поточних даних
 * Типи: bar (ціни), line (знижки), pie (категорії)
 */
function renderAnalytics() {
    const ctx = document.getElementById("myChart").getContext("2d");
    if (!ctx) return;

    const chartType = document.getElementById("chart-type-selector").value;
    const data = currentProducts; // Завжди беремо актуальний відфільтрований масив
    if (myChartInstance) myChartInstance.destroy(); // знищуємо попередній графік перед створенням нового

    let labels, values, color;
    // формуємо дані для графіка в залежності від вибраного типу
    if (chartType === "bar") {
        // стовбчастий графік для цін товарів
        labels = data.map((p) => p.name);
        values = data.map((p) => p.price);
        color = "rgba(64, 0, 68, 0.7)";
    } else if (chartType === "line") {
        // лінійний графік для знижок товарів
        labels = data.map((p) => p.name);
        values = data.map((p) => p.discount);
        color = "rgba(255, 99, 132, 0.5)";
    } else if (chartType === "pie") {
        // кругова діаграма для категорій товарів (кількість товарів в кожній категорії)
        const stats = {};
        data.forEach((p) => (stats[p.type] = (stats[p.type] || 0) + 1));
        labels = Object.keys(stats);
        values = Object.values(stats);
        color = ["#404", "#FF6384", "#36A2EB", "#FFCE56"];
    }
    // автоматично вибираємо підпис для графіка в залежності від типу даних
    let chartLabel = "Значення";
    if (chartType === "bar") chartLabel = "Ціна (грн)";
    else if (chartType === "line") chartLabel = "Знижка (%)";
    else if (chartType === "pie") chartLabel = "Кількість товарів";
    // створюємо новий графік з отриманими даними та налаштуваннями
    myChartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels,
            datasets: [
                {
                    label: chartLabel, // change automat
                    data: values,
                    backgroundColor: color,
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true, // adapt to container size
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: chartType === "pie" ? "bottom" : "top",
                },
            },
        },
    });
}

// APP INITIALIZATION
window.onload = () => {
    // ініціалізуємо інтерфейс: відмальовуємо товари, карусель, кошик, новини та аналітику
    renderProducts(products);
    renderCarousel();
    renderCartUI();
    renderNewsSidebar();
    renderAnalytics();

    // додаємо обробник зміни типу графіка для автоматичного оновлення аналітики при виборі нового типу
    const chartSelector = document.getElementById('chart-type-selector');
    if (chartSelector) {
        chartSelector.onchange = () => renderAnalytics(); // перемальовуємо графік при зміні вибору типу
    }

    // обробник кліку для кнопки оформлення замовлення, який перевіряє наявність товарів у кошику та очищує його після підтвердження замовлення
    document.getElementById('checkout-btn').onclick = () => {
        if (cart.length === 0) return alert("Кошик порожній!");
        alert("Замовлення відправлено!");
        cart = [];
        renderCartUI();
    };

    // показуємо вікно підписки, якщо користувач ще не підписаний
    const subWindow = document.getElementById('subscribe-window');
    if (!localStorage.getItem('subscribed')) {
        setTimeout(() => {
            subWindow.classList.remove('modal-hidden');
        }, 5000);
    }
    document.getElementById('sub-accept').onclick = () => {
        localStorage.setItem('subscribed', 'true');
        subWindow.classList.add('modal-hidden');
        alert("Дякуємо за підписку!");
    };
    document.getElementById('sub-decline').onclick = () => {
        subWindow.classList.add('modal-hidden');
    };

    // показуємо рекламне вікно через 10 секунд після завантаження сторінки
    setTimeout(showAd, 10000);
};

// SCROLL TO TOP BUTTON
const scrollTopBtn = document.getElementById('scroll-top');
window.onscroll = () => {
    const btn = document.getElementById('scroll-top');
    // показуємо кнопку, коли користувач прокрутив більше 2/3 сторінки, і ховаємо її, коли він повертається вгору
    if (window.scrollY > (document.documentElement.scrollHeight * 2 / 3)) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
};
scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// додати товар до кошика при кліку на кнопку "Додати до кошика" в картці товару
document.addEventListener('click', (event) => {
    const addBtn = event.target.closest('.add-to-cart-btn');
    if (addBtn) {
        const id = parseInt(addBtn.dataset.id);
        addToCartAdvanced(id);
    }
});

// DRAG & DROP to cart icon
const cartIconBtn = document.getElementById('cart-btn');

// дозволяємо перетягувати товар на іконку кошика, щоб додати його до кошика
cartIconBtn.ondragover = (event) => {
    event.preventDefault(); // дозволяємо скидання, інакше подія drop не спрацює
    cartIconBtn.style.transform = "scale(1.2)"; // легке збільшення іконки для візуального ефекту при наведенні
};

cartIconBtn.ondragleave = () => {
    cartIconBtn.style.transform = "scale(1)";
};

// обробник події drop для додавання товару до кошика при перетягуванні його на іконку кошика
cartIconBtn.ondrop = (event) => {
    event.preventDefault();
    cartIconBtn.style.transform = "scale(1)";

    const productId = parseInt(event.dataTransfer.getData("productId"));

    if (productId) {
        addToCartAdvanced(productId);

        // короткочасна зміна кольору іконки кошика для візуального підтвердження додавання товару
        cartIconBtn.style.background = "#28a745";
        setTimeout(() => {
            cartIconBtn.style.background = "";
        }, 500);
    }
};
