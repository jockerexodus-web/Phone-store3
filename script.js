/* ============================================
   Phone Store — Logique applicative
   Créé par Waze Studio — 2026
   Sécurité : escapeHTML, sanitize, validation
   ============================================ */

(function () {
    'use strict';

    // ============ Utilitaires ============

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function sanitize(str, maxLength = 200) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/\s+/g, ' ').slice(0, maxLength);
    }

    function generateId(prefix = 'id') {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function formatPrice(n) {
        return Number(n).toLocaleString('fr-FR') + ' €';
    }

    function timeAgo(date) {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (diff < 60) return 'à l\'instant';
        if (diff < 3600) return Math.floor(diff / 60) + ' min';
        if (diff < 86400) return Math.floor(diff / 3600) + ' h';
        return Math.floor(diff / 86400) + ' j';
    }

    function nowTime() {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    // ============ État ============

    const state = {
        currentView: 'accueil',
        role: 'client',
        products: [
            { id: 'p1', title: 'iPhone 13 Pro 256Go', brand: 'Apple', price: 650, condition: 'Comme neuf', location: 'Paris, 75011', stock: 3, seller: 'Vous', description: 'Excellent état, boîte incluse.' },
            { id: 'p2', title: 'Samsung Galaxy S22 Ultra', brand: 'Samsung', price: 480, condition: 'Bon état', location: 'Lyon, 69003', stock: 1, seller: 'Vous', description: 'Quelques micro-rayures.' },
            { id: 'p3', title: 'Xiaomi Redmi Note 12', brand: 'Xiaomi', price: 150, condition: 'Neuf', location: 'Marseille, 13001', stock: 5, seller: 'Vous', description: 'Sous blister.' },
            { id: 'p4', title: 'Google Pixel 7 Pro', brand: 'Google', price: 420, condition: 'Comme neuf', location: 'Toulouse, 31000', stock: 2, seller: 'Vous', description: 'Garantie constructeur.' },
            { id: 'p5', title: 'OnePlus 11 5G 256Go', brand: 'OnePlus', price: 380, condition: 'Bon état', location: 'Bordeaux, 33000', stock: 1, seller: 'Vous', description: 'Chargeur rapide inclus.' },
            { id: 'p6', title: 'iPhone 12 128Go — Bleu', brand: 'Apple', price: 350, condition: 'Bon état', location: 'Lille, 59000', stock: 4, seller: 'Vous', description: 'Batterie 89%.' },
            { id: 'p7', title: 'Samsung Galaxy A54 5G', brand: 'Samsung', price: 220, condition: 'Comme neuf', location: 'Nantes, 44000', stock: 2, seller: 'Vous', description: 'Sous garantie 2026.' },
            { id: 'p8', title: 'Huawei P60 Pro 256Go', brand: 'Huawei', price: 400, condition: 'Comme neuf', location: 'Strasbourg, 67000', stock: 1, seller: 'Vous', description: 'Double SIM.' }
        ],
        orders: [
            { id: 'CMD-1042', customer: 'Marc D.', product: 'iPhone 13 Pro 256Go', amount: 650, status: 'Livré' },
            { id: 'CMD-1041', customer: 'Sarah L.', product: 'Samsung Galaxy S22 Ultra', amount: 480, status: 'En cours' },
            { id: 'CMD-1040', customer: 'Karim B.', product: 'Xiaomi Redmi Note 12', amount: 150, status: 'Livré' },
            { id: 'CMD-1039', customer: 'Emma R.', product: 'Google Pixel 7 Pro', amount: 420, status: 'Expédié' },
            { id: 'CMD-1038', customer: 'Lucas P.', product: 'iPhone 12 128Go', amount: 350, status: 'En attente' }
        ],
        customers: [
            { name: 'Marc D.', email: 'marc@exemple.fr', orders: 4, total: 2140, color: '#0a66c2' },
            { name: 'Sarah L.', email: 'sarah@exemple.fr', orders: 2, total: 830, color: '#e41e3f' },
            { name: 'Karim B.', email: 'karim@exemple.fr', orders: 6, total: 1890, color: '#31a24c' },
            { name: 'Emma R.', email: 'emma@exemple.fr', orders: 1, total: 420, color: '#f7b928' },
            { name: 'Lucas P.', email: 'lucas@exemple.fr', orders: 3, total: 1150, color: '#8854d0' }
        ],
        conversations: [
            {
                id: 'c1',
                name: 'Alex M.',
                avatar: 'A',
                color: '#0a66c2',
                online: true,
                unread: 2,
                messages: [
                    { text: 'Bonjour, l\'iPhone 13 Pro est-il toujours disponible ?', sender: 'them', time: '10:24' },
                    { text: 'Bonjour ! Oui, il est en stock.', sender: 'me', time: '10:26' },
                    { text: 'Parfait. Vous acceptez les paiements en plusieurs fois ?', sender: 'them', time: '10:27' },
                    { text: 'Oui, 3x sans frais.', sender: 'me', time: '10:28' },
                    { text: 'Super, je le prends !', sender: 'them', time: '10:30' },
                    { text: 'Je vous envoie le lien de paiement sécurisé.', sender: 'them', time: '10:31' }
                ]
            },
            {
                id: 'c2',
                name: 'Sophie L.',
                avatar: 'S',
                color: '#e41e3f',
                online: true,
                unread: 0,
                messages: [
                    { text: 'Bonjour, quel est le dernier prix pour le Galaxy S22 ?', sender: 'them', time: 'Hier' },
                    { text: 'Je peux vous le laisser à 460€.', sender: 'me', time: 'Hier' },
                    { text: 'C\'est noté, merci !', sender: 'them', time: 'Hier' }
                ]
            },
            {
                id: 'c3',
                name: 'Karim B.',
                avatar: 'K',
                color: '#31a24c',
                online: false,
                unread: 0,
                messages: [
                    { text: 'Livraison bien reçue, merci beaucoup !', sender: 'them', time: 'Lun.' },
                    { text: 'Avec plaisir, bonne journée !', sender: 'me', time: 'Lun.' }
                ]
            },
            {
                id: 'c4',
                name: 'Emma R.',
                avatar: 'E',
                color: '#f7b928',
                online: false,
                unread: 1,
                messages: [
                    { text: 'Bonsoir, le Pixel 7 Pro est-il débloqué tout opérateur ?', sender: 'them', time: '20:15' }
                ]
            },
            {
                id: 'c5',
                name: 'Lucas P.',
                avatar: 'L',
                color: '#8854d0',
                online: true,
                unread: 0,
                messages: [
                    { text: 'Super vendeur, je recommande !', sender: 'them', time: 'Dim.' }
                ]
            }
        ],
        activeConversation: null,
        filters: { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' }
    };

    // ============ Navigation entre vues ============

    function switchView(view) {
        if (!['accueil', 'clients', 'vendeurs', 'messages'].includes(view)) return;

        state.currentView = view;

        // Masquer toutes les vues
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        // Afficher la vue demandée
        const target = document.getElementById('view-' + view);
        if (target) target.classList.add('active');

        // Mettre à jour les liens
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === view);
        });

        // Fermer menu mobile
        document.querySelector('.nav-menu').classList.remove('active');
        document.getElementById('userMenu').classList.remove('active');

        // Scroll en haut
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Actions selon la vue
        if (view === 'vendeurs') {
            renderDashboard();
        } else if (view === 'messages') {
            renderConversations();
        } else if (view === 'clients') {
            renderListings();
        }
    }

    // ============ Menu utilisateur ============

    function toggleUserMenu() {
        const menu = document.getElementById('userMenu');
        menu.classList.toggle('active');
    }

    function switchRole(role) {
        state.role = role;
        const nameEl = document.getElementById('userNameDisplay');
        const roleEl = document.getElementById('userRoleDisplay');
        const avatarLarge = document.getElementById('userAvatarLarge');
        const avatarNav = document.querySelector('.user-avatar-nav');

        if (role === 'vendeur') {
            nameEl.textContent = 'Vendeur Pro';
            roleEl.textContent = 'Boutique vérifiée';
            avatarLarge.textContent = '🏪';
            avatarNav.textContent = '🏪';
            showToast('✅ Espace vendeur activé', 'success');
            switchView('vendeurs');
        } else {
            nameEl.textContent = 'Client';
            roleEl.textContent = 'Compte personnel';
            avatarLarge.textContent = '👤';
            avatarNav.textContent = '👤';
            showToast('✅ Espace client activé', 'success');
            switchView('clients');
        }
        document.getElementById('userMenu').classList.remove('active');
    }

    function logout() {
        state.role = 'client';
        document.getElementById('userNameDisplay').textContent = 'Invité';
        document.getElementById('userRoleDisplay').textContent = 'Non connecté';
        document.getElementById('userAvatarLarge').textContent = '👤';
        document.querySelector('.user-avatar-nav').textContent = '👤';
        document.getElementById('userMenu').classList.remove('active');
        showToast('👋 Déconnecté', 'success');
        switchView('accueil');
    }

    // ============ Boutique clients ============

    function getFilteredProducts() {
        let result = [...state.products];

        if (state.filters.search) {
            const q = state.filters.search.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.brand.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q)
            );
        }

        if (state.filters.brand) result = result.filter(p => p.brand === state.filters.brand);
        if (state.filters.minPrice !== null) result = result.filter(p => p.price >= state.filters.minPrice);
        if (state.filters.maxPrice !== null) result = result.filter(p => p.price <= state.filters.maxPrice);

        if (state.filters.conditions.length > 0) {
            result = result.filter(p => state.filters.conditions.includes(p.condition));
        }

        switch (state.filters.sort) {
            case 'price-asc': result.sort((a, b) => a.price - b.price); break;
            case 'price-desc': result.sort((a, b) => b.price - a.price); break;
            default: break;
        }

        return result;
    }

    function renderListings() {
        const grid = document.getElementById('listingsGrid');
        if (!grid) return;

        const filtered = getFilteredProducts();

        document.getElementById('resultsCount').textContent = 
            `Boutique · ${filtered.length} produit${filtered.length > 1 ? 's' : ''}`;

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-message" style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#65676b;background:white;border-radius:16px;">😕 Aucun produit trouvé</div>`;
            return;
        }

        const emojis = { Apple: '🍎', Samsung: '📱', Xiaomi: '⚡', Google: '🔍', OnePlus: '1️⃣', Huawei: '🌸' };

        grid.innerHTML = filtered.map(p => `
            <article class="card">
                <div class="card-img">${emojis[p.brand] || '📱'}</div>
                <div class="card-body">
                    <div class="card-price">${formatPrice(p.price)}</div>
                    <h3 class="card-title">${escapeHTML(p.title)}</h3>
                    <div class="card-location">📍 ${escapeHTML(p.location)}</div>
                    <div class="card-actions">
                        <button class="btn-buy" onclick="PhoneStore.buyProduct('${escapeHTML(p.id)}')">Acheter</button>
                        <button class="btn-contact" onclick="PhoneStore.contactSeller('${escapeHTML(p.id)}')">💬</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function applyFilters() {
        state.filters.brand = document.getElementById('brandFilter').value;
        const min = document.getElementById('minPrice').value;
        const max = document.getElementById('maxPrice').value;
        state.filters.minPrice = min !== '' ? Math.max(0, Number(min)) : null;
        state.filters.maxPrice = max !== '' ? Math.max(0, Number(max)) : null;
        state.filters.sort = document.getElementById('sortFilter').value;
        state.filters.conditions = Array.from(document.querySelectorAll('.conditionFilter:checked')).map(c => c.value);
        renderListings();
    }

    function resetFilters() {
        document.getElementById('brandFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('sortFilter').value = 'recent';
        document.querySelectorAll('.conditionFilter').forEach(c => c.checked = false);
        document.getElementById('searchInput').value = '';
        state.filters = { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' };
        renderListings();
        showToast('Filtres réinitialisés', 'success');
    }

    function buyProduct(id) {
        const product = state.products.find(p => p.id === id);
        if (!product) return;
        showToast(`✅ Commande passée : ${product.title}`, 'success');
    }

    function contactSeller(id) {
        const product = state.products.find(p => p.id === id);
        if (!product) return;

        // Créer ou ouvrir une conversation avec le vendeur
        let conv = state.conversations.find(c => c.name === product.seller);
        if (!conv) {
            conv = {
                id: generateId('c'),
                name: product.seller,
                avatar: product.seller.charAt(0),
                color: '#0a66c2',
                online: true,
                unread: 0,
                messages: [{ text: `Bonjour, je suis intéressé par "${product.title}".`, sender: 'me', time: nowTime() }]
            };
            state.conversations.unshift(conv);
        }
        state.activeConversation = conv.id;
        switchView('messages');
        setTimeout(() => openConversation(conv.id), 100);
    }

    // ============ Dashboard vendeur ============

    function renderDashboard() {
        // KPI
        document.getElementById('kpiProducts').textContent = state.products.length;

        const revenue = state.orders
            .filter(o => o.status === 'Livré')
            .reduce((sum, o) => sum + o.amount, 0);
        document.getElementById('kpiRevenue').textContent = formatPrice(revenue);

        document.getElementById('kpiOrders').textContent = state.orders.length;

        // Table produits
        const productsTable = document.getElementById('productsTable');
        productsTable.innerHTML = state.products.map(p => `
            <tr>
                <td><strong>${escapeHTML(p.title)}</strong></td>
                <td>${escapeHTML(p.brand)}</td>
                <td><strong>${formatPrice(p.price)}</strong></td>
                <td><span class="status-badge status-info">${escapeHTML(p.condition)}</span></td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn-table" onclick="PhoneStore.editProduct('${p.id}')">Modifier</button>
                    <button class="btn-table danger" onclick="PhoneStore.deleteProduct('${p.id}')">Supprimer</button>
                </td>
            </tr>
        `).join('');

        // Table commandes
        const ordersTable = document.getElementById('ordersTable');
        const statusMap = {
            'Livré': 'status-success',
            'En cours': 'status-warning',
            'Expédié': 'status-info',
            'En attente': 'status-danger'
        };
        ordersTable.innerHTML = state.orders.map(o => `
            <tr>
                <td><strong>${escapeHTML(o.id)}</strong></td>
                <td>${escapeHTML(o.customer)}</td>
                <td>${escapeHTML(o.product)}</td>
                <td><strong>${formatPrice(o.amount)}</strong></td>
                <td><span class="status-badge ${statusMap[o.status] || 'status-info'}">${escapeHTML(o.status)}</span></td>
            </tr>
        `).join('');

        // Table clients
        const customersTable = document.getElementById('customersTable');
        customersTable.innerHTML = state.customers.map(c => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:${c.color};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">${escapeHTML(c.name.charAt(0))}</div>
                        <strong>${escapeHTML(c.name)}</strong>
                    </div>
                </td>
                <td>${escapeHTML(c.email)}</td>
                <td>${c.orders}</td>
                <td><strong>${formatPrice(c.total)}</strong></td>
                <td><button class="btn-table" onclick="PhoneStore.contactSeller('${escapeHTML(c.name)}')">💬 Contacter</button></td>
            </tr>
        `).join('');
    }

    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tab));
    }

    function deleteProduct(id) {
        if (!confirm('Supprimer ce produit ?')) return;
        state.products = state.products.filter(p => p.id !== id);
        renderDashboard();
        renderListings();
        showToast('🗑️ Produit supprimé', 'success');
    }

    function editProduct(id) {
        showToast('✏️ Modification bientôt disponible', 'success');
    }

    // ============ Modal produit ============

    function openModal() {
        document.getElementById('modalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('title').focus(), 100);
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('productForm').reset();
    }

    function addProduct(event) {
        event.preventDefault();

        const title = sanitize(document.getElementById('title').value, 100);
        const brand = document.getElementById('brand').value;
        const price = Number(document.getElementById('price').value);
        const condition = document.getElementById('condition').value;
        const location = sanitize(document.getElementById('location').value, 60);
        const stock = Math.min(999, Math.max(1, Number(document.getElementById('stock').value) || 1));
        const description = sanitize(document.getElementById('description').value, 500);

        if (title.length < 3) return showToast('Titre invalide', 'error');
        if (!brand) return showToast('Marque requise', 'error');
        if (!Number.isFinite(price) || price < 1) return showToast('Prix invalide', 'error');
        if (!location) return showToast('Localisation requise', 'error');

        const product = {
            id: generateId('p'),
            title, brand, price, condition, location, stock,
            seller: 'Vous',
            description
        };

        state.products.unshift(product);
        closeModal();
        renderDashboard();
        renderListings();
        showToast('✅ Produit publié !', 'success');
    }

    // ============ Messagerie ============

    function renderConversations() {
        const list = document.getElementById('conversationsList');
        if (!list) return;

        let convs = [...state.conversations];

        const search = document.getElementById('convSearch').value.toLowerCase();
        if (search) {
            convs = convs.filter(c => c.name.toLowerCase().includes(search));
        }

        list.innerHTML = convs.map(c => {
            const lastMsg = c.messages[c.messages.length - 1];
            const preview = lastMsg ? lastMsg.text : 'Aucun message';
            const time = lastMsg ? lastMsg.time : '';

            return `
                <div class="conv-item ${state.activeConversation === c.id ? 'active' : ''}" onclick="PhoneStore.openConversation('${c.id}')">
                    <div class="conv-avatar ${c.online ? 'online' : ''}" style="background:${c.color}">${escapeHTML(c.avatar)}</div>
                    <div class="conv-info">
                        <div class="conv-name">
                            <span>${escapeHTML(c.name)}</span>
                            <span class="conv-time">${escapeHTML(time)}</span>
                        </div>
                        <div class="conv-preview">
                            <span class="conv-preview-text">${escapeHTML(preview)}</span>
                            ${c.unread > 0 ? `<span class="conv-unread">${c.unread}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Badge global
        const totalUnread = state.conversations.reduce((sum, c) => sum + c.unread, 0);
        const badge = document.getElementById('unreadBadge');
        if (totalUnread > 0) {
            badge.textContent = totalUnread;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    function openConversation(id) {
        const conv = state.conversations.find(c => c.id === id);
        if (!conv) return;

        state.activeConversation = id;
        conv.unread = 0;

        // Header
        document.getElementById('chatAvatar').textContent = conv.avatar;
        document.getElementById('chatAvatar').style.background = conv.color;
        document.getElementById('chatAvatar').style.color = 'white';
        document.getElementById('chatName').textContent = conv.name;

        const status = document.getElementById('chatStatus');
        status.textContent = conv.online ? '● En ligne' : '○ Hors ligne';
        status.className = 'chat-status' + (conv.online ? '' : ' offline');

        // Messages
        renderMessages();

        // Activer input
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        input.disabled = false;
        sendBtn.disabled = false;
        setTimeout(() => input.focus(), 100);

        // Re-render liste
        renderConversations();
    }

    function renderMessages() {
        const container = document.getElementById('chatMessages');
        const conv = state.conversations.find(c => c.id === state.activeConversation);

        if (!conv) {
            container.innerHTML = `
                <div class="chat-empty">
                    <div class="chat-empty-icon">💬</div>
                    <p>Choisissez une conversation pour commencer</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conv.messages.map(m => `
            <div class="message ${m.sender === 'me' ? 'sent' : 'received'}">
                ${escapeHTML(m.text)}
                <span class="message-time">${escapeHTML(m.time)}</span>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    }

    function sendMessage(event) {
        event.preventDefault();

        const input = document.getElementById('chatInput');
        const text = sanitize(input.value, 500);
        if (!text || !state.activeConversation) return;

        const conv = state.conversations.find(c => c.id === state.activeConversation);
        if (!conv) return;

        conv.messages.push({
            text,
            sender: 'me',
            time: nowTime()
        });

        input.value = '';
        renderMessages();
        renderConversations();

        // Simulation réponse (typing + réponse auto)
        setTimeout(() => {
            const typing = document.createElement('div');
            typing.className = 'typing-indicator';
            typing.id = 'typingIndicator';
            typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
            document.getElementById('chatMessages').appendChild(typing);
            document.getElementById('chatMessages').scrollTop = 99999;

            setTimeout(() => {
                const el = document.getElementById('typingIndicator');
                if (el) el.remove();

                const replies = [
                    'D\'accord, je regarde ça 👍',
                    'Parfait, merci !',
                    'Je vous confirme dans quelques minutes.',
                    'Très bien, on fait comme ça.',
                    'Vous pouvez passer commande en toute confiance.',
                    'Super, bonne journée à vous !'
                ];
                const reply = replies[Math.floor(Math.random() * replies.length)];

                conv.messages.push({
                    text: reply,
                    sender: 'them',
                    time: nowTime()
                });

                if (state.activeConversation !== conv.id) {
                    conv.unread = (conv.unread || 0) + 1;
                }

                renderMessages();
                renderConversations();
            }, 1200 + Math.random() * 800);
        }, 400);
    }

    // ============ Compteurs animés ============

    function animateCounters() {
        const counters = document.querySelectorAll('.stat-value');
        const duration = 1800;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.target, 10);
                    if (isNaN(target)) return;
                    const start = performance.now();

                    function update(now) {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        el.textContent = Math.floor(target * eased).toLocaleString('fr-FR') + (progress === 1 && target >= 99 ? '+' : '');
                        if (progress < 1) requestAnimationFrame(update);
                    }
                    requestAnimationFrame(update);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.4 });

        counters.forEach(c => observer.observe(c));
    }

    // ============ Toast ============

    let toastTimer = null;
    function showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ============ Initialisation ============

    function init() {
        // Liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                if (view) switchView(view);
            });
        });

        // Logo → accueil
        document.querySelector('.logo').addEventListener('click', (e) => {
            e.preventDefault();
            switchView('accueil');
        });

        // Menu mobile
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });

        // Fermer menu utilisateur au clic extérieur
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenu');
            const userBtn = document.getElementById('userBtn');
            if (!userMenu.contains(e.target) && !userBtn.contains(e.target)) {
                userMenu.classList.remove('active');
            }
        });

        // Fermer modal via overlay
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // Recherche boutique (debounce)
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let t;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(t);
                t = setTimeout(() => {
                    state.filters.search = sanitize(e.target.value, 80).toLowerCase();
                    renderListings();
                }, 200);
            });
        }

        // Recherche conversations
        const convSearch = document.getElementById('convSearch');
        if (convSearch) {
            convSearch.addEventListener('input', renderConversations);
        }

        // Compteurs
        animateCounters();

        // Rendu initial
        renderListings();
    }

    // ============ API publique ============

    window.PhoneStore = {
        switchView,
        toggleUserMenu,
        switchRole,
        logout,
        applyFilters,
        resetFilters,
        buyProduct,
        contactSeller,
        openModal,
        closeModal,
        addProduct,
        deleteProduct,
        editProduct,
        switchTab,
        openConversation,
        sendMessage,
        showToast
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
