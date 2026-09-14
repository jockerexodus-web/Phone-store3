/* ============================================
   Phone Store — Version ultime 2026/2027
   Waze Studio
   - Auth + vérification email simulée
   - Upload photo (base64)
   - Favoris persistants
   - Notifications
   - Paiement Mobile Money simulé
   - Mode sombre
   - PWA (Service Worker)
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

    const uid = (p = 'id') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const formatFCFA = (n) => (Number(n) || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA';

    const nowTime = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const timeAgo = (ts) => {
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60) return "à l'instant";
        if (diff < 3600) return Math.floor(diff / 60) + ' min';
        if (diff < 86400) return Math.floor(diff / 3600) + ' h';
        if (diff < 604800) return Math.floor(diff / 86400) + ' j';
        return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    const isValidEmail = (e) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e) && e.length <= 120;
    const isValidPhone = (p) => /^[+\d\s().-]{6,20}$/.test(p);

    // Génère un code de vérification à 6 chiffres
    const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

    // ============ Stockage ============

    const DB = {
        users: 'ps_users_v2',
        session: 'ps_session_v2',
        products: 'ps_products_v2',
        conversations: 'ps_conversations_v2',
        favorites: 'ps_favorites_v2',
        notifications: 'ps_notifs_v2',
        theme: 'ps_theme_v2',
        topbar: 'ps_topbar_v2'
    };

    const read = (key, fb) => {
        try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) ?? fb) : fb; }
        catch { return fb; }
    };
    const write = (key, val) => {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn(e); }
    };

    // ============ État ============

    const state = {
        user: null,
        users: [],
        products: [],
        conversations: [],
        favorites: [],
        notifications: [],
        activeConvId: null,
        currentView: 'accueil',
        pendingAction: null,
        pendingPurchase: null,
        filters: { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' }
    };

    // ============ Persistance ============

    function loadAll() {
        state.users = read(DB.users, []);
        state.products = read(DB.products, []);
        state.conversations = read(DB.conversations, []);
        state.favorites = read(DB.favorites, []);
        state.notifications = read(DB.notifications, []);
        state.user = read(DB.session, null);

        if (state.user && !state.users.find(u => u.id === state.user.id)) {
            state.user = null;
            write(DB.session, null);
        }
    }

    const saveUsers = () => write(DB.users, state.users);
    const saveProducts = () => write(DB.products, state.products);
    const saveConvs = () => write(DB.conversations, state.conversations);
    const saveFavs = () => write(DB.favorites, state.favorites);
    const saveNotifs = () => write(DB.notifications, state.notifications);
    const saveSession = () => write(DB.session, state.user);

    // ============ Notifications internes ============

    function pushNotification(recipientId, type, title, message) {
        state.notifications.unshift({
            id: uid('n'),
            recipientId,
            type,
            title,
            message,
            ts: Date.now(),
            read: false
        });
        // Cap
        if (state.notifications.length > 200) state.notifications.length = 200;
        saveNotifs();
        if (state.user && state.user.id === recipientId) {
            renderNotifications();
            updateBadges();
        }
    }

    // ============ Thème ============

    function applyTheme() {
        const theme = read(DB.theme, 'light');
        document.body.classList.toggle('dark', theme === 'dark');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = theme === 'dark';
    }

    function toggleTheme() {
        const cur = read(DB.theme, 'light');
        const next = cur === 'dark' ? 'light' : 'dark';
        write(DB.theme, next);
        applyTheme();
        toast(next === 'dark' ? '🌙 Mode sombre activé' : '☀️ Mode clair activé', 'info');
    }

    // ============ Top bar ============

    function initTopBar() {
        if (read(DB.topbar, false)) {
            document.getElementById('topBar').classList.add('hidden');
        }
    }

    function dismissTopBar() {
        document.getElementById('topBar').classList.add('hidden');
        write(DB.topbar, true);
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
        if (!isValidPhone(phone)) return toast('Téléphone invalide', 'error');
        if (password.length < 6) return toast('Mot de passe trop court', 'error');
        if (!terms) return toast('Acceptez les conditions', 'error');
        if (state.users.find(u => u.email === email)) return toast('Cet email est déjà utilisé', 'error');

        // Générer code de vérification
        const code = genCode();

        const user = {
            id: uid('u'),
            name, email, phone, password,
            role,
            since: Date.now(),
            verified: false,
            verificationCode: code,
            online: true
        };

        state.users.push(user);
        saveUsers();

        // Simuler envoi email avec code
        console.log(`📧 CODE DE VÉRIFICATION pour ${email} : ${code}`);

        state.user = user;
        saveSession();
        closeAuth();
        applyUserSession();

        // Afficher la "notification" contenant le code (démo)
        pushNotification(user.id, 'system', '🎉 Bienvenue sur Phone Store',
            `Votre code de vérification est : ${code}. Entrez-le dans votre compte pour vérifier votre email.`);
        pushNotification(user.id, 'info', '💡 Astuce',
            'Complétez votre profil et publiez votre premier téléphone pour gagner en visibilité.');

        toast(`🎉 Bienvenue ${user.name.split(' ')[0]} !`, 'success');

        if (state.pendingAction) {
            const act = state.pendingAction;
            state.pendingAction = null;
            setTimeout(() => act(), 200);
        } else {
            switchView('compte');
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
        user.online = true;
        saveUsers();
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

    function resetPassword(e) {
        e.preventDefault();
        const email = prompt('Entrez votre email pour réinitialiser :');
        if (!email) return;
        const user = state.users.find(u => u.email === email.toLowerCase());
        if (!user) return toast('Aucun compte avec cet email', 'error');
        const newPass = prompt('Nouveau mot de passe (6 caractères min.) :');
        if (!newPass || newPass.length < 6) return toast('Mot de passe invalide', 'error');
        user.password = newPass;
        saveUsers();
        toast('✅ Mot de passe mis à jour', 'success');
    }

    function verifyEmail() {
        if (!state.user) return;
        const code = prompt('Entrez le code à 6 chiffres reçu :');
        if (!code) return;
        if (code === state.user.verificationCode) {
            state.user.verified = true;
            saveUsers();
            saveSession();
            applyUserSession();
            renderAccount();
            toast('✅ Email vérifié !', 'success');
            pushNotification(state.user.id, 'system', '✅ Compte vérifié', 'Votre email a été vérifié avec succès.');
        } else {
            toast('Code incorrect', 'error');
        }
    }

    function logout() {
        if (state.user) {
            state.user.online = false;
            saveUsers();
        }
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

            const sellLink = document.querySelector('[data-view="vendre"]');
            const buyLink = document.querySelector('[data-view="acheter"]');
            if (sellLink) sellLink.style.display = (state.user.role === 'client') ? 'none' : '';
            if (buyLink) buyLink.style.display = (state.user.role === 'vendeur') ? 'none' : '';
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
                if (state.user.role === 'client') toast('Votre compte est configuré comme acheteur', 'info');
                else switchView('vendre');
            }
        };
        toast('Connectez-vous pour continuer', 'info');
        openAuth('register');
    }

    // ============ Menu utilisateur ============

    function toggleUserMenu() { document.getElementById('userMenu').classList.toggle('active'); }
    function closeUserMenu() { document.getElementById('userMenu').classList.remove('active'); }
    function toggleMobileMenu() { document.querySelector('.nav-menu').classList.toggle('active'); }

    // ============ Navigation ============

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

        if (view === 'acheter') renderCatalog();
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

    // ============ Favoris ============

    function isFavorite(productId) {
        if (!state.user) return false;
        return state.favorites.some(f => f.userId === state.user.id && f.productId === productId);
    }

    function toggleFavorite(productId) {
        if (!state.user) {
            toast('Connectez-vous pour ajouter aux favoris', 'info');
            openAuth('login');
            return;
        }
        const idx = state.favorites.findIndex(f => f.userId === state.user.id && f.productId === productId);
        if (idx >= 0) {
            state.favorites.splice(idx, 1);
            toast('Retiré des favoris', 'info');
        } else {
            state.favorites.push({ userId: state.user.id, productId, ts: Date.now() });
            toast('❤️ Ajouté aux favoris', 'success');
        }
        saveFavs();
        updateBadges();
        if (state.currentView === 'acheter') renderCatalog();
        if (state.currentView === 'favoris') renderFavorites();
    }

    function renderFavorites() {
        const grid = document.getElementById('favGrid');
        if (!grid || !state.user) return;

        const favIds = state.favorites.filter(f => f.userId === state.user.id).map(f => f.productId);
        const list = state.products.filter(p => favIds.includes(p.id));

        if (list.length === 0) {
            grid.innerHTML = `<div class="empty-catalog" style="grid-column:1/-1;">
                <div class="empty-icon">💔</div>
                <h3>Aucun favori pour le moment</h3>
                <p>Ajoutez des téléphones à vos favoris en cliquant sur ❤️</p>
            </div>`;
            return;
        }
        renderProductGrid(grid, list);
    }

    // ============ Catalogue ============

    function getFilteredProducts() {
        let list = [...state.products];
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
        document.getElementById('resultsCount').textContent = 
            `${list.length} téléphone${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;

        if (list.length === 0) {
            grid.innerHTML = `<div class="empty-catalog">
                <div class="empty-icon">📭</div>
                <h3>Aucun téléphone disponible</h3>
                <p>Aucune annonce n'est publiée pour le moment.</p>
                ${state.user && state.user.role !== 'client'
                    ? `<button class="btn-primary" onclick="PhoneStore.switchView('vendre')">Publier une annonce</button>`
                    : `<button class="btn-primary" onclick="PhoneStore.openAuth('register')">Créer un compte</button>`}
            </div>`;
            return;
        }
        renderProductGrid(grid, list);
    }

    const brandEmojis = { Apple: '🍎', Samsung: '📱', Xiaomi: '⚡', Google: '🔍', OnePlus: '1️⃣', Huawei: '🌸', Oppo: '🟢', Autre: '📞' };

    function renderProductGrid(grid, list) {
        grid.innerHTML = list.map(p => {
            const seller = state.users.find(u => u.id === p.sellerId);
            const sellerName = seller ? seller.name : 'Utilisateur';
            const initial = sellerName.charAt(0).toUpperCase();
            const emoji = brandEmojis[p.brand] || '📱';
            const isMine = state.user && p.sellerId === state.user.id;
            const fav = isFavorite(p.id);

            const visual = p.image
                ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}">`
                : emoji;

            return `
                <div class="product-card">
                    <div class="product-visual">
                        <span class="product-condition-badge">${escapeHTML(p.condition)}</span>
                        <button class="btn-fav-card" onclick="PhoneStore.toggleFavorite('${p.id}')" title="Favori">${fav ? '❤️' : '🤍'}</button>
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

    let pendingImage = null;

    function previewImage(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';

        if (!file) { pendingImage = null; return; }
        if (file.size > 2 * 1024 * 1024) {
            toast('Image trop lourde (max 2 Mo)', 'error');
            e.target.value = '';
            pendingImage = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            pendingImage = ev.target.result;
            preview.innerHTML = `<img src="${ev.target.result}" alt="Aperçu">`;
        };
        reader.readAsDataURL(file);
    }

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
        if (!state.user.verified) {
            toast('Vérifiez votre email avant de publier', 'info');
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

        const product = {
            id: uid('p'),
            title, brand, price, condition, location, description,
            image: pendingImage,
            sellerId: state.user.id,
            createdAt: Date.now(),
            views: 0
        };

        state.products.unshift(product);
        saveProducts();

        document.getElementById('sellForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        pendingImage = null;

        renderMyListings();
        toast('✅ Annonce publiée', 'success');

        // Notifier tous les autres utilisateurs (démo locale)
        state.users.forEach(u => {
            if (u.id !== state.user.id) {
                pushNotification(u.id, 'new_product',
                    '📱 Nouvelle annonce',
                    `${state.user.name} a publié : ${title} · ${formatFCFA(price)}`);
            }
        });
    }

    function renderMyListings() {
        const container = document.getElementById('myListings');
        if (!container) return;

        if (!state.user) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>Connectez-vous.</p></div>`;
            return;
        }

        const mine = state.products.filter(p => p.sellerId === state.user.id);
        if (mine.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><p>Aucune annonce publiée.</p></div>`;
            return;
        }

        container.innerHTML = mine.map(p => {
            const img = p.image
                ? `<img src="${escapeHTML(p.image)}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
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

    // ============ Paiement ============

    function openPayment(productId) {
        if (!state.user) {
            toast('Connectez-vous pour acheter', 'info');
            openAuth('login');
            return;
        }
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        if (product.sellerId === state.user.id) {
            toast('Vous ne pouvez pas acheter votre propre annonce', 'info');
            return;
        }

        state.pendingPurchase = product;

        document.getElementById('paymentSubtitle').textContent = `Vous allez acheter : ${product.title}`;
        const fee = Math.round(product.price * 0.02);
        const total = product.price + fee;

        document.getElementById('paymentSummary').innerHTML = `
            <div class="payment-row"><span>Prix de l'article</span><strong>${formatFCFA(product.price)}</strong></div>
            <div class="payment-row"><span>Frais de service (2%)</span><strong>${formatFCFA(fee)}</strong></div>
            <div class="payment-row total"><span>Total à payer</span><strong>${formatFCFA(total)}</strong></div>
        `;

        document.getElementById('paymentOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePayment() {
        document.getElementById('paymentOverlay').classList.remove('active');
        document.body.style.overflow = '';
        state.pendingPurchase = null;
    }

    function confirmPayment() {
        const product = state.pendingPurchase;
        if (!product || !state.user) return;

        const method = document.querySelector('input[name="payMethod"]:checked').value;
        const methodLabels = { orange: 'Orange Money', mtn: 'MTN Mobile Money', wave: 'Wave', card: 'Carte bancaire' };

        // Simuler le paiement
        toast('💳 Traitement du paiement...', 'info');

        setTimeout(() => {
            closePayment();

            // Notifier l'acheteur
            pushNotification(state.user.id, 'payment',
                '✅ Paiement confirmé',
                `Votre achat de "${product.title}" (${formatFCFA(product.price)}) a été confirmé via ${methodLabels[method]}.`);

            // Notifier le vendeur
            pushNotification(product.sellerId, 'sale',
                '💰 Nouvelle vente !',
                `Vous avez vendu "${product.title}" à ${state.user.name} pour ${formatFCFA(product.price)}.`);

            // Ajouter dans les favoris automatiquement
            state.favorites.push({ userId: state.user.id, productId: product.id, ts: Date.now() });
            saveFavs();

            toast('✅ Paiement confirmé ! Le vendeur a été notifié.', 'success');
            updateBadges();
        }, 1500);
    }

    // ============ Messagerie ============

    function contactSeller(productId) {
        if (!state.user) {
            toast('Connectez-vous pour contacter', 'info');
            openAuth('login');
            return;
        }
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        if (product.sellerId === state.user.id) {
            toast('Vous ne pouvez pas vous contacter vous-même', 'info');
            return;
        }

        let conv = state.conversations.find(c =>
            c.participants.length === 2 &&
            c.participants.includes(state.user.id) &&
            c.participants.includes(product.sellerId) &&
            c.productId === productId);

        if (!conv) {
            conv = {
                id: uid('c'),
                participants: [state.user.id, product.sellerId],
                productId: product.id,
                productTitle: product.title,
                productPrice: product.price,
                messages: [{
                    id: uid('m'),
                    senderId: state.user.id,
                    text: `Bonjour, je suis intéressé(e) par "${product.title}" à ${formatFCFA(product.price)}.`,
                    ts: Date.now(),
                    readBy: [state.user.id]
                }],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            state.conversations.unshift(conv);
            saveConvs();

            pushNotification(product.sellerId, 'message',
                '💬 Nouveau message',
                `${state.user.name} vous a envoyé un message concernant "${product.title}".`);
        }

        state.activeConvId = conv.id;
        switchView('messages');
        setTimeout(() => openConversation(conv.id), 100);
    }

    const getOtherParticipant = (conv, meId) => {
        const otherId = conv.participants.find(p => p !== meId);
        return state.users.find(u => u.id === otherId);
    };

    const getConversationsForUser = () => !state.user ? [] :
        state.conversations.filter(c => c.participants.includes(state.user.id))
            .sort((a, b) => b.updatedAt - a.updatedAt);

    function renderConversations() {
        const list = document.getElementById('convList');
        if (!list) return;

        if (!state.user) {
            list.innerHTML = `<div class="empty-state" style="padding:40px 20px;"><div class="empty-icon">🔒</div><p>Connectez-vous.</p></div>`;
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
                    <p>Aucune conversation.</p>
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
        let changed = false;
        conv.messages.forEach(m => {
            if (m.senderId !== state.user.id && !m.readBy.includes(state.user.id)) {
                m.readBy.push(state.user.id);
                changed = true;
            }
        });
        if (changed) saveConvs();

        const other = getOtherParticipant(conv, state.user.id);

        document.getElementById('chatAvatar').textContent = other ? other.name.charAt(0).toUpperCase() : '?';
        document.getElementById('chatAvatar').style.background = 'var(--grad-1)';
        document.getElementById('chatAvatar').style.color = 'white';
        document.getElementById('chatName').textContent = other ? other.name : 'Utilisateur';
        document.getElementById('chatStatus').textContent = other && other.online ? '● En ligne' : '○ Hors ligne';

        renderChatMessages();

        const input = document.getElementById('chatInput');
        const btn = document.getElementById('sendBtn');
        input.disabled = false;
        btn.disabled = false;
        setTimeout(() => input.focus(), 100);

        renderConversations();
        updateBadges();
    }

    function renderChatMessages() {
        const body = document.getElementById('chatBody');
        const conv = state.conversations.find(c => c.id === state.activeConvId);

        if (!conv) {
            body.innerHTML = `<div class="chat-empty"><div class="chat-empty-icon">💬</div><p>Choisissez une conversation</p></div>`;
            return;
        }

        const html = [];
        if (conv.productTitle) {
            html.push(`<div class="msg-system">📱 ${escapeHTML(conv.productTitle)} · ${formatFCFA(conv.productPrice)}</div>`);
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
        saveConvs();

        // Notifier le destinataire
        const other = conv.participants.find(p => p !== state.user.id);
        if (other) {
            pushNotification(other, 'message', '💬 Nouveau message',
                `${state.user.name} : ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`);
        }

        input.value = '';
        renderChatMessages();
        renderConversations();
    }

    // ============ Notifications ============

    function renderNotifications() {
        const list = document.getElementById('notifsList');
        if (!list || !state.user) return;

        const mine = state.notifications.filter(n => n.recipientId === state.user.id);
        if (mine.length === 0) {
            list.innerHTML = `<div class="empty-catalog">
                <div class="empty-icon">🔔</div>
                <h3>Aucune notification</h3>
                <p>Vous serez notifié des nouvelles annonces et messages.</p>
            </div>`;
            return;
        }

        const icons = {
            message: '💬', new_product: '📱', sale: '💰',
            payment: '✅', system: '🎉', info: '💡'
        };

        list.innerHTML = mine.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}">
                <div class="notif-icon">${icons[n.type] || '🔔'}</div>
                <div class="notif-content">
                    <strong>${escapeHTML(n.title)}</strong>
                    <p>${escapeHTML(n.message)}</p>
                    <time>${timeAgo(n.ts)}</time>
                </div>
            </div>
        `).join('');

        // Marquer comme lues
        mine.forEach(n => n.read = true);
        saveNotifs();
        updateBadges();
    }

    function updateBadges() {
        // Messages non lus
        let unreadMsg = 0;
        if (state.user) {
            unreadMsg = state.conversations
                .filter(c => c.participants.includes(state.user.id))
                .reduce((s, c) => s + c.messages.filter(m =>
                    m.senderId !== state.user.id && !m.readBy.includes(state.user.id)).length, 0);
        }
        const msgBadge = document.getElementById('unreadBadge');
        if (msgBadge) {
            if (unreadMsg > 0) {
                msgBadge.textContent = unreadMsg > 99 ? '99+' : unreadMsg;
                msgBadge.style.display = 'inline-block';
            } else msgBadge.style.display = 'none';
        }

        // Favoris
        let favCount = 0;
        if (state.user) favCount = state.favorites.filter(f => f.userId === state.user.id).length;
        const favBadge = document.getElementById('favBadge');
        if (favBadge) {
            if (favCount > 0) {
                favBadge.textContent = favCount;
                favBadge.style.display = 'inline-block';
            } else favBadge.style.display = 'none';
        }

        // Notifications
        let unreadNotif = 0;
        if (state.user) unreadNotif = state.notifications.filter(n => n.recipientId === state.user.id && !n.read).length;
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            if (unreadNotif > 0) {
                notifBadge.textContent = unreadNotif > 99 ? '99+' : unreadNotif;
                notifBadge.style.display = 'inline-block';
            } else notifBadge.style.display = 'none';
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

        // Badge vérification
        const vBadge = document.getElementById('verifiedBadge');
        if (state.user.verified) {
            vBadge.innerHTML = `<div class="verified-badge">✅ Email vérifié</div>`;
        } else {
            vBadge.innerHTML = `<button class="btn-primary" style="margin-top:10px;font-size:13px;padding:8px 16px;" onclick="PhoneStore.verifyEmail()">Vérifier mon email</button>`;
        }

        document.getElementById('infoName').textContent = state.user.name;
        document.getElementById('infoEmail').textContent = state.user.email;
        document.getElementById('infoPhone').textContent = state.user.phone;
        document.getElementById('infoSince').textContent = new Date(state.user.since).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const myProducts = state.products.filter(p => p.sellerId === state.user.id);
        const myMessages = state.conversations
            .filter(c => c.participants.includes(state.user.id))
            .reduce((s, c) => s + c.messages.filter(m => m.senderId === state.user.id).length, 0);
        const myFavs = state.favorites.filter(f => f.userId === state.user.id).length;

        document.getElementById('statListings').textContent = myProducts.length;
        document.getElementById('statMessages').textContent = myMessages;
        document.getElementById('statFavorites').textContent = myFavs;
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
        el.textContent = message;
        el.className = 'toast show ' + type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
    }

    // ============ PWA ============

    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }

    // ============ Init ============

    function init() {
        loadAll();
        applyTheme();
        applyUserSession();
        initTopBar();

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
                t = setTimeout(() => {
                    state.filters.search = sanitize(e.target.value, 80).toLowerCase();
                    renderCatalog();
                }, 180);
            });
        }

        const cs = document.getElementById('convSearch');
        if (cs) cs.addEventListener('input', renderConversations);

        animateCounters();
        state.users.forEach(u => u.online = Math.random() > 0.5);

        // Init badge
        updateBadges();

        registerSW();
    }

    // ============ API publique ============

    window.PhoneStore = {
        switchView, navTo, goHome, toggleMobileMenu,
        openAuth, closeAuth, switchAuthTab, handleLogin, handleRegister,
        logout, toggleUserMenu, requireAuth, resetPassword, verifyEmail,
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
