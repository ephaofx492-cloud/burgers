// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://wfwrbwgfxhqpcossdzdh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd3Jid2dmeGhxcGNvc3NkemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjU2NTcsImV4cCI6MjA4OTYwMTY1N30.7q4O5-1GXK-MdLtESRxPP8GafoC1X8W3tQZZla-630E';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// --- DATA ---
const menuItems = [
    { id: 1, name: "Special Burger", price: 850, img: "Easy-Smash-Burger-with-Best-Burger-Sauce.jpg" },
    { id: 2, name: "Chicken Burger", price: 750, img: "burger-king-spicy-chicken-royale-review.jpg" },
    { id: 3, name: "Beef Burger", price: 680, img: "crispy-comte-cheesburgers-FT-RECIPE0921-6166c6552b7148e8a8561f7765ddf20b.jpg" },
    { id: 4, name: "Special Pizza", price: 950, img: "72bf02a3-b886-46f1-8d9d-1889861c7b56.webp" },
    { id: 5, name: "Imperial Spice", price: 720, img: "0190e65e-47b4-70a0-8dec-0f2515ddf946.png" },
    { id: 6, name: "Truffle Fries", price: 250, img: "Simply-Recipes-Crispy-French-Fries-LEAD-02-a0352dfe374241d38c04c6cac19b9d0d.jpg" },
    { id: 7, name: "Double / Triple Burger", price: 880, img: "Easy-Smash-Burger-with-Best-Burger-Sauce.jpg" },
    { id: 8, name: "Drinks", price: 920, img: "Untitled_design_-_2025-04-17T130659.845.webp" },
    { id: 9, name: "Sishu Burger", price: 620, img: "images (5).jpg" },
    { id: 10, name: "Royal BBQ", price: 700, img: "images (6).jpg" },
    { id: 11, name: "Prince's Choice", price: 550, img: "images (7).jpg" },
    { id: 12, name: "Village Classic", price: 480, img: "images (1).jpg" },
    { id: 13, name: "chicken wings", price: 650, img: "images (2).jpg" },
    { id: 14, name: "One burger", price: 720, img: "images (8).jpg" },
    { id: 15, name: "Crispy Fries", price: 180, img: "images.jpg" }
];

let cart = [];
// localStorage still used for "My Orders" display on the customer side
let orders = JSON.parse(localStorage.getItem('oneBurgerOrders')) || [];

