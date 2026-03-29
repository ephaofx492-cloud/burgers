// admin.js — Fully connected to Supabase

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://wfwrbwgfxhqpcossdzdh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmd3Jid2dmeGhxcGNvc3NkemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjU2NTcsImV4cCI6MjA4OTYwMTY1N30.7q4O5-1GXK-MdLtESRxPP8GafoC1X8W3tQZZla-630E';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

// --- STATUS HELPERS ---
function setStatus(type, message) {
    const banner = document.getElementById('db-status');
    const dot = document.getElementById('db-status-dot');
    const text = document.getElementById('db-status-text');
    if (!banner) return;

    const styles = {
        loading: { bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)', color: '#d4af37', dotColor: '#d4af37', anim: 'pulse 1.5s infinite' },
        ok: { bg: 'rgba(46,255,113,0.1)', border: 'rgba(46,255,113,0.3)', color: '#2eff71', dotColor: '#2eff71', anim: 'none' },
        error: { bg: 'rgba(255,46,46,0.1)', border: 'rgba(255,46,46,0.4)', color: '#ff4444', dotColor: '#ff4444', anim: 'none' },
    };
    const s = styles[type] || styles.loading;
    banner.style.background = s.bg;
    banner.style.border = `1px solid ${s.border}`;
    banner.style.color = s.color;
    dot.style.background = s.dotColor;
    dot.style.animation = s.anim;
    text.innerText = message;
}

