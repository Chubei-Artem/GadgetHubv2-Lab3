// CART MODULE
// add product to cart (with duplicate check + qty increment)
function addToCartAdvanced(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity += 1; // increment if already in cart
    } else {
        cart.push({ ...product, quantity: 1 }); // add new item
    }
    renderCartUI(); // refresh cart display
}

// render cart items in modal UI(change qty+sum+del)
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

    // update totals + persist to localStorage
    totalEl.textContent = totalSum;
    countEl.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem('cart', JSON.stringify(cart));
}

// update item quantity in cart (min 1)
window.updateQty = (index, val) => {
    cart[index].quantity = Math.max(1, parseInt(val) || 1);
    renderCartUI();
};

// remove item from cart by index
window.deleteItem = (index) => {
    cart.splice(index, 1);
    renderCartUI();
};

// NEWS SIDEBAR MODULE
let newsLimit = 3; // initial number of news to show
// render news list in sidebar (sorted by date/time DESC+color status+toggle more/less)
function renderNewsSidebar() {
    const list = document.getElementById('news-headers-list');
    const btn = document.getElementById('load-more-news');
    
    // sort news: newest first
    const sorted = [...newsData].sort((a, b) => 
        new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );
    const display = sorted.slice(0, newsLimit);
    
    // render each news item with status-based styling
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

    // toggle button text: More/Less news
    if (newsLimit >= newsData.length) {
        btn.textContent = "Менше новин";
    } else {
        btn.textContent = "Більше новин";
    }
}

// load more / collapse news list
document.getElementById('load-more-news').onclick = () => {
    if (newsLimit >= newsData.length) {
        newsLimit = 3; // collapse to initial count
    } else {
        newsLimit = newsData.length; // expand to show all
    }
    renderNewsSidebar();
};

// open full news content in main area (mobile adapt: scroll to content)
window.openNews = (id) => {
    const news = newsData.find(n => n.id === id);
    const contentArea = document.getElementById('news-content-area');
    
    contentArea.innerHTML = `
        <h3>${news.title}</h3>
        <p><small>${news.date} | ${news.time}</small></p>
        <hr>
        <p style="font-size:1.1rem; line-height:1.6;">${news.text}</p>
    `;

    // mobile adapt: scroll to content on small screens
    if (window.innerWidth <= 770) {
        contentArea.scrollIntoView({ behavior: 'smooth' });
    }
};

// ANALYTICS / CHARTS MODULE (Chart.js)
let myChartInstance = null;
// render chart based on selected type and currentProducts data
// bar - price distribution, line - discount trends, pie - type breakdown
function renderAnalytics() {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (!ctx) return;
    
    const chartType = document.getElementById('chart-type-selector').value;
    const data = currentProducts; // use currently displayed products for analytics
    // destroy previous chart instance    
    if (myChartInstance) myChartInstance.destroy();

    let labels, values, color;
    if (chartType === 'bar') {
        // bar chart, show price distribution of current products
        labels = data.map(p => p.name);
        values = data.map(p => p.price);
        color = 'rgba(64, 0, 68, 0.7)';
    } else if (chartType === 'line') {
        // line chart, show discount trends across products
        labels = data.map(p => p.name);
        values = data.map(p => p.discount);
        color = 'rgba(255, 99, 132, 0.5)';
    } else if (chartType === 'pie') {
        // group by type and count for pie chart
        const stats = {};
        data.forEach(p => stats[p.type] = (stats[p.type] || 0) + 1);
        labels = Object.keys(stats);
        values = Object.values(stats);
        color = ['#404', '#FF6384', '#36A2EB', '#FFCE56'];
    }
    // set chart label based on type
    let chartLabel = 'Значення'; // def
    if (chartType === 'bar') chartLabel = 'Ціна (грн)';
    else if (chartType === 'line') chartLabel = 'Знижка (%)';
    else if (chartType === 'pie') chartLabel = 'Кількість товарів';

    myChartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels,
            datasets: [{
                label: chartLabel,  // change automat
                data: values,
                backgroundColor: color,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, // adapt to container size
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: true,
                    position: chartType === 'pie' ? 'bottom' : 'top' // pie legend at bottom
                }
            }
        }
    });
}

// APP INITIALIZATION (on page load)
window.onload = () => {
    // initial render of all components
    renderProducts(products);
    renderCarousel();
    renderCartUI();
    renderNewsSidebar();
    renderAnalytics();
    
    // chart type selector handler
    const chartSelector = document.getElementById('chart-type-selector');
    if (chartSelector) {
        chartSelector.onchange = () => renderAnalytics(); // re-render with currentProducts
    }
    
    // checkout button handler
    document.getElementById('checkout-btn').onclick = () => {
        if(cart.length === 0) return alert("Кошик порожній!");
        alert("Замовлення відправлено!");
        cart = [];
        renderCartUI();
    };

    // subscription modal logic (show after 5s if not subscribed)
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

    // show promo ad after 10 seconds
    setTimeout(showAd, 10000);
};

// SCROLL TO TOP BUTTON
const scrollTopBtn = document.getElementById('scroll-top');
window.onscroll = () => {
    const btn = document.getElementById('scroll-top');
    // show btn after scrolling 2/3 of page
    if (window.scrollY > (document.documentElement.scrollHeight * 2/3)) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none'; 
    }
};
scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// EVENT DELEGATION for "Add to Cart" buttons
document.addEventListener('click', (event) => {
    const addBtn = event.target.closest('.add-to-cart-btn');
    if (addBtn) {
        const id = parseInt(addBtn.dataset.id);
        addToCartAdvanced(id);
    }
});

// DRAG & DROP to cart icon
const cartIconBtn = document.getElementById('cart-btn');

// allow drop on cart icon + visual feedback
cartIconBtn.ondragover = (event) => {
    event.preventDefault(); // required for drop to work
    cartIconBtn.style.transform = "scale(1.2)"; // hover effect
};

// reset visual state when drag leaves icon
cartIconBtn.ondragleave = () => {
    cartIconBtn.style.transform = "scale(1)";
};

// handle drop event: add dragged product to cart
cartIconBtn.ondrop = (event) => {
    event.preventDefault();
    cartIconBtn.style.transform = "scale(1)";
    
    const productId = parseInt(event.dataTransfer.getData("productId"));
    
    if (productId) {
        addToCartAdvanced(productId);
        
        // success animation: flash green
        cartIconBtn.style.background = "#28a745";
        setTimeout(() => {
            cartIconBtn.style.background = "";
        }, 500);
    }
};