const app = {
    init: () => {
        app.renderMenu();
        app.updateCartUI();
        app.renderOrderHistory();

        // --- HASH ROUTING ---
        const initialTab = window.location.hash ? window.location.hash.substring(1) : 'home';
        app.switchTab(initialTab);

        window.addEventListener('hashchange', () => {
            const tab = window.location.hash ? window.location.hash.substring(1) : 'home';
            app.switchTab(tab, true);
        });
    },

    renderMenu: () => {
        const grid = document.getElementById('menu-grid');
        grid.innerHTML = menuItems.map(item => `
            <div class="card">
                <img src="${item.img}" class="card-img">
                <div class="card-body">
                    <h3 style="color:white; font-size:1.1rem;">${item.name}</h3>
                    <div class="card-price">${item.price} ETB</div>
                    <button class="btn btn-attractive" onclick="app.addToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    },

    addToCart: (id) => {
        const existing = cart.find(c => c.id === id);
        if (existing) { existing.qty++; }
        else {
            const item = menuItems.find(i => i.id === id);
            cart.push({ id: item.id, qty: 1, ...item });
        }
        app.updateCartUI();
    },

    changeQty: (id, delta) => {
        const idx = cart.findIndex(c => c.id === id);
        if (idx === -1) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        app.updateCartUI();
    },

    updateCartUI: () => {
        const list = document.getElementById('cartItems');
        const totalQty = cart.reduce((a, b) => a + b.qty, 0);
        document.getElementById('cart-count').innerText = totalQty;

        const scBar = document.getElementById('stickyCheckout');
        const scTotal = document.getElementById('scTotal');

        if (cart.length > 0) {
            scBar.classList.add('show');
        } else {
            scBar.classList.remove('show');
        }

        if (cart.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:#555; margin-top:50px;">Your feast awaits.</p>';
            document.getElementById('summarySubtotal').innerText = '0 ETB';
            document.getElementById('summaryTotal').innerText = '0 ETB';
            scTotal.innerText = '0 ETB';
            return;
        }

        let subtotal = 0;
        list.innerHTML = cart.map(item => {
            const lineTotal = item.price * item.qty;
            subtotal += lineTotal;
            return `
                <div class="cart-item">
                    <img src="${item.img}">
                    <div class="item-details" style="flex:1;">
                        <div class="item-name" style="color:white; font-weight:700;">${item.name} 🍔</div>
                        <div class="item-price" style="color:#888; font-size: 12px;">${item.qty} x ${item.price} ETB</div>
                    </div>
                    <div class="qty-ctrl">
                        <button class="qty-btn" onclick="app.changeQty(${item.id}, -1)">-</button>
                        <span style="font-size:12px; color:white;">${item.qty}</span>
                        <button class="qty-btn" onclick="app.changeQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            `;
        }).join('');

        const delivery = 30;
        const serviceFee = 10;
        const grandTotal = subtotal + delivery + serviceFee;

        document.getElementById('summarySubtotal').innerText = subtotal + ' ETB';
        document.getElementById('summaryTotal').innerText = grandTotal + ' ETB';
        scTotal.innerText = grandTotal + ' ETB';
    },

    toggleCart: (force) => {
        const p = document.getElementById('cartPanel');
        const o = document.getElementById('cartOverlay');
        if (force) { p.classList.add('open'); o.classList.add('active'); }
        else { p.classList.remove('open'); o.classList.remove('active'); }
    },

    selectPayment: (methodName, element) => {
        document.querySelectorAll('.pay-option').forEach(c => c.classList.remove('selected'));
        element.classList.add('selected');
        const radioButton = element.querySelector('input[type="radio"]');
        if (radioButton) radioButton.checked = true;

        const transGroup = document.getElementById('transGroup');
        if (methodName === 'cod') {
            transGroup.style.display = 'none';
        } else {
            transGroup.style.display = 'block';
        }
    },

    processOrder: async () => {
        const name = document.getElementById('orderName').value;
        const phone = document.getElementById('orderPhone').value;
        const selectedRadio = document.querySelector('input[name="pay"]:checked');
        const method = selectedRadio ? selectedRadio.value : null;
        const transId = document.getElementById('transId').value.trim();

        if (!name || name.trim() === "") return alert("Please enter your name");
        if (!phone || phone.length < 9) return alert("Please enter a valid phone number");
        if (!method) return alert("Please select a payment method");
        if (method !== 'cod' && !transId) return alert("Please enter Transaction ID");

        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        let total = subtotal + 30 + 10;

        const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
        const newOrder = {
            id: orderId,
            date: new Date().toLocaleString(),
            customer: name,
            phone: phone,
            items: [...cart],
            total: total,
            method: method,
            status: 'Pending ⏳'
        };

        app.toggleCart(false);
        document.getElementById('processingModal').classList.add('active');

        // --- SAVE TO SUPABASE ---
        console.log('[Order] Saving to Supabase...', newOrder.id);
        const itemsString = cart.map(i => `${i.qty}x ${i.name}`).join(', ');

        const { data: insertData, error: insertError } = await db.from('orders').insert({
            customer_name: newOrder.customer,
            phone_number: newOrder.phone,
            address: itemsString,
            total_price: newOrder.total,
            payment_method: newOrder.method,
            transaction_id: transId || '',
            status: newOrder.status
        }).select();

        if (insertError) {
            console.error('[Order] Supabase INSERT failed:', insertError);
            alert('Supabase Error:\n\n' + insertError.message + '\n\nCode: ' + insertError.code + '\n\nscreenshot this message and send it to fix.');
        } else {
            console.log('[Order] Saved to Supabase successfully:', insertData);
            if (insertData && insertData.length > 0) {
                newOrder.id = insertData[0].id;
            }
        }

        setTimeout(() => {
            document.getElementById('processingModal').classList.remove('active');
            // Always save to localStorage for the customer's "My Orders" view
            orders.unshift(newOrder);
            localStorage.setItem('oneBurgerOrders', JSON.stringify(orders));
            app.renderOrderHistory();
            cart = [];
            app.updateCartUI();
            app.showOrderConfirmation(newOrder);
        }, 2000);
    },

    showOrderConfirmation: (order) => {
        const container = document.getElementById('receiptItems');
        const subtotal = order.items.reduce((s, i) => s + (i.price * i.qty), 0);

        container.innerHTML = `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <div style="font-size: 14px; font-weight: 700;">Order #${order.id}</div>
                <div style="color: #666; font-size: 13px;">Status: <span style="color: #d4af37;">${order.status}</span></div>
                <div style="color: #666; font-size: 13px;">Payment: ${(order.method || 'N/A').toUpperCase()}</div>
            </div>
            <div style="margin-bottom: 15px; font-size: 13px; color: #444;">
                ${order.items.map(i => `<div style="display:flex; justify-content:space-between;"><span>${i.qty}x ${i.name} 🍔</span><span>${i.price * i.qty} ETB</span></div>`).join('')}
            </div>
            <div style="font-size: 13px; color: #666; border-top: 1px dashed #eee; padding-top: 10px;">
                <div style="display:flex; justify-content:space-between;"><span>Subtotal</span><span>${subtotal} ETB</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Delivery 🚚</span><span>30 ETB</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Service Fee</span><span>10 ETB</span></div>
            </div>
        `;
        document.getElementById('receiptGrandTotal').innerText = order.total + ' ETB';

        const actionBtn = document.getElementById('confirmActionBtn');
        if (order.method === 'cod') {
            actionBtn.innerText = "OK, GOT IT";
            actionBtn.onclick = () => app.closeSuccess();
        } else {
            actionBtn.innerText = "PROCEED TO PAY";
            actionBtn.onclick = () => app.redirectToPayment(order.method);
        }
        document.getElementById('successModal').classList.add('active');
    },

    redirectToPayment: (method) => {
        const methodStr = method ? method.toUpperCase() : 'TELEBIRR';
        alert(`Redirecting to ${methodStr} secure payment page...`);
        app.closeSuccess();
    },

    closeSuccess: () => {
        document.getElementById('successModal').classList.remove('active');
        app.switchTab('orders');
    },

    renderOrderHistory: () => {
        const container = document.getElementById('order-history-list');
        const badge = document.getElementById('order-badge');
        const headerBadge = document.getElementById('header-order-badge');

        if (orders.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#777;">No past orders found.</p>';
            if (badge) badge.style.display = 'none';
            if (headerBadge) headerBadge.style.display = 'none';
            return;
        }

        // --- UPDATE BADGES ---
        const hasPending = orders.some(o => o.status && !o.status.includes('Received'));
        if (badge) badge.style.display = hasPending ? 'block' : 'none';
        if (headerBadge) headerBadge.style.display = hasPending ? 'block' : 'none';

        container.innerHTML = orders.map(order => {
            const itemsSummary = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
            const canConfirm = order.status && !order.status.includes('Received');
            const statusStyle = order.status && order.status.includes('Received') ? 'color:#2eff71; border-color:#2eff71;' : '';

            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">${order.id}</span>
                        <span class="order-status" style="${statusStyle}">${order.status}</span>
                    </div>
                    <div class="order-items-list">${itemsSummary}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:var(--gold); font-weight:bold;">${order.total} ETB</span>
                        <span style="font-size:0.8rem; color:#888;">${order.date}</span>
                    </div>
                    ${canConfirm ? `
                        <button class="btn btn-attractive" style="padding:10px; font-size:12px; margin-top:15px; border-radius:30px;" onclick="app.receiveOrder('${order.id}')">
                            I RECEIVED MY ORDER
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    receiveOrder: async (id) => {
        const idx = orders.findIndex(o => String(o.id) === String(id));
        if (idx !== -1) {
            const newStatus = "Order Received ✅";
            orders[idx].status = newStatus;
            localStorage.setItem('oneBurgerOrders', JSON.stringify(orders));
            app.renderOrderHistory();

            // Update status in Supabase too
            const { error } = await db.from('orders').update({ status: newStatus }).eq('id', id);
            if (error) console.warn('Could not update status in Supabase:', error.message);

            alert("Enjoy your meal! Thank you for choosing THE ONE BURGER.");
        }
    },

    switchTab: (tabName, skipHash) => {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('orders').style.display = 'none';
        document.querySelector('.hero').style.display = 'none';

        if (tabName === 'home') {
            document.querySelector('.hero').style.display = 'flex';
            document.getElementById('menu').style.display = 'block';
            window.scrollTo(0, 0);
        } else if (tabName === 'menu') {
            document.getElementById('menu').style.display = 'block';
            window.scrollTo(0, document.getElementById('menu').offsetTop);
        } else if (tabName === 'orders') {
            app.renderOrderHistory();
            document.getElementById('orders').style.display = 'block';
            window.scrollTo(0, document.getElementById('orders').offsetTop);
        }

        // Update URL
        if (!skipHash) {
            window.location.hash = tabName;
        }

        document.querySelectorAll('.b-nav-item').forEach(el => el.classList.remove('active'));
        if (tabName === 'home') document.querySelectorAll('.b-nav-item')[0].classList.add('active');
        if (tabName === 'menu') document.querySelectorAll('.b-nav-item')[1].classList.add('active');
        if (tabName === 'orders') document.querySelectorAll('.b-nav-item')[3].classList.add('active');
    },

    scrollTo: (id) => {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    }
};

app.init();

// --- REAL-TIME SYNC (localStorage fallback for same-device tabs) ---
window.addEventListener('storage', (e) => {
    if (e.key === 'oneBurgerOrders') {
        orders = JSON.parse(e.newValue) || [];
        app.renderOrderHistory();
    }
});