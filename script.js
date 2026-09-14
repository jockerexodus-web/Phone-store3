/* ============================================
   Phone Store — Logique applicative
   Créé par Waze Studio
   Sécurité renforcée : échappement HTML,
   validation des entrées, sanitisation.
   ============================================ */

(function () {
    'use strict';

    // ============ Utilitaires sécurité ============

    /**
     * Échappe les caractères HTML pour prévenir les injections XSS.
     */
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Nettoie et limite la longueur d'une chaîne.
     */
    function sanitize(str, maxLength = 200) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/\s+/g, ' ').slice(0, maxLength);
    }

    /**
     * Valide un prix (nombre entier positif).
     */
    function validatePrice(value) {
        const num = Number(value);
        if (!Number.isFinite(num) || num < 0 || num > 10000) return null;
        return Math.round(num);
    }

    /**
     * Génère un identifiant unique sécurisé.
     */
    function generateId() {
        return 'ps_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    }

    // ============ Constantes ============

    const STORAGE_KEY = 'phoneStore_listings_v1';
    const MAX_LISTINGS = 500;

    const BRAND_EMOJIS = {
        Apple: '🍎',
        Samsung: '📱',
        Xiaomi: '⚡',
        Google: '🔍',
        OnePlus: '1️⃣',
        Huawei: '🌸',
        Autre: '📞'
    };

    const AVATAR_COLORS = ['#0a66c2', '#e41e3f', '#31a24c', '#f7b928', '#8854d0', '#fa8231'];

    const VALID_CONDITIONS = ['Neuf', 'Comme neuf', 'Bon état', 'Correct'];
    const VALID_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Google', 'OnePlus', 'Huawei', 'Autre'];

    // ============ Données par défaut ============

    const DEFAULT_LISTINGS = [
        { id: 'ps_demo01', title: 'iPhone 13 Pro 256Go — Graphite', brand: 'Apple', price: 650, condition: 'Comme neuf', location: 'Paris, 75011', seller: 'Alex M.', description: 'Excellent état, boîte et câble inclus.', date: '2025-01-15', favorite: false },
        { id: 'ps_demo02', title: 'Samsung Galaxy S22 Ultra 128Go', brand: 'Samsung', price: 480, condition: 'Bon état', location: 'Lyon, 69003', seller: 'Sophie L.', description: 'Quelques micro-rayures, fonctionne parfaitement.', date: '2025-01-14', favorite: false },
        { id: 'ps_demo03', title: 'Xiaomi Redmi Note 12 — 128Go', brand: 'Xiaomi', price: 150, condition: 'Neuf', location: 'Marseille, 13001', seller: 'Karim B.', description: 'Sous blister, jamais ouvert.', date: '2025-01-13', favorite: false },
        { id: 'ps_demo04', title: 'Google Pixel 7 Pro 256Go', brand: 'Google', price: 420, condition: 'Comme neuf', location: 'Toulouse, 31000', seller: 'Emma D.', description: 'Acheté il y a 6 mois, garantie constructeur.', date: '2025-01-12', favorite: false },
        { id: 'ps_demo05', title: 'OnePlus 11 5G 256Go', brand: 'OnePlus', price: 380, condition: 'Bon état', location: 'Bordeaux, 33000', seller: 'Lucas P.', description: 'Chargeur rapide inclus.', date: '2025-01-11', favorite: false },
        { id: 'ps_demo06', title: 'iPhone 12 128Go — Bleu', brand: 'Apple', price: 350, condition: 'Bon état', location: 'Lille, 59000', seller: 'Marie C.', description: 'Batterie 89%, aucun défaut.', date: '2025-01-10', favorite: false },
        { id: 'ps_demo07', title: 'Samsung Galaxy A54 5G 128Go', brand: 'Samsung', price: 220, condition: 'Comme neuf', location: 'Nantes, 44000', seller: 'Thomas R.', description: 'Sous garantie jusqu\'en 2026.', date: '2025-01-09', favorite: false },
        { id: 'ps_demo08', title: 'Huawei P60 Pro 256Go', brand: 'Huawei', price: 400, condition: 'Comme neuf', location: 'Strasbourg, 67000', seller: 'Nadia K.', description: 'Écran impeccable, double SIM.', date: '2025-01-08', favorite: false }
    ];

    // ============ État ============

    let listings = [];
    let filters = {
        search: '',
        brand: '',
        minPrice: null,
        maxPrice: null,
        conditions: [],
        sort: 'recent'
    };
    let showFavoritesOnly = false;

    // ============ Persistance sécurisée ============

    function loadListings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    listings = parsed.filter(isValidListing);
                    return;
                }
            }
        } catch (e) {
            console.warn('Erreur chargement localStorage :', e);
        }
        listings = DEFAULT_LISTINGS.map(l => ({ ...l }));
    }

    function saveListings() {
        try {
            // On ne garde que les 500 dernières annonces
            const toSave = listings.slice(0, MAX_LISTINGS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn('Erreur sauvegarde localStorage :', e);
        }
    }

    function isValidListing(l) {
        return l
            && typeof l.id === 'string'
            && typeof l.title === 'string'
            && typeof l.brand === 'string'
            && typeof l.price === 'number'
            && typeof l.condition === 'string'
            && typeof l.location === 'string';
    }

    // ============ Filtres ============

    function getFilteredListings() {
        let result = [...listings];

        if (showFavoritesOnly) {
            result = result.filter(l => l.favorite);
        }

        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(l =>
                l.title.toLowerCase().includes(q) ||
                l.brand.toLowerCase().includes(q) ||
                l.location.toLowerCase().includes(q)
            );
        }

        if (filters.brand) {
            result = result.filter(l => l.brand === filters.brand);
        }

        if (filters.minPrice !== null) {
            result = result.filter(l => l.price >= filters.minPrice);
        }

        if (filters.maxPrice !== null) {
            result = result.filter(l => l.price <= filters.maxPrice);
        }

        if (filters.conditions.length > 0) {
            result = result.filter(l => filters.conditions.includes(l.condition));
        }

        switch (filters.sort) {
            case 'price-asc': result.sort((a, b) => a.price - b.price); break;
            case 'price-desc': result.sort((a, b) => b.price - a.price); break;
            default: result.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return result;
    }

    function applyFilters() {
        filters.brand = document.getElementById('brandFilter').value;
        const minVal = document.getElementById('minPrice').value;
        const maxVal = document.getElementById('maxPrice').value;
        filters.minPrice = minVal !== '' ? validatePrice(minVal) : null;
        filters.maxPrice = maxVal !== '' ? validatePrice(maxVal) : null;
        filters.sort = document.getElementById('sortFilter').value;

        filters.conditions = Array.from(document.querySelectorAll('.conditionFilter:checked'))
            .map(cb => cb.value)
            .filter(v => VALID_CONDITIONS.includes(v));

        renderListings();
    }

    function resetFilters() {
        document.getElementById('brandFilter').value = '';
        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('sortFilter').value = 'recent';
        document.getElementById('searchInput').value = '';
        document.querySelectorAll('.conditionFilter').forEach(cb => cb.checked = false);

        filters = { search: '', brand: '', minPrice: null, maxPrice: null, conditions: [], sort: 'recent' };
        showFavoritesOnly = false;

        renderListings();
        showToast('Filtres réinitialisés', 'success');
    }

    // ============ Rendu ============

    function renderListings() {
        const grid = document.getElementById('listingsGrid');
        const filtered = getFilteredListings();

        const countEl = document.getElementById('resultsCount');
        countEl.textContent = showFavoritesOnly
            ? `Mes favoris (${filtered.length})`
            : `${filtered.length} annonce${filtered.length > 1 ? 's' : ''}`;

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-message">😕 Aucune annonce ne correspond à vos critères.<br>Essayez de modifier vos filtres.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(listing => {
            const safeTitle = escapeHTML(listing.title);
            const safeLocation = escapeHTML(listing.location);
            const safeSeller = escapeHTML(listing.seller);
            const safeCondition = escapeHTML(listing.condition);
            const initial = safeSeller.charAt(0).toUpperCase() || '?';
            const color = AVATAR_COLORS[(safeSeller.charCodeAt(0) || 0) % AVATAR_COLORS.length];
            const emoji = BRAND_EMOJIS[listing.brand] || '📱';
            const favClass = listing.favorite ? 'active' : '';
            const favIcon = listing.favorite ? '❤️' : '🤍';

            return `
                <article class="card" role="listitem" data-id="${escapeHTML(listing.id)}">
                    <button class="favorite-btn ${favClass}" 
                            onclick="PhoneStore.toggleFavorite('${escapeHTML(listing.id)}', event)"
                            aria-label="Ajouter aux favoris">${favIcon}</button>
                    <div class="card-img" aria-hidden="true">${emoji}</div>
                    <div class="card-body">
                        <div class="card-price">${listing.price} €</div>
                        <h3 class="card-title">${safeTitle}</h3>
                        <div class="card-location">📍 ${safeLocation}</div>
                        <div class="card-meta">
                            <div class="seller">
                                <div class="seller-avatar" style="background:${color}">${initial}</div>
                                <span>${safeSeller}</span>
                            </div>
                            <span class="badge">${safeCondition}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    // ============ Actions ============

    function toggleFavorite(id, event) {
        if (event) event.stopPropagation();
        const listing = listings.find(l => l.id === id);
        if (!listing) return;
        listing.favorite = !listing.favorite;
        saveListings();
        renderListings();
        showToast(listing.favorite ? 'Ajouté aux favoris ❤️' : 'Retiré des favoris', 'success');
    }

    function toggleFavoritesView() {
        showFavoritesOnly = !showFavoritesOnly;
        renderListings();
        showToast(showFavoritesOnly ? 'Affichage des favoris' : 'Affichage de toutes les annonces', 'success');
    }

    function scrollToListings() {
        document.getElementById('listingsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function openModal() {
        document.getElementById('modalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('title').focus(), 100);
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('sellForm').reset();
    }

    function addListing(event) {
        event.preventDefault();

        // Récupération + sanitisation
        const title = sanitize(document.getElementById('title').value, 100);
        const brand = document.getElementById('brand').value;
        const price = validatePrice(document.getElementById('price').value);
        const condition = document.getElementById('condition').value;
        const location = sanitize(document.getElementById('location').value, 60);
        const description = sanitize(document.getElementById('description').value, 500);

        // Validation
        if (!title || title.length < 3) {
            showToast('Titre invalide (3 caractères min.)', 'error');
            return;
        }
        if (!VALID_BRANDS.includes(brand)) {
            showToast('Marque invalide', 'error');
            return;
        }
        if (price === null || price <= 0) {
            showToast('Prix invalide', 'error');
            return;
        }
        if (!VALID_CONDITIONS.includes(condition)) {
            showToast('État invalide', 'error');
            return;
        }
        if (!location) {
            showToast('Localisation requise', 'error');
            return;
        }

        const newListing = {
            id: generateId(),
            title,
            brand,
            price,
            condition,
            location,
            seller: 'Vous',
            description,
            date: new Date().toISOString().split('T')[0],
            favorite: false
        };

        listings.unshift(newListing);

        // Limite de sécurité
        if (listings.length > MAX_LISTINGS) {
            listings = listings.slice(0, MAX_LISTINGS);
        }

        saveListings();
        closeModal();
        renderListings();
        showToast('✅ Annonce publiée avec succès !', 'success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============ Toast ============

    let toastTimer = null;
    function showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }

    // ============ Initialisation ============

    function init() {
        loadListings();
        renderListings();

        // Recherche en temps réel (debounce)
        let searchTimer = null;
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                filters.search = sanitize(e.target.value, 80).toLowerCase();
                renderListings();
            }, 200);
        });

        // Fermer modal en cliquant sur overlay
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    // ============ API publique ============

    window.PhoneStore = {
        applyFilters,
        resetFilters,
        toggleFavorite,
        toggleFavoritesView,
        scrollToListings,
        openModal,
        closeModal,
        addListing
    };

    // Démarrage
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