const admin = {
    orders: [],
    pollInterval: null,

    init: async () => {
        console.log('[Admin] Initializing...');
        setStatus('loading', 'Connecting to Supabase...');
        await admin.loadOrders();

        // Poll every 10 seconds as a reliable fallback
        // (real-time requires Supabase Replication to be enabled for the table)
        admin.pollInterval = setInterval(admin.loadOrders, 10000);

        // Also try real-time (works if replication is enabled in Supabase dashboard)
        admin.subscribeRealtime();
    },

    // ----------------------------------------------------------
    // LOAD orders from Supabase
    // ----------------------------------------------------------
    loadOrders: async () => {
        console.log('[Admin] Fetching orders from Supabase...');

        const { data, error } = await db
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Admin] Supabase fetch error:', error);
            setStatus('error', `❌ ${error.message} — Check your table name and RLS settings.`);
            const tbody = document.getElementById('adminOrderTable');
            if (tbody) {
                tbody.innerHTML = `
                    <tr><td colspan="7" style="padding:30px; color:#ff4444; text-align:center;">
                        <strong>Database Error:</strong> ${error.message}<br>
                        <small style="color:#888; margin-top:8px; display:block;">
                            Make sure the <code>orders</code> table exists and Row Level Security (RLS) is disabled.
                        </small>
                    </td></tr>`;
            }
            return;
        }

        console.log('[Admin] Orders received:', data ? data.length : 0, 'rows', data);

        if (!data || data.length === 0) {
            setStatus('ok', `✅ Connected to Supabase — No orders yet. Place an order from the main page.`);
        } else {
            setStatus('ok', `✅ Connected — ${data.length} order(s) loaded`);
        }

        admin.orders = data || [];
        admin.renderDashboard();
    },

    // ----------------------------------------------------------
    // REAL-TIME (optional — requires Replication enabled in Supabase)
    // Go to: Supabase → Database → Replication → supabase_realtime → add orders table
    // ----------------------------------------------------------
    subscribeRealtime: () => {
        db.channel('orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('[Admin] Real-time event:', payload);
                admin.loadOrders();
            })
            .subscribe((status) => {
                console.log('[Admin] Realtime status:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('[Admin] Real-time is active — orders will update instantly.');
                }
            });
    },

    renderDashboard: () => {
        admin.renderStats();
        admin.renderTable();
    },

    renderStats: () => {
        const totalOrders = admin.orders.length;
        const totalRevenue = admin.orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        const pendingOrders = admin.orders.filter(o => o.status && o.status.includes('Pending')).length;

        document.getElementById('statOrders').innerText = totalOrders;
        document.getElementById('statRevenue').innerText = totalRevenue + ' ETB';
        document.getElementById('statPending').innerText = pendingOrders;
    },

    renderTable: () => {
        const tbody = document.getElementById('adminOrderTable');
        if (!tbody) return;

        if (admin.orders.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7" style="text-align:center; padding:50px; color:#555;">
                    No orders in Supabase yet.<br>
                    <small style="color:#444; font-size:0.8rem;">Place an order on the main page and it will appear here automatically.</small>
                </td></tr>`;
            return;
        }

        tbody.innerHTML = admin.orders.map(order => {
            const items = order.address || 'N/A';
            const statusClass = admin.getStatusClass(order.status);
            const dateStr = order.created_at
                ? new Date(order.created_at).toLocaleString()
                : (order.date || 'N/A');

            return `
                <tr>
                    <td><strong style="color:var(--gold);">${order.id}</strong></td>
                    <td>
                        <div style="font-weight:700;">${order.customer_name || 'N/A'}</div>
                        <div style="font-size:0.7rem; color:#888;">${order.phone_number || ''}</div>
                        <div style="font-size:0.7rem; color:#666;">${dateStr}</div>
                    </td>
                    <td style="max-width:250px; font-size:0.8rem; color:#aaa;">${items}</td>
                    <td style="font-weight:700;">${order.total_price} ETB</td>
                    <td style="text-transform:uppercase; font-size:0.7rem;">${order.payment_method || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${order.status || 'Unknown'}</span></td>
                    <td>
                        <select onchange="admin.updateStatus('${order.id}', this.value)"
                            style="background:#111; color:white; border:1px solid #444; padding:5px; border-radius:4px; font-size:0.7rem;">
                            <option value="" disabled selected>Update Status</option>
                            <option value="Pending ⏳">Pending ⏳</option>
                            <option value="Preparing 👨‍🍳">Preparing 👨‍🍳</option>
                            <option value="Out for Delivery 🚚">Out for Delivery 🚚</option>
                            <option value="Delivered ✅">Delivered ✅</option>
                        </select>
                        <button onclick="admin.deleteOrder('${order.id}')"
                            style="background:transparent; border:none; color:#555; cursor:pointer; margin-left:10px; font-size:1.2rem;" title="Delete">&times;</button>
                    </td>
                </tr>`;
        }).join('');
    },

    getStatusClass: (status) => {
        if (!status) return 'status-pending';
        if (status.includes('Pending')) return 'status-pending';
        if (status.includes('Preparing')) return 'status-preparing';
        if (status.includes('Delivery')) return 'status-ready';
        if (status.includes('Delivered')) return 'status-delivered';
        if (status.includes('Received')) return 'status-ready';
        return 'status-pending';
    },

    // ----------------------------------------------------------
    // UPDATE status in Supabase
    // ----------------------------------------------------------
    updateStatus: async (orderId, newStatus) => {
        console.log('[Admin] Updating status:', orderId, '->', newStatus);
        const { error } = await db
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            alert('Failed to update status: ' + error.message);
            console.error('[Admin] Update error:', error);
        } else {
            await admin.loadOrders();
        }
    },

    // ----------------------------------------------------------
    // DELETE order from Supabase
    // ----------------------------------------------------------
    deleteOrder: async (orderId) => {
        if (!confirm('Delete this order?')) return;
        const { error } = await db
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            alert('Failed to delete: ' + error.message);
        } else {
            await admin.loadOrders();
        }
    },

    // ----------------------------------------------------------
    // CLEAR ALL orders from Supabase
    // ----------------------------------------------------------
    clearOrders: async () => {
        if (!confirm('CRITICAL: Delete ALL orders permanently from the database?')) return;
        const { error } = await db
            .from('orders')
            .delete()
            .neq('id', '');

        if (error) {
            alert('Failed to clear: ' + error.message);
        } else {
            admin.orders = [];
            admin.renderDashboard();
            setStatus('ok', '✅ All orders cleared.');
        }
    }
};

admin.init();
