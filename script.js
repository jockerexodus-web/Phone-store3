/* ============================================
   Phone Store — Logique applicative
   Waze Studio — 2026/2027
   - Inscription obligatoire pour utiliser le site
   - Prix en FCFA
   - Messagerie 100% réelle entre utilisateurs
   - Zéro fausse annonce (catalogue vide par défaut)
   ============================================ */

(function () {
    'use strict';

    // ============ Utilitaires ============

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function sanitize(str, max = 300) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/\s+/g, ' ').slice(0, max);
    }

    function uid(prefix = 'id') {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function formatFCFA(n) {
        const num = Number(n) || 0;
        return num.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA';
    }

    function nowTime() {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function timeAgo(ts) {
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60) return 'à l\'instant';
        if (diff < 3600) return Math.floor(diff / 60) + ' min';
        if (diff < 86400) return Math.floor(diff / 3600) + ' h';
        if (diff < 604800) return Math.floor(diff / 86400) + ' j';
        return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }

    function isValidEmail(e) {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e) && e.length <= 120;
    }

    function isValidPhone(p) {
        return /^[+\d\s().-]{6,20}$/.test(p);
    }

    // ============ Stockage ============

    const DB = {
        users: 'ps_users_v1',
        session: 'ps_session_v1',
        products: 'ps_products_v1',
        conversations: 'ps_conversations_v1'
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch { return fallback; }
    }

    function write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn(e); }
    }

    // ============ État ============

    const state = {
        user: null,           // utilisateur connecté
        users: [],            // tous les utilisateurs
        products: [],         // toutes les annonces (vides au départ)
        conversations: [],    // toutes les conversations
        activeConvId: null,
        currentView: 'accueil',
        pendingAction: null,  // action à exécuter après connexion
        filters: { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' }
    };

    // ============ Persistance ============

    function loadAll() {
        state.users = read(DB.users, []);
        state.products = read(DB.products, []);
        state.conversations = read(DB.conversations, []);
        state.user = read(DB.session, null);

        // Vérifier que la session correspond à un utilisateur réel
        if (state.user) {
            const exists = state.users.find(u => u.id === state.user.id);
            if (!exists) {
                state.user = null;
                write(DB.session, null);
            }
        }
    }

    function saveUsers() { write(DB.users, state.users); }
    function saveProducts() { write(DB.products, state.products); }
    function saveConversations() { write(DB.conversations, state.conversations); }
    function saveSession() { write(DB.session, state.user); }

    // ============ Auth ============

    let authTab = 'login';

    function openAuth(tab) {
        authTab = tab || 'login';
        switchAuthTab(authTab);
        document.getElementById('authOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeAuth() {
        document.getElementById('authOverlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    }

    function switchAuthTab(tab) {
        authTab = tab;
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        document.getElementById('loginForm').classList.toggle('active', tab === 'login');
        document.getElementById('registerForm').classList.toggle('active', tab === 'register');
    }

    function handleRegister(e) {
        e.preventDefault();

        const name = sanitize(document.getElementById('regName').value, 80);
        const email = sanitize(document.getElementById('regEmail').value, 120).toLowerCase();
        const phone = sanitize(document.getElementById('regPhone').value, 20);
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        const terms = document.getElementById('regTerms').checked;

        if (name.length < 2) return toast('Nom invalide', 'error');
        if (!isValidEmail(email)) return toast('Email invalide', 'error');
        if (!isValidPhone(phone)) return toast('Numéro de téléphone invalide', 'error');
        if (password.length < 6) return toast('Mot de passe trop court (6 min.)', 'error');
        if (!terms) return toast('Veuillez accepter les conditions', 'error');

        if (state.users.find(u => u.email === email)) {
            return toast('Cet email est déjà utilisé', 'error');
        }

        const user = {
            id: uid('u'),
            name,
            email,
            phone,
            password, // ⚠️ démo — en prod : hash côté serveur
            role,     // 'client' | 'vendeur' | 'both'
            since: Date.now()
        };

        state.users.push(user);
        saveUsers();

        state.user = user;
        saveSession();

        closeAuth();
        applyUserSession();
        toast(`🎉 Bienvenue ${user.name.split(' ')[0]} !`, 'success');

        // Exécuter l'action en attente
        if (state.pendingAction) {
            const act = state.pendingAction;
            state.pendingAction = null;
            setTimeout(() => act(), 200);
        } else {
            switchView('acheter');
        }
    }

    function handleLogin(e) {
        e.preventDefault();

        const email = sanitize(document.getElementById('loginEmail').value, 120).toLowerCase();
        const password = document.getElementById('loginPassword').value;

        if (!isValidEmail(email)) return toast('Email invalide', 'error');
        if (!password) return toast('Mot de passe requis', 'error');

        const user = state.users.find(u => u.email === email && u.password === password);
        if (!user) return toast('Email ou mot de passe incorrect', 'error');

        state.user = user;
        saveSession();

        closeAuth();
        applyUserSession();
        toast(`👋 Bon retour ${user.name.split(' ')[0]} !`, 'success');

        if (state.pendingAction) {
            const act = state.pendingAction;
            state.pendingAction = null;
            setTimeout(() => act(), 200);
        } else {
            switchView('acheter');
        }
    }

    function logout() {
        state.user = null;
        state.activeConvId = null;
        saveSession();
        applyUserSession();
        closeUserMenu();
        toast('Vous êtes déconnecté', 'info');
        switchView('accueil');
    }

    function applyUserSession() {
        const navAuth = document.querySelector('.nav-actions');
        const navUser = document.getElementById('navUser');

        if (state.user) {
            navAuth.classList.add('hidden');
            navUser.classList.remove('hidden');

            const initial = state.user.name.charAt(0).toUpperCase();
            document.getElementById('navUserAvatar').textContent = initial;
            document.getElementById('navUserName').textContent = state.user.name.split(' ')[0];

            const roleLabels = { client: 'Acheteur', vendeur: 'Vendeur', both: 'Acheteur & Vendeur' };
            document.getElementById('navUserRole').textContent = roleLabels[state.user.role] || 'Utilisateur';

            // Afficher/masquer les vues selon le rôle
            const sellLink = document.querySelector('[data-view="vendre"]');
            const buyLink = document.querySelector('[data-view="acheter"]');
            if (sellLink) sellLink.style.display = (state.user.role === 'client') ? 'none' : '';
            if (buyLink) buyLink.style.display = (state.user.role === 'vendeur') ? 'none' : '';
        } else {
            navAuth.classList.remove('hidden');
            navUser.classList.add('hidden');
            // Tous les liens visibles par défaut
            document.querySelectorAll('.nav-link').forEach(l => l.style.display = '');
        }

        updateUnreadBadge();
    }

    function requireAuth(action) {
        if (state.user) {
            if (action === 'acheter') switchView('acheter');
            else if (action === 'vendre') {
                if (state.user.role === 'client') {
                    toast('Créez un compte vendeur pour vendre', 'info');
                    openAuth('register');
                    return;
                }
                switchView('vendre');
            }
            return;
        }

        state.pendingAction = () => {
            if (action === 'acheter') switchView('acheter');
            else if (action === 'vendre') {
                if (state.user.role === 'client') {
                    toast('Votre compte est configuré comme acheteur', 'info');
                } else {
                    switchView('vendre');
                }
            }
        };
        toast('Connectez-vous pour continuer', 'info');
        openAuth('register');
    }

    // ============ Menu utilisateur ============

    function toggleUserMenu() {
        document.getElementById('userMenu').classList.toggle('active');
    }

    function closeUserMenu() {
        document.getElementById('userMenu').classList.remove('active');
    }

    function toggleMobileMenu() {
        document.querySelector('.nav-menu').classList.toggle('active');
    }

    // ============ Navigation ============

    function switchView(view) {
        state.currentView = view;

        // Bloquer les vues sensibles sans connexion
        if (!state.user && ['vendre', 'messages', 'compte'].includes(view)) {
            toast('Connectez-vous pour accéder à cet espace', 'info');
            openAuth('login');
            return;
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById('view-' + view);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(l =>
            l.classList.toggle('active', l.dataset.view === view));

        closeUserMenu();
        document.querySelector('.nav-menu').classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Rendus spécifiques
        if (view === 'acheter') renderCatalog();
        if (view === 'vendre') renderMyListings();
        if (view === 'messages') renderConversations();
        if (view === 'compte') renderAccount();
    }

    function navTo(e, view) {
        if (e) e.preventDefault();
        switchView(view);
    }

    function goHome(e) {
        if (e) e.preventDefault();
        switchView('accueil');
    }

    // ============ Catalogue (Acheter) ============

    function getFilteredProducts() {
        let list = [...state.products];

        // Exclure les produits de l'utilisateur lui-même ? → Non, on les montre mais avec mention
        if (state.filters.search) {
            const q = state.filters.search.toLowerCase();
            list = list.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.brand || '').toLowerCase().includes(q) ||
                (p.location || '').toLowerCase().includes(q));
        }

        if (state.filters.brand) list = list.filter(p => p.brand === state.filters.brand);
        if (state.filters.minPrice !== null) list = list.filter(p => p.price >= state.filters.minPrice);
        if (state.filters.maxPrice !== null) list = list.filter(p => p.price <= state.filters.maxPrice);
        if (state.filters.conditions.length) list = list.filter(p => state.filters.conditions.includes(p.condition));

        switch (state.filters.sort) {
            case 'price-asc': list.sort((a, b) => a.price - b.price); break;
            case 'price-desc': list.sort((a, b) => b.price - a.price); break;
            default: list.sort((a, b) => b.createdAt - a.createdAt);
        }

        return list;
    }

    function renderCatalog() {
        const grid = document.getElementById('catalogGrid');
        if (!grid) return;

        const list = getFilteredProducts();

        const countEl = document.getElementById('resultsCount');
        countEl.textContent = `${list.length} téléphone${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;

        if (list.length === 0) {
            grid.innerHTML = `
                <div class="empty-catalog">
                    <div class="empty-icon">📭</div>
                    <h3>Aucun téléphone disponible</h3>
                    <p>Aucune annonce n'est publiée pour le moment. Revenez plus tard ou publiez la vôtre.</p>
                    ${state.user && state.user.role !== 'client'
                        ? `<button class="btn-primary" onclick="PhoneStore.switchView('vendre')">Publier une annonce</button>`
                        : `<button class="btn-primary" onclick="PhoneStore.openAuth('register')">Créer un compte</button>`}
                </div>`;
            return;
        }

        const brandEmojis = { Apple: '🍎', Samsung: '📱', Xiaomi: '⚡', Google: '🔍', OnePlus: '1️⃣', Huawei: '🌸', Oppo: '🟢', Autre: '📞' };

        grid.innerHTML = list.map(p => {
            const seller = state.users.find(u => u.id === p.sellerId);
            const sellerName = seller ? seller.name : 'Utilisateur';
            const initial = sellerName.charAt(0).toUpperCase();
            const emoji = brandEmojis[p.brand] || '📱';
            const isMine = state.user && p.sellerId === state.user.id;

            return `
                <div class="product-card">
                    <div class="product-visual">
                        <span class="product-condition-badge">${escapeHTML(p.condition)}</span>
                        ${emoji}
                    </div>
                    <div class="product-body">
                        <div class="product-price">${formatFCFA(p.price)}</div>
                        <h3 class="product-title">${escapeHTML(p.title)}</h3>
                        <div class="product-loc">📍 ${escapeHTML(p.location)}</div>
                        <div class="product-seller">
                            <div class="product-seller-avatar">${escapeHTML(initial)}</div>
                            <span>${escapeHTML(sellerName)}${isMine ? ' (vous)' : ''}</span>
                        </div>
                        <div class="product-actions">
                            ${isMine
                                ? `<button class="btn-buy" onclick="PhoneStore.deleteMyProduct('${p.id}')" style="background:#dc2626">Supprimer</button>`
                                : `<button class="btn-buy" onclick="PhoneStore.contactSeller('${p.id}')">Contacter</button>`}
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    function applyFilters() {
        state.filters.brand = document.getElementById('brandFilter').value;
        const minV = document.getElementById('minPrice').value;
        const maxV = document.getElementById('maxPrice').value;
        state.filters.minPrice = minV !== '' ? Math.max(0, Number(minV)) : null;
        state.filters.maxPrice = maxV !== '' ? Math.max(0, Number(maxV)) : null;
        state.filters.sort = document.getElementById('sortFilter').value;
        state.filters.conditions = Array.from(document.querySelectorAll('.conditionFilter:checked')).map(c => c.value);
        renderCatalog();
    }

    function resetFilters() {
        document.getElementById('brandFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('sortFilter').value = 'recent';
        document.querySelectorAll('.conditionFilter').forEach(c => c.checked = false);
        document.getElementById('searchInput').value = '';
        state.filters = { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' };
        renderCatalog();
        toast('Filtres réinitialisés', 'info');
    }

    // ============ Vendre ============

    function publishProduct(e) {
        e.preventDefault();

        if (!state.user) {
            toast('Connectez-vous pour publier', 'error');
            openAuth('login');
            return;
        }

        if (state.user.role === 'client') {
            toast('Votre compte est configuré pour acheter uniquement', 'error');
            return;
        }

        const title = sanitize(document.getElementById('pTitle').value, 100);
        const brand = document.getElementById('pBrand').value;
        const price = Number(document.getElementById('pPrice').value);
        const condition = document.getElementById('pCondition').value;
        const location = sanitize(document.getElementById('pLocation').value, 80);
        const description = sanitize(document.getElementById('pDescription').value, 600);

        if (title.length < 3) return toast('Titre trop court', 'error');
        if (!brand) return toast('Marque requise', 'error');
        if (!Number.isFinite(price) || price < 1000) return toast('Prix invalide (min. 1 000 FCFA)', 'error');
        if (!location) return toast('Localisation requise', 'error');

        const product = {
            id: uid('p'),
            title, brand, price, condition, location, description,
            sellerId: state.user.id,
            createdAt: Date.now()
        };

        state.products.unshift(product);
        saveProducts();

        document.getElementById('sellForm').reset();
        renderMyListings();
        toast('✅ Annonce publiée avec succès', 'success');
    }

    function renderMyListings() {
        const container = document.getElementById('myListings');
        if (!container) return;

        if (!state.user) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>Connectez-vous pour gérer vos annonces.</p></div>`;
            return;
        }

        const mine = state.products.filter(p => p.sellerId === state.user.id);

        if (mine.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><p>Vous n'avez publié aucune annonce.</p></div>`;
            return;
        }

        const brandEmojis = { Apple: '🍎', Samsung: '📱', Xiaomi: '⚡', Google: '🔍', OnePlus: '1️⃣', Huawei: '🌸', Oppo: '🟢', Autre: '📞' };

        container.innerHTML = mine.map(p => `
            <div class="my-listing-item">
                <div class="my-listing-thumb">${brandEmojis[p.brand] || '📱'}</div>
                <div class="my-listing-info">
                    <strong>${escapeHTML(p.title)}</strong>
                    <span>${formatFCFA(p.price)} · ${escapeHTML(p.condition)}</span>
                </div>
                <div class="my-listing-actions">
                    <button class="btn-mini danger" onclick="PhoneStore.deleteMyProduct('${p.id}')">Suppr.</button>
                </div>
            </div>
        `).join('');
    }

    function deleteMyProduct(id) {
        if (!state.user) return;
        const product = state.products.find(p => p.id === id && p.sellerId === state.user.id);
        if (!product) return;
        if (!confirm('Supprimer cette annonce ?')) return;

        state.products = state.products.filter(p => p.id !== id);
        saveProducts();
        renderMyListings();
        renderCatalog();
        toast('🗑️ Annonce supprimée', 'info');
    }

    // ============ Messagerie RÉELLE ============

    function contactSeller(productId) {
        if (!state.user) {
            toast('Connectez-vous pour contacter le vendeur', 'info');
            openAuth('login');
            return;
        }

        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        if (product.sellerId === state.user.id) {
            toast('Vous ne pouvez pas vous contacter vous-même', 'info');
            return;
        }

        // Chercher une conversation existante entre ces 2 utilisateurs
        let conv = state.conversations.find(c =>
            c.participants.length === 2 &&
            c.participants.includes(state.user.id) &&
            c.participants.includes(product.sellerId) &&
            c.productId === productId
        );

        if (!conv) {
            conv = {
                id: uid('c'),
                participants: [state.user.id, product.sellerId],
                productId: product.id,
                productTitle: product.title,
                productPrice: product.price,
                messages: [
                    {
                        id: uid('m'),
                        senderId: state.user.id,
                        text: `Bonjour, je suis intéressé(e) par "${product.title}" à ${formatFCFA(product.price)}.`,
                        ts: Date.now(),
                        readBy: [state.user.id]
                    }
                ],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            state.conversations.unshift(conv);
            saveConversations();
        }

        state.activeConvId = conv.id;
        switchView('messages');
        setTimeout(() => openConversation(conv.id), 100);
    }

    function getOtherParticipant(conv, meId) {
        const otherId = conv.participants.find(p => p !== meId);
        return state.users.find(u => u.id === otherId);
    }

    function getConversationsForUser() {
        if (!state.user) return [];
        return state.conversations
            .filter(c => c.participants.includes(state.user.id))
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }

    function renderConversations() {
        const list = document.getElementById('convList');
        if (!list) return;

        if (!state.user) {
            list.innerHTML = `<div class="empty-state" style="padding:40px 20px;"><div class="empty-icon">🔒</div><p>Connectez-vous pour voir vos messages.</p></div>`;
            return;
        }

        let convs = getConversationsForUser();

        const search = (document.getElementById('convSearch').value || '').toLowerCase();
        if (search) {
            convs = convs.filter(c => {
                const other = getOtherParticipant(c, state.user.id);
                return other && other.name.toLowerCase().includes(search);
            });
        }

        if (convs.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding:40px 20px;">
                    <div class="empty-icon">💬</div>
                    <p>Aucune conversation pour le moment.</p>
                    <p style="font-size:12px;margin-top:6px;color:#8892a0;">Contactez un vendeur pour démarrer.</p>
                </div>`;
            return;
        }

        list.innerHTML = convs.map(c => {
            const other = getOtherParticipant(c, state.user.id);
            if (!other) return '';
            const last = c.messages[c.messages.length - 1];
            const unread = c.messages.filter(m => m.senderId !== state.user.id && !m.readBy.includes(state.user.id)).length;

            return `
                <div class="conv-item ${state.activeConvId === c.id ? 'active' : ''}" onclick="PhoneStore.openConversation('${c.id}')">
                    <div class="conv-avatar ${other.online ? 'online' : ''}">${escapeHTML(other.name.charAt(0).toUpperCase())}</div>
                    <div class="conv-body">
                        <div class="conv-top">
                            <strong>${escapeHTML(other.name)}</strong>
                            <span class="conv-time">${last ? timeAgo(last.ts) : ''}</span>
                        </div>
                        <div class="conv-preview">
                            <span class="conv-preview-text">${last ? escapeHTML(last.text) : 'Aucun message'}</span>
                            ${unread > 0 ? `<span class="conv-unread">${unread}</span>` : ''}
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    function openConversation(convId) {
        if (!state.user) return;
        const conv = state.conversations.find(c => c.id === convId);
        if (!conv || !conv.participants.includes(state.user.id)) return;

        state.activeConvId = convId;

        // Marquer les messages comme lus
        let changed = false;
        conv.messages.forEach(m => {
            if (m.senderId !== state.user.id && !m.readBy.includes(state.user.id)) {
                m.readBy.push(state.user.id);
                changed = true;
            }
        });
        if (changed) saveConversations();

        const other = getOtherParticipant(conv, state.user.id);

        // Header
        document.getElementById('chatAvatar').textContent = other ? other.name.charAt(0).toUpperCase() : '?';
        document.getElementById('chatAvatar').style.background = 'var(--grad-1)';
        document.getElementById('chatAvatar').style.color = 'white';
        document.getElementById('chatName').textContent = other ? other.name : 'Utilisateur';
        document.getElementById('chatStatus').textContent = other && other.online ? '● En ligne' : '○ Hors ligne';

        // Messages
        renderChatMessages();

        // Activer input
        const input = document.getElementById('chatInput');
        const btn = document.getElementById('sendBtn');
        input.disabled = false;
        btn.disabled = false;
        setTimeout(() => input.focus(), 100);

        // Re-render liste pour retirer badge non-lu
        renderConversations();
        updateUnreadBadge();
    }

    function renderChatMessages() {
        const body = document.getElementById('chatBody');
        const conv = state.conversations.find(c => c.id === state.activeConvId);

        if (!conv) {
            body.innerHTML = `
                <div class="chat-empty">
                    <div class="chat-empty-icon">💬</div>
                    <p>Choisissez une conversation pour commencer</p>
                </div>`;
            return;
        }

        const html = [];

        // Bandeau produit
        if (conv.productTitle) {
            html.push(`
                <div class="msg-system">
                    📱 ${escapeHTML(conv.productTitle)} · ${formatFCFA(conv.productPrice)}
                </div>`);
        }

        conv.messages.forEach(m => {
            const mine = m.senderId === state.user.id;
            html.push(`
                <div class="message ${mine ? 'sent' : 'received'}">
                    ${escapeHTML(m.text)}
                    <span class="msg-time">${new Date(m.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>`);
        });

        body.innerHTML = html.join('');
        body.scrollTop = body.scrollHeight;
    }

    function sendMessage(e) {
        e.preventDefault();
        if (!state.user) return;

        const input = document.getElementById('chatInput');
        const text = sanitize(input.value, 500);
        if (!text) return;

        const conv = state.conversations.find(c => c.id === state.activeConvId);
        if (!conv) return;

        conv.messages.push({
            id: uid('m'),
            senderId: state.user.id,
            text,
            ts: Date.now(),
            readBy: [state.user.id]
        });
        conv.updatedAt = Date.now();

        saveConversations();
        input.value = '';
        renderChatMessages();
        renderConversations();
    }

    function updateUnreadBadge() {
        if (!state.user) {
            document.getElementById('unreadBadge').style.display = 'none';
            return;
        }
        const total = state.conversations
            .filter(c => c.participants.includes(state.user.id))
            .reduce((sum, c) => sum + c.messages.filter(m =>
                m.senderId !== state.user.id && !m.readBy.includes(state.user.id)).length, 0);

        const badge = document.getElementById('unreadBadge');
        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : total;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    // ============ Compte ============

    function renderAccount() {
        if (!state.user) return;

        const initial = state.user.name.charAt(0).toUpperCase();
        document.getElementById('profileAvatar').textContent = initial;
        document.getElementById('profileName').textContent = state.user.name;
        document.getElementById('profileEmail').textContent = state.user.email;

        const roleLabels = { client: 'Acheteur', vendeur: 'Vendeur', both: 'Acheteur & Vendeur' };
        document.getElementById('profileRole').textContent = roleLabels[state.user.role] || 'Utilisateur';

        document.getElementById('infoName').textContent = state.user.name;
        document.getElementById('infoEmail').textContent = state.user.email;
        document.getElementById('infoPhone').textContent = state.user.phone;
        document.getElementById('infoSince').textContent = new Date(state.user.since).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        // Statistiques
        const myProducts = state.products.filter(p => p.sellerId === state.user.id);
        const myMessages = state.conversations
            .filter(c => c.participants.includes(state.user.id))
            .reduce((sum, c) => sum + c.messages.filter(m => m.senderId === state.user.id).length, 0);

        document.getElementById('statListings').textContent = myProducts.length;
        document.getElementById('statMessages').textContent = myMessages;
        document.getElementById('statSales').textContent = '0'; // À brancher sur un vrai système de ventes
    }

    // ============ Compteurs hero ============

    function animateCounters() {
        const counters = document.querySelectorAll('.stat-num');
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10);
                if (isNaN(target)) return;
                const start = performance.now();
                const duration = 1600;

                function tick(now) {
                    const p = Math.min((now - start) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.floor(target * eased).toLocaleString('fr-FR') + (p === 1 ? '+' : '');
                    if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
                obs.unobserve(el);
            });
        }, { threshold: 0.4 });

        counters.forEach(c => obs.observe(c));
    }

    // ============ Toast ============

    let toastTimer;
    function toast(message, type = '') {
        const el = document.getElementById('toast');
        el.textContent = message;
        el.className = 'toast show ' + type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
    }

    // ============ Init ============

    function init() {
        loadAll();
        applyUserSession();

        // Fermer auth via overlay
        document.getElementById('authOverlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeAuth();
        });

        // Échap
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeAuth();
                closeUserMenu();
            }
        });

        // Fermer menu user si clic extérieur
        document.addEventListener('click', e => {
            const menu = document.getElementById('userMenu');
            const btn = document.querySelector('#navUser .nav-btn');
            if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
                closeUserMenu();
            }
        });

        // Recherche catalogue (debounce)
        const si = document.getElementById('searchInput');
        if (si) {
            let t;
            si.addEventListener('input', e => {
                clearTimeout(t);
                t = setTimeout(() => {
                    state.filters.search = sanitize(e.target.value, 80).toLowerCase();
                    renderCatalog();
                }, 180);
            });
        }

        // Recherche conversations
        const cs = document.getElementById('convSearch');
        if (cs) cs.addEventListener('input', renderConversations);

        // Compteurs
        animateCounters();

        // Simulation "online" aléatoire (purement visuel)
        state.users.forEach(u => u.online = Math.random() > 0.5);

        // Rendu initial
        if (state.currentView === 'acheter') renderCatalog();
    }

    // ============ API publique ============

    window.PhoneStore = {
        // nav
        switchView, navTo, goHome, toggleMobileMenu,
        // auth
        openAuth, closeAuth, switchAuthTab, handleLogin, handleRegister,
        logout, toggleUserMenu, requireAuth,
        // catalogue
        applyFilters, resetFilters,
        // vendeur
        publishProduct, deleteMyProduct,
        // messagerie
        contactSeller, openConversation, sendMessage,
        // ui
        toast
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
