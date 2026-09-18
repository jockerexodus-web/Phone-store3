/* ============================================
   Phone Store — Logique applicative
   Waze Studio — 2026/2027
   ============================================ */

(function () {
    'use strict';

    // ============ Utils ============
    const escapeHTML = (s) => typeof s === 'string'
        ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
        : '';

    const sanitize = (s, max = 300) => typeof s === 'string'
        ? s.trim().replace(/\s+/g, ' ').slice(0, max) : '';

    const formatFCFA = (n) => (Number(n) || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA';

    const timeAgo = (ts) => {
        const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
        if (diff < 60) return "à l'instant";
        if (diff < 3600) return Math.floor(diff / 60) + ' min';
        if (diff < 86400) return Math.floor(diff / 3600) + ' h';
        if (diff < 604800) return Math.floor(diff / 86400) + ' j';
        return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    const isValidEmail = (e) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e);
    const isValidPhone = (p) => /^[+\d\s().-]{6,20}$/.test(p);

    // ============ État ============
    const state = {
        user: null,
        profile: null,
        products: [],
        myProducts: [],
        conversations: [],
        favorites: [],
        notifications: [],
        activeConvId: null,
        activeConvChannel: null,
        currentView: 'accueil',
        pendingAction: null,
        pendingPurchase: null,
        pendingImageFile: null,
        filters: { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' }
    };

    const THEME_KEY = 'ps_theme_v3';

    function applyTheme() {
        const theme = localStorage.getItem(THEME_KEY) || 'light';
        document.body.classList.toggle('dark', theme === 'dark');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = theme === 'dark';
    }

    function toggleTheme() {
        const cur = localStorage.getItem(THEME_KEY) || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme();
        toast(next === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair', 'info');
    }

    function initTopBar() {
        if (localStorage.getItem('ps_topbar_v3') === 'hidden') {
            document.getElementById('topBar').classList.add('hidden');
        }
    }

    function dismissTopBar() {
        document.getElementById('topBar').classList.add('hidden');
        localStorage.setItem('ps_topbar_v3', 'hidden');
    }

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

    async function handleRegister(e) {
        e.preventDefault();

        const name = sanitize(document.getElementById('regName').value, 80);
        const email = sanitize(document.getElementById('regEmail').value, 120).toLowerCase();
        const phone = sanitize(document.getElementById('regPhone').value, 20);
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        const terms = document.getElementById('regTerms').checked;

        if (name.length < 2) return toast('Nom invalide', 'error');
        if (!isValidEmail(email)) return toast('Email invalide', 'error');
        if (!isValidPhone(phone)) return toast('Téléphone invalide', 'error');
        if (password.length < 6) return toast('Mot de passe trop court (6 min.)', 'error');
        if (!terms) return toast('Acceptez les conditions', 'error');

        try {
            toast('⏳ Création du compte...', 'info');
            await window.Supa.auth.register({ email, password, name, phone, role });
            toast('✅ Compte créé ! Vérifiez votre email.', 'success');
            closeAuth();
        } catch (err) {
            console.error(err);
            toast(err.message || 'Erreur lors de l\'inscription', 'error');
        }
    }

    async function handleLogin(e) {
        e.preventDefault();

        const email = sanitize(document.getElementById('loginEmail').value, 120).toLowerCase();
        const password = document.getElementById('loginPassword').value;

        if (!isValidEmail(email)) return toast('Email invalide', 'error');
        if (!password) return toast('Mot de passe requis', 'error');

        try {
            toast('⏳ Connexion...', 'info');
            await window.Supa.auth.login({ email, password });
            toast('✅ Connecté !', 'success');
            closeAuth();
        } catch (err) {
            console.error(err);
            toast(err.message || 'Identifiants incorrects', 'error');
        }
    }

    async function resetPassword(e) {
        e.preventDefault();
        const email = prompt('Entrez votre email :');
        if (!email) return;
        try {
            await window.Supa.auth.resetPassword(email);
            toast('📧 Email de réinitialisation envoyé', 'success');
        } catch (err) {
            toast(err.message || 'Erreur', 'error');
        }
    }

    async function logout() {
        try { await window.Supa.auth.logout(); } catch (e) { console.warn(e); }
        state.user = null;
        state.profile = null;
        closeUserMenu();
        toast('Déconnecté', 'info');
        switchView('accueil');
    }

    async function loadUserContext(session) {
        if (!session || !session.user) {
            state.user = null;
            state.profile = null;
            applyUserSession();
            return;
        }

        state.user = session.user;
        try {
            state.profile = await window.Supa.profiles.get(session.user.id);
        } catch (e) {
            console.warn('Profil introuvable', e);
            state.profile = { id: session.user.id, name: session.user.email, role: 'client', verified: false, created_at: new Date().toISOString() };
        }

        applyUserSession();
        startRealtimeListeners();

        await Promise.all([
            loadMyProducts(),
            loadFavorites(),
            loadNotifications(),
            loadConversations()
        ]);
    }

    function applyUserSession() {
        const navAuth = document.querySelector('.nav-actions');
        const navUser = document.getElementById('navUser');

        if (state.user && state.profile) {
            navAuth.classList.add('hidden');
            navUser.classList.remove('hidden');

            const initial = (state.profile.name || 'U').charAt(0).toUpperCase();
            document.getElementById('navUserAvatar').textContent = initial;
            document.getElementById('navUserName').textContent = (state.profile.name || '').split(' ')[0] || 'Utilisateur';
            document.getElementById('userMenuAvatar').textContent = initial;
            document.getElementById('userMenuName').textContent = state.profile.name || '—';
            document.getElementById('userMenuEmail').textContent = state.profile.email || '—';

            const roleLabels = { client: 'Acheteur', vendeur: 'Vendeur', both: 'Acheteur & Vendeur' };
            document.getElementById('navUserRole').textContent = roleLabels[state.profile.role] || 'Utilisateur';

            const sellLink = document.querySelector('[data-view="vendre"]');
            const buyLink = document.querySelector('[data-view="acheter"]');
            if (sellLink) sellLink.style.display = (state.profile.role === 'client') ? 'none' : '';
            if (buyLink) buyLink.style.display = (state.profile.role === 'vendeur') ? 'none' : '';
        } else {
            navAuth.classList.remove('hidden');
            navUser.classList.add('hidden');
            document.querySelectorAll('.nav-link').forEach(l => l.style.display = '');
        }

        updateBadges();
    }

    function requireAuth(action) {
        if (state.user) {
            if (action === 'acheter') switchView('acheter');
            else if (action === 'vendre') {
                if (state.profile.role === 'client') {
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
            else if (action === 'vendre') switchView('vendre');
        };
        toast('Connectez-vous pour continuer', 'info');
        openAuth('register');
    }

    function toggleUserMenu() { document.getElementById('userMenu').classList.toggle('active'); }
    function closeUserMenu() { document.getElementById('userMenu').classList.remove('active'); }
    function toggleMobileMenu() { document.querySelector('.nav-menu').classList.toggle('active'); }

    function switchView(view) {
        state.currentView = view;

        if (!state.user && ['vendre', 'messages', 'compte', 'favoris', 'notifications'].includes(view)) {
            toast('Connectez-vous pour accéder à cet espace', 'info');
            openAuth('login');
            return;
        }

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById('view-' + view);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === view));

        closeUserMenu();
        document.querySelector('.nav-menu').classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (view === 'acheter') loadCatalog();
        if (view === 'vendre') renderMyListings();
        if (view === 'messages') renderConversations();
        if (view === 'compte') renderAccount();
        if (view === 'favoris') renderFavorites();
        if (view === 'notifications') renderNotifications();
    }

    function navTo(e, view) {
        if (e) e.preventDefault();
        switchView(view);
    }

    function goHome(e) {
        if (e) e.preventDefault();
        switchView('accueil');
    }

    // ============ Catalogue ============
    async function loadCatalog() {
        const grid = document.getElementById('catalogGrid');
        if (!grid) return;

        try {
            grid.innerHTML = `<div class="empty-catalog" style="grid-column:1/-1;"><div class="empty-icon">⏳</div><p>Chargement...</p></div>`;

            const list = await window.Supa.products.list({
                brand: state.filters.brand,
                minPrice: state.filters.minPrice,
                maxPrice: state.filters.maxPrice,
                conditions: state.filters.conditions,
                search: state.filters.search,
                sort: state.filters.sort
            });
            state.products = list;

            document.getElementById('resultsCount').textContent =
                `${list.length} téléphone${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;

            if (list.length === 0) {
                grid.innerHTML = `<div class="empty-catalog">
                    <div class="empty-icon">📭</div>
                    <h3>Aucun téléphone disponible</h3>
                    <p>Aucune annonce publiée pour le moment.</p>
                    ${state.user && state.profile.role !== 'client'
                        ? `<button class="btn-primary" onclick="PhoneStore.switchView('vendre')">Publier une annonce</button>`
                        : `<button class="btn-primary" onclick="PhoneStore.openAuth('register')">Créer un compte</button>`}
                </div>`;
                return;
            }
            renderProductGrid(grid, list);
        } catch (err) {
            console.error(err);
            grid.innerHTML = `<div class="empty-catalog" style="grid-column:1/-1;"><div class="empty-icon">⚠️</div><p>Erreur de chargement</p></div>`;
        }
    }

    const brandEmojis = { Apple: '🍎', Samsung: '📱', Xiaomi: '⚡', Google: '🔍', OnePlus: '1️⃣', Huawei: '🌸', Oppo: '🟢', Autre: '📞' };

    function renderProductGrid(grid, list) {
        grid.innerHTML = list.map(p => {
            const seller = p.seller || { name: 'Utilisateur' };
            const sellerName = seller.name;
            const initial = sellerName.charAt(0).toUpperCase();
            const emoji = brandEmojis[p.brand] || '📱';
            const isMine = state.user && p.seller_id === state.user.id;
            const fav = state.favorites.some(f => f.product_id === p.id);

            const visual = p.image_url
                ? `<img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.title)}" loading="lazy">`
                : emoji;

            return `
                <div class="product-card">
                    <div class="product-visual">
                        <span class="product-condition-badge">${escapeHTML(p.condition)}</span>
                        <button class="btn-fav-card" onclick="PhoneStore.toggleFavorite('${p.id}')">${fav ? '❤️' : '🤍'}</button>
                        ${visual}
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
                                : `<button class="btn-buy" onclick="PhoneStore.openPayment('${p.id}')">Acheter</button>
                                   <button class="btn-chat" onclick="PhoneStore.contactSeller('${p.id}')">💬</button>`}
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    async function applyFilters() {
        state.filters.brand = document.getElementById('brandFilter').value;
        const minV = document.getElementById('minPrice').value;
        const maxV = document.getElementById('maxPrice').value;
        state.filters.minPrice = minV !== '' ? Math.max(0, Number(minV)) : null;
        state.filters.maxPrice = maxV !== '' ? Math.max(0, Number(maxV)) : null;
        state.filters.sort = document.getElementById('sortFilter').value;
        state.filters.conditions = Array.from(document.querySelectorAll('.conditionFilter:checked')).map(c => c.value);
        await loadCatalog();
    }

    async function resetFilters() {
        document.getElementById('brandFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('sortFilter').value = 'recent';
        document.querySelectorAll('.conditionFilter').forEach(c => c.checked = false);
        document.getElementById('searchInput').value = '';
        state.filters = { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' };
        await loadCatalog();
        toast('Filtres réinitialisés', 'info');
    }

    // ============ Favoris ============
    async function loadFavorites() {
        if (!state.user) { state.favorites = []; return; }
        try {
            state.favorites = await window.Supa.favorites.list(state.user.id);
        } catch (e) {
            console.warn('Favoris erreur', e);
            state.favorites = [];
        }
        updateBadges();
    }

    async function toggleFavorite(productId) {
        if (!state.user) {
            toast('Connectez-vous pour ajouter aux favoris', 'info');
            openAuth('login');
            return;
        }
        try {
            const isFav = await window.Supa.favorites.toggle(state.user.id, productId);
            toast(isFav ? '❤️ Ajouté aux favoris' : 'Retiré des favoris', isFav ? 'success' : 'info');
            await loadFavorites();
            if (state.currentView === 'acheter') await loadCatalog();
            if (state.currentView === 'favoris') renderFavorites();
        } catch (err) {
            console.error(err);
            toast('Erreur', 'error');
        }
    }

    function renderFavorites() {
        const grid = document.getElementById('favGrid');
        if (!grid) return;

        const list = state.favorites.map(f => {
            const p = f.product;
            if (p && !p.seller) p.seller = { name: 'Utilisateur' };
            return p;
        }).filter(Boolean);

        if (list.length === 0) {
            grid.innerHTML = `<div class="empty-catalog" style="grid-column:1/-1;">
                <div class="empty-icon">💔</div>
                <h3>Aucun favori</h3>
                <p>Ajoutez des téléphones en cliquant sur ❤️</p>
            </div>`;
            return;
        }
        renderProductGrid(grid, list);
    }

    // ============ Vendre ============
    async function loadMyProducts() {
        if (!state.user) { state.myProducts = []; return; }
        try {
            state.myProducts = await window.Supa.products.mine(state.user.id);
        } catch (e) {
            console.warn(e);
            state.myProducts = [];
        }
    }

    function previewImage(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';

        if (!file) { state.pendingImageFile = null; return; }
        if (file.size > 2 * 1024 * 1024) {
            toast('Image trop lourde (max 2 Mo)', 'error');
            e.target.value = '';
            state.pendingImageFile = null;
            return;
        }

        state.pendingImageFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => { preview.innerHTML = `<img src="${ev.target.result}" alt="Aperçu">`; };
        reader.readAsDataURL(file);
    }

    async function publishProduct(e) {
        e.preventDefault();

        if (!state.user) {
            toast('Connectez-vous pour publier', 'error');
            openAuth('login');
            return;
        }
        if (state.profile.role === 'client') {
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
        if (!Number.isFinite(price) || price < 1000) return toast('Prix invalide', 'error');
        if (!location) return toast('Localisation requise', 'error');

        try {
            toast('⏳ Publication...', 'info');

            let imageUrl = null;
            if (state.pendingImageFile) {
                imageUrl = await window.Supa.storage.uploadImage(state.pendingImageFile, state.user.id);
            }

            await window.Supa.products.create({
                seller_id: state.user.id,
                title, brand, price, condition, location, description,
                image_url: imageUrl
            });

            document.getElementById('sellForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            state.pendingImageFile = null;

            await loadMyProducts();
            renderMyListings();
            toast('✅ Annonce publiée !', 'success');
        } catch (err) {
            console.error(err);
            toast(err.message || 'Erreur publication', 'error');
        }
    }

    function renderMyListings() {
        const container = document.getElementById('myListings');
        if (!container) return;

        if (!state.user) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>Connectez-vous.</p></div>`;
            return;
        }

        if (state.myProducts.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><p>Aucune annonce publiée.</p></div>`;
            return;
        }

        container.innerHTML = state.myProducts.map(p => {
            const img = p.image_url
                ? `<img src="${escapeHTML(p.image_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
                : (brandEmojis[p.brand] || '📱');

            return `
                <div class="my-listing-item">
                    <div class="my-listing-thumb">${img}</div>
                    <div class="my-listing-info">
                        <strong>${escapeHTML(p.title)}</strong>
                        <span>${formatFCFA(p.price)} · ${escapeHTML(p.condition)}</span>
                    </div>
                    <div class="my-listing-actions">
                        <button class="btn-mini danger" onclick="PhoneStore.deleteMyProduct('${p.id}')">Suppr.</button>
                    </div>
                </div>`;
        }).join('');
    }

    async function deleteMyProduct(id) {
        if (!state.user) return;
        if (!confirm('Supprimer cette annonce ?')) return;

        try {
            const product = state.myProducts.find(p => p.id === id);
            if (product && product.image_url) {
                await window.Supa.storage.remove(product.image_url);
            }
            await window.Supa.products.remove(id);
            state.myProducts = state.myProducts.filter(p => p.id !== id);
            renderMyListings();
            toast('🗑️ Annonce supprimée', 'info');
        } catch (err) {
            console.error(err);
            toast('Erreur suppression', 'error');
        }
    }

    // ============ Paiement ============
    function openPayment(productId) {
        if (!state.user) {
            toast('Connectez-vous pour acheter', 'info');
            openAuth('login');
            return;
        }

        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        if (product.seller_id === state.user.id) {
            toast('Vous ne pouvez pas acheter votre propre annonce', 'info');
            return;
        }

        state.pendingPurchase = product;

        const fee = Math.round(product.price * 0.02);
        const total = product.price + fee;

        document.getElementById('paymentSubtitle').textContent = `Vous allez acheter : ${product.title}`;
        document.getElementById('paymentSummary').innerHTML = `
            <div class="payment-row"><span>Prix de l'article</span><strong>${formatFCFA(product.price)}</strong></div>
            <div class="payment-row"><span>Frais de service (2%)</span><strong>${formatFCFA(fee)}</strong></div>
            <div class="payment-row total"><span>Total</span><strong>${formatFCFA(total)}</strong></div>
        `;

        document.getElementById('paymentOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePayment() {
        document.getElementById('paymentOverlay').classList.remove('active');
        document.body.style.overflow = '';
        state.pendingPurchase = null;
    }

    async function confirmPayment() {
        const product = state.pendingPurchase;
        if (!product || !state.user) return;

        const method = document.querySelector('input[name="payMethod"]:checked').value;
        const methodLabels = { orange: 'Orange Money', mtn: 'MTN Mobile Money', wave: 'Wave', card: 'Carte bancaire' };

        try {
            toast('💳 Traitement...', 'info');

            const fee = Math.round(product.price * 0.02);
            const total = product.price + fee;

            await window.Supa.orders.create({
                buyerId: state.user.id,
                sellerId: product.seller_id,
                productId: product.id,
                amount: product.price,
                fee, total,
                paymentMethod: method
            });

            await window.Supa.notifications.create({
                userId: state.user.id,
                type: 'purchase',
                title: '✅ Paiement confirmé',
                content: `Votre achat de "${product.title}" via ${methodLabels[method]}.`
            });

            await window.Supa.notifications.create({
                userId: product.seller_id,
                type: 'sale',
                title: '💰 Nouvelle vente !',
                content: `${state.profile.name} a acheté "${product.title}" pour ${formatFCFA(product.price)}.`
            });

            closePayment();
            await loadNotifications();
            toast('✅ Paiement confirmé !', 'success');
        } catch (err) {
            console.error(err);
            toast('Erreur paiement', 'error');
        }
    }

    // ============ Messagerie ============
    async function loadConversations() {
        if (!state.user) { state.conversations = []; return; }
        try {
            state.conversations = await window.Supa.conversations.listForUser(state.user.id);
        } catch (e) {
            console.warn(e);
            state.conversations = [];
        }
        updateBadges();
    }

    async function contactSeller(productId) {
        if (!state.user) {
            toast('Connectez-vous pour contacter', 'info');
            openAuth('login');
            return;
        }
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        if (product.seller_id === state.user.id) {
            toast('Vous ne pouvez pas vous contacter', 'info');
            return;
        }

        try {
            const conv = await window.Supa.conversations.findOrCreate({
                buyerId: state.user.id,
                sellerId: product.seller_id,
                productId: product.id
            });

            state.activeConvId = conv.id;

            const msgs = await window.Supa.messages.listForConversation(conv.id);
            if (msgs.length === 0) {
                await window.Supa.messages.send({
                    conversationId: conv.id,
                    senderId: state.user.id,
                    content: `Bonjour, je suis intéressé(e) par "${product.title}" à ${formatFCFA(product.price)}.`
                });
                await window.Supa.notifications.create({
                    userId: product.seller_id,
                    type: 'message',
                    title: '💬 Nouveau message',
                    content: `${state.profile.name} vous a envoyé un message concernant "${product.title}".`
                });
            }

            await loadConversations();
            switchView('messages');
            setTimeout(() => openConversation(conv.id), 200);
        } catch (err) {
            console.error(err);
            toast('Erreur messagerie', 'error');
        }
    }

    function getOther(conv) {
        if (!state.user) return null;
        return conv.buyer_id === state.user.id ? conv.seller : conv.buyer;
    }

    function renderConversations() {
        const list = document.getElementById('convList');
        if (!list) return;

        if (!state.user) {
            list.innerHTML = `<div class="empty-state" style="padding:40px 20px;"><div class="empty-icon">🔒</div><p>Connectez-vous.</p></div>`;
            return;
        }

        let convs = state.conversations;
        const search = (document.getElementById('convSearch').value || '').toLowerCase();
        if (search) {
            convs = convs.filter(c => {
                const other = getOther(c);
                return other && other.name.toLowerCase().includes(search);
            });
        }

        const countEl = document.getElementById('convCount');
        if (countEl) countEl.textContent = convs.length;

        if (convs.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding:40px 20px;">
                    <div class="empty-icon">💬</div>
                    <p>Aucune conversation.</p>
                    <p style="font-size:12px;margin-top:6px;color:#8892a0;">Contactez un vendeur pour démarrer.</p>
                </div>`;
            return;
        }

        list.innerHTML = convs.map(c => {
            const other = getOther(c);
            if (!other) return '';
            return `
                <div class="conv-item ${state.activeConvId === c.id ? 'active' : ''}" onclick="PhoneStore.openConversation('${c.id}')">
                    <div class="conv-avatar online">${escapeHTML(other.name.charAt(0).toUpperCase())}</div>
                    <div class="conv-body">
                        <div class="conv-top">
                            <strong>${escapeHTML(other.name)}</strong>
                            <span class="conv-time">${timeAgo(c.last_message_at || c.created_at)}</span>
                        </div>
                        <div class="conv-preview">
                            <span class="conv-preview-text">${escapeHTML(c.last_message || 'Aucun message')}</span>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    async function openConversation(convId) {
        if (!state.user) return;
        const conv = state.conversations.find(c => c.id === convId);
        if (!conv) return;

        state.activeConvId = convId;
        const other = getOther(conv);

        document.getElementById('chatAvatar').textContent = other ? other.name.charAt(0).toUpperCase() : '?';
        document.getElementById('chatAvatar').style.background = 'var(--grad-primary)';
        document.getElementById('chatAvatar').style.color = 'white';
        document.getElementById('chatName').textContent = other ? other.name : 'Utilisateur';
        document.getElementById('chatStatus').textContent = '● En ligne';

        await renderChatMessages();

        const input = document.getElementById('chatInput');
        const btn = document.getElementById('sendBtn');
        input.disabled = false;
        btn.disabled = false;
        setTimeout(() => input.focus(), 100);

        try { await window.Supa.messages.markRead(convId, state.user.id); } catch (e) {}
        await loadConversations();
        updateBadges();

        if (state.activeConvChannel) {
            window.Supa.messages.unsubscribe(state.activeConvChannel);
        }
        state.activeConvChannel = window.Supa.messages.subscribeToConversation(convId, (newMsg) => {
            if (newMsg.sender_id !== state.user.id) {
                renderChatMessages();
                loadConversations();
            }
        });
    }

    async function renderChatMessages() {
        const body = document.getElementById('chatBody');
        const conv = state.conversations.find(c => c.id === state.activeConvId);

        if (!conv) {
            body.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">💬</div><p>Choisissez une conversation</p></div>`;
            return;
        }

        try {
            const msgs = await window.Supa.messages.listForConversation(conv.id);

            const html = [];
            if (conv.product) {
                html.push(`<div class="msg-system">📱 ${escapeHTML(conv.product.title)} · ${formatFCFA(conv.product.price)}</div>`);
            }

            msgs.forEach(m => {
                const mine = m.sender_id === state.user.id;
                html.push(`
                    <div class="message ${mine ? 'sent' : 'received'}">
                        ${escapeHTML(m.content)}
                        <span class="msg-time">${new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>`);
            });

            body.innerHTML = html.join('');
            body.scrollTop = body.scrollHeight;
        } catch (e) {
            console.error(e);
        }
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!state.user) return;

        const input = document.getElementById('chatInput');
        const text = sanitize(input.value, 500);
        if (!text || !state.activeConvId) return;

        try {
            await window.Supa.messages.send({
                conversationId: state.activeConvId,
                senderId: state.user.id,
                content: text
            });

            const conv = state.conversations.find(c => c.id === state.activeConvId);
            if (conv) {
                const other = getOther(conv);
                if (other) {
                    await window.Supa.notifications.create({
                        userId: other.id,
                        type: 'message',
                        title: '💬 Nouveau message',
                        content: `${state.profile.name} : ${text.slice(0, 60)}`
                    });
                }
            }

            input.value = '';
            await renderChatMessages();
            await loadConversations();
        } catch (err) {
            console.error(err);
            toast('Erreur envoi', 'error');
        }
    }

    // ============ Notifications ============
    async function loadNotifications() {
        if (!state.user) { state.notifications = []; return; }
        try {
            state.notifications = await window.Supa.notifications.list(state.user.id);
        } catch (e) {
            console.warn(e);
        }
        updateBadges();
    }

    function renderNotifications() {
        const list = document.getElementById('notifsList');
        if (!list || !state.user) return;

        if (state.notifications.length === 0) {
            list.innerHTML = `<div class="empty-catalog">
                <div class="empty-icon">🔔</div>
                <h3>Aucune notification</h3>
            </div>`;
            return;
        }

        const icons = { message: '💬', new_product: '📱', sale: '💰', purchase: '✅', system: '🎉', info: '💡' };

        list.innerHTML = state.notifications.map(n => `
            <div class="notif-item ${n.is_read ? '' : 'unread'}">
                <div class="notif-icon">${icons[n.type] || '🔔'}</div>
                <div class="notif-content">
                    <strong>${escapeHTML(n.title)}</strong>
                    <p>${escapeHTML(n.content || '')}</p>
                    <time>${timeAgo(n.created_at)}</time>
                </div>
            </div>
        `).join('');

        window.Supa.notifications.markAllRead(state.user.id).then(() => updateBadges());
    }

    // ============ Badges ============
    async function updateBadges() {
        if (state.user) {
            try {
                const count = await window.Supa.messages.countUnread(state.user.id);
                const badge = document.getElementById('unreadBadge');
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'inline-block';
                } else badge.style.display = 'none';
            } catch (e) {}
        } else {
            document.getElementById('unreadBadge').style.display = 'none';
        }

        const favBadge = document.getElementById('favBadge');
        const favCount = state.favorites.length;
        if (favCount > 0) {
            favBadge.textContent = favCount;
            favBadge.style.display = 'inline-block';
        } else favBadge.style.display = 'none';

        const notifBadge = document.getElementById('notifBadge');
        const unreadNotif = state.notifications.filter(n => !n.is_read).length;
        if (unreadNotif > 0) {
            notifBadge.textContent = unreadNotif > 99 ? '99+' : unreadNotif;
            notifBadge.style.display = 'inline-block';
        } else notifBadge.style.display = 'none';
    }

    // ============ Compte ============
    function renderAccount() {
        if (!state.user || !state.profile) return;

        const initial = (state.profile.name || 'U').charAt(0).toUpperCase();
        document.getElementById('profileAvatar').textContent = initial;
        document.getElementById('profileName').textContent = state.profile.name;
        document.getElementById('profileEmail').textContent = state.profile.email;

        const roleLabels = { client: 'Acheteur', vendeur: 'Vendeur', both: 'Acheteur & Vendeur' };
        document.getElementById('profileRole').textContent = roleLabels[state.profile.role] || 'Utilisateur';

        const vBadge = document.getElementById('verifiedBadge');
        if (state.profile.verified) {
            vBadge.innerHTML = `<div class="verified-badge">✅ Vérifié</div>`;
        } else {
            vBadge.innerHTML = `<div class="verified-badge" style="background:rgba(217,119,6,0.12);color:#d97706;">⏳ Non vérifié</div>`;
        }

        document.getElementById('infoName').textContent = state.profile.name;
        document.getElementById('infoEmail').textContent = state.profile.email;
        document.getElementById('infoPhone').textContent = state.profile.phone || '—';
        document.getElementById('infoSince').textContent = new Date(state.profile.created_at)
            .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        document.getElementById('statListings').textContent = state.myProducts.length;
        document.getElementById('statFavorites').textContent = state.favorites.length;
        document.getElementById('statMessages').textContent = '0';

        const nToggle = document.getElementById('pushToggle');
        if (nToggle) nToggle.checked = localStorage.getItem('ps_notifs') !== 'off';
    }

    // ============ Realtime ============
    let notifChannel = null;
    let convsChannel = null;

    function startRealtimeListeners() {
        if (!state.user) return;

        if (notifChannel) window.Supa.client.removeChannel(notifChannel);
        notifChannel = window.Supa.notifications.subscribe(state.user.id, async (n) => {
            state.notifications.unshift(n);
            updateBadges();
            if (n.type === 'message') toast(`💬 ${n.title}`, 'info');
            else toast(`${n.title}`, 'success');
        });

        if (convsChannel) window.Supa.client.removeChannel(convsChannel);
        convsChannel = window.Supa.client.channel('convs-user')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => loadConversations())
            .subscribe();
    }

    // ============ Compteurs ============
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-num');
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10);
                if (isNaN(target)) return;
                const start = performance.now();
                const dur = 1600;
                function tick(now) {
                    const p = Math.min((now - start) / dur, 1);
                    const e = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.floor(target * e).toLocaleString('fr-FR') + (p === 1 ? '+' : '');
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
        if (!el) return;
        el.textContent = message;
        el.className = 'toast show ' + type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
    }

    // ============ Init ============
    async function init() {
        window.Supa.init();
        applyTheme();
        initTopBar();
        animateCounters();

        const session = await window.Supa.auth.getSession();
        await loadUserContext(session);

        window.Supa.auth.onChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await loadUserContext(session);
            } else if (event === 'SIGNED_OUT') {
                state.user = null;
                state.profile = null;
                applyUserSession();
            }
        });

        document.getElementById('authOverlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeAuth();
        });
        document.getElementById('paymentOverlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) closePayment();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeAuth();
                closePayment();
                closeUserMenu();
            }
        });

        document.addEventListener('click', e => {
            const menu = document.getElementById('userMenu');
            const btn = document.querySelector('#navUser .nav-btn');
            if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
                closeUserMenu();
            }
        });

        const si = document.getElementById('searchInput');
        if (si) {
            let t;
            si.addEventListener('input', e => {
                clearTimeout(t);
                t = setTimeout(async () => {
                    state.filters.search = sanitize(e.target.value, 80);
                    if (state.currentView === 'acheter') await loadCatalog();
                }, 300);
            });
        }

        const cs = document.getElementById('convSearch');
        if (cs) cs.addEventListener('input', renderConversations);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }

    window.PhoneStore = {
        switchView, navTo, goHome, toggleMobileMenu,
        openAuth, closeAuth, switchAuthTab, handleLogin, handleRegister,
        logout, toggleUserMenu, requireAuth, resetPassword,
        applyFilters, resetFilters,
        publishProduct, deleteMyProduct, previewImage,
        contactSeller, openConversation, sendMessage,
        toggleFavorite,
        openPayment, closePayment, confirmPayment,
        toggleTheme, dismissTopBar,
        toast
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
