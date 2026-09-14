/* ============================================
   Phone Store — Design pro
   Créé par Waze Studio — 2025
   ============================================ */

:root {
    --primary: #0a66c2;
    --primary-dark: #084a91;
    --primary-light: #e7f3ff;
    --accent: #f7b928;
    --bg: #f7f9fc;
    --white: #ffffff;
    --text: #0d1117;
    --text-muted: #65676b;
    --border: #e4e6eb;
    --danger: #e41e3f;
    --success: #31a24c;
    --gradient-1: linear-gradient(135deg, #0a66c2 0%, #0a3d7a 100%);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.12);
    --radius: 16px;
    --radius-sm: 10px;
    --radius-lg: 24px;
    --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    --navbar-height: 70px;
}

* { margin: 0; padding: 0; box-sizing: border-box;
    font-family: 'Segoe UI', 'Inter', Roboto, -apple-system, sans-serif; }

html { scroll-behavior: smooth; }

body {
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    padding-top: var(--navbar-height);
}

/* ============ VUES ============ */
.view { display: none; animation: fadeIn 0.35s ease; }
.view.active { display: block; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ============ NAVBAR ============ */
.navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--navbar-height);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 1px solid var(--border);
    z-index: 1000;
}

.nav-container {
    max-width: 1400px;
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    position: relative;
}

.logo {
    display: flex; align-items: center; gap: 8px;
    text-decoration: none; font-size: 22px; font-weight: 700;
    color: var(--primary); flex-shrink: 0;
    cursor: pointer;
}

.logo-text strong { color: var(--text); }
.logo-icon { font-size: 26px; }

.nav-menu {
    display: flex; gap: 4px; align-items: center; flex: 1;
    justify-content: center;
}

.nav-link {
    text-decoration: none;
    color: var(--text-muted);
    font-size: 15px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 10px;
    transition: all var(--transition);
    display: flex; align-items: center; gap: 6px;
    cursor: pointer;
    position: relative;
    white-space: nowrap;
}

.nav-link:hover, .nav-link.active {
    color: var(--primary);
    background: var(--primary-light);
}

.badge-count {
    background: var(--danger);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 50px;
    min-width: 20px;
    text-align: center;
}

.nav-actions {
    display: flex; gap: 10px; align-items: center; flex-shrink: 0;
}

.nav-btn {
    background: transparent; border: none;
    cursor: pointer; padding: 6px;
    border-radius: 50%;
    transition: background var(--transition);
    display: flex; align-items: center; justify-content: center;
}

.nav-btn:hover { background: var(--bg); }

.user-avatar-nav {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--gradient-1);
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
}

.menu-toggle {
    display: none; background: transparent; border: none;
    font-size: 24px; cursor: pointer; padding: 6px 12px;
    border-radius: 8px;
}

/* Menu utilisateur */
.user-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 24px;
    background: var(--white);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    width: 260px;
    padding: 8px;
    display: none;
    animation: slideDown 0.2s ease;
    z-index: 1100;
}

.user-menu.active { display: block; }

@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.user-menu-header {
    display: flex; gap: 12px; align-items: center;
    padding: 12px;
}

.user-avatar-large {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--gradient-1);
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
}

.user-menu-header strong {
    display: block; font-size: 15px; color: var(--text);
}

.user-menu-header span {
    font-size: 13px; color: var(--text-muted);
}

.user-menu hr {
    border: none; border-top: 1px solid var(--border);
    margin: 8px 0;
}

.user-menu-item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 10px 12px;
    font-size: 14px;
    cursor: pointer;
    border-radius: 8px;
    transition: background var(--transition);
    color: var(--text);
    font-weight: 500;
}

.user-menu-item:hover { background: var(--bg); }

/* ============ BOUTONS ============ */
.btn-primary {
    background: var(--gradient-1);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px 20px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: 0 2px 8px rgba(10, 102, 194, 0.25);
    white-space: nowrap;
}

.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(10, 102, 194, 0.35); }

.btn-secondary {
    background: var(--white);
    color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 20px;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    transition: all var(--transition);
}

.btn-secondary:hover { border-color: var(--primary); color: var(--primary); }

.full-width { width: 100%; }

.icon-btn {
    background: transparent; border: none;
    font-size: 18px; cursor: pointer; padding: 6px 10px;
    border-radius: 8px; transition: background var(--transition);
    color: var(--text-muted);
}

.icon-btn:hover { background: var(--bg); color: var(--primary); }

/* ============ HERO ============ */
.hero {
    position: relative;
    min-height: calc(100vh - var(--navbar-height));
    display: flex; align-items: center; justify-content: center;
    padding: 60px 24px;
    text-align: center;
    overflow: hidden;
}

.hero-bg {
    position: absolute; inset: 0;
    background: 
        radial-gradient(circle at 20% 30%, rgba(10, 102, 194, 0.15), transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(102, 126, 234, 0.12), transparent 50%),
        linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
    z-index: -1;
}

.hero-bg::after {
    content: '';
    position: absolute; inset: 0;
    background-image: 
        linear-gradient(rgba(10, 102, 194, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(10, 102, 194, 0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}

.hero-content { max-width: 900px; animation: fadeInUp 0.9s ease; }

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}

.hero-badge {
    display: inline-block;
    background: white;
    color: var(--primary);
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--primary-light);
    margin-bottom: 28px;
}

.hero-title {
    font-size: clamp(2.2rem, 5.5vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -1.5px;
    margin-bottom: 24px;
}

.gradient-text {
    background: linear-gradient(135deg, #0a66c2 0%, #667eea 50%, #764ba2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero-subtitle {
    font-size: clamp(1rem, 1.6vw, 1.2rem);
    color: var(--text-muted);
    max-width: 700px;
    margin: 0 auto 40px;
}

.hero-actions {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
    margin-bottom: 60px;
}

.btn-hero-primary {
    background: var(--gradient-1);
    color: white; border: none;
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 16px; font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: 0 20px 50px rgba(10, 102, 194, 0.25);
}

.btn-hero-primary:hover { transform: translateY(-3px); }

.btn-hero-secondary {
    background: white;
    color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 16px 32px;
    font-size: 16px; font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
}

.btn-hero-secondary:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-3px); }

.hero-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px;
    max-width: 850px; margin: 0 auto;
    padding: 32px 20px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: var(--shadow-md);
}

.stat { text-align: center; }

.stat-value {
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 800;
    color: var(--primary);
    line-height: 1;
    margin-bottom: 6px;
}

.stat-label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
}

/* ============ TRUST BAR ============ */
.trust-bar {
    background: white;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 20px 24px;
}

.trust-container {
    max-width: 1280px; margin: 0 auto;
    display: flex; justify-content: space-around;
    align-items: center; flex-wrap: wrap; gap: 20px;
}

.trust-item {
    display: flex; align-items: center; gap: 10px;
    color: var(--text-muted);
    font-size: 14px; font-weight: 500;
}

.trust-icon { font-size: 20px; }

/* ============ SECTIONS ============ */
.section { padding: 90px 24px; }
.section-container { max-width: 1280px; margin: 0 auto; }

.section-header {
    text-align: center;
    max-width: 720px;
    margin: 0 auto 50px;
}

.section-tag {
    display: inline-block;
    background: var(--primary-light);
    color: var(--primary);
    padding: 7px 18px;
    border-radius: 50px;
    font-size: 13px; font-weight: 600;
    margin-bottom: 16px;
}

.section-title {
    font-size: clamp(1.8rem, 3.8vw, 2.6rem);
    font-weight: 800;
    letter-spacing: -0.8px;
    line-height: 1.15;
    margin-bottom: 14px;
}

.section-desc {
    font-size: 16px;
    color: var(--text-muted);
}

/* ============ SERVICES (accueil) ============ */
.services-section { background: white; }
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 22px;
}

.service-card {
    background: var(--bg);
    border-radius: var(--radius);
    padding: 34px 28px;
    transition: all var(--transition);
    border: 1px solid var(--border);
    cursor: pointer;
    position: relative;
}

.service-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
    background: white;
    border-color: var(--primary);
}

.service-icon { font-size: 40px; margin-bottom: 18px; display: block; }
.service-card h3 { font-size: 19px; font-weight: 700; margin-bottom: 10px; }
.service-card p { color: var(--text-muted); font-size: 15px; margin-bottom: 14px; }

.service-link {
    color: var(--primary);
    font-weight: 600;
    font-size: 14px;
    display: inline-block;
    transition: transform var(--transition);
}

.service-card:hover .service-link { transform: translateX(5px); }

/* ============ MARQUES ============ */
.brands-section { background: var(--bg); }

.brands-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 18px;
}

.brand-card {
    background: white;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 26px 20px;
    text-align: center;
    transition: all var(--transition);
    cursor: pointer;
}

.brand-card:hover {
    transform: translateY(-6px);
    border-color: var(--primary);
    box-shadow: var(--shadow-lg);
}

.brand-logo { font-size: 44px; margin-bottom: 12px; }
.brand-card h3 { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
.brand-card p { font-size: 13px; color: var(--text-muted); }

/* ============ CTA FINAL ============ */
.cta-final {
    background: var(--gradient-1);
    padding: 80px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.cta-final::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 50%);
}

.cta-content { position: relative; max-width: 700px; margin: 0 auto; }
.cta-content h2 { font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 800; color: white; margin-bottom: 14px; }
.cta-content p { font-size: 17px; color: rgba(255,255,255,0.9); margin-bottom: 30px; }

.btn-cta {
    background: white; color: var(--primary);
    border: none; border-radius: 12px;
    padding: 16px 36px; font-size: 16px; font-weight: 700;
    cursor: pointer; transition: all var(--transition);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.btn-cta:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,0,0,0.3); }

/* ============ BOUTIQUE (clients) ============ */
.container {
    max-width: 1400px;
    margin: 24px auto;
    padding: 0 24px;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
}

.sidebar {
    background: white;
    border-radius: var(--radius);
    padding: 22px;
    box-shadow: var(--shadow-sm);
    height: fit-content;
    position: sticky;
    top: calc(var(--navbar-height) + 20px);
}

.sidebar h3 {
    font-size: 17px; margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
}

.filter-group { margin-bottom: 18px; }

.filter-group > label {
    display: block; font-weight: 600;
    margin-bottom: 8px; font-size: 14px;
}

.filter-group select,
.filter-group input[type="number"] {
    width: 100%; padding: 9px 12px;
    border: 1px solid #ccd0d5;
    border-radius: var(--radius-sm);
    font-size: 14px; background: white;
    transition: border-color var(--transition);
}

.filter-group select:focus,
.filter-group input:focus { outline: none; border-color: var(--primary); }

.checkbox-label {
    display: flex !important;
    align-items: center; gap: 8px;
    font-weight: normal !important;
    font-size: 14px; margin-bottom: 6px;
    cursor: pointer; color: var(--text-muted);
}

.price-range { display: flex; gap: 8px; align-items: center; }
.price-range input { width: 45%; }
.price-range span { color: var(--text-muted); }

.main-content { min-width: 0; }

.listings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
}

.listings-header h2 { font-size: 20px; }

.search-bar-inline {
    flex: 1;
    max-width: 300px;
}

.search-bar-inline input {
    width: 100%; padding: 9px 14px;
    border: 1px solid #ccd0d5;
    border-radius: 20px;
    font-size: 14px; background: white;
    transition: border-color var(--transition);
}

.search-bar-inline input:focus { outline: none; border-color: var(--primary); }

.listings-header select {
    padding: 9px 14px;
    border: 1px solid #ccd0d5;
    border-radius: var(--radius-sm);
    font-size: 14px; background: white;
    cursor: pointer;
}

.listings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 18px;
}

.card {
    background: white;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition);
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
}

.card-img {
    height: 170px;
    background: linear-gradient(135deg, #e7f3ff, #d3e7ff);
    display: flex; align-items: center; justify-content: center;
    font-size: 60px;
}

.card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }

.card-price {
    font-size: 20px; font-weight: 800;
    color: var(--primary); margin-bottom: 4px;
}

.card-title {
    font-size: 15px; font-weight: 600;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.3;
    min-height: 2.6em;
}

.card-location {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 10px;
}

.card-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid var(--border);
}

.btn-buy {
    flex: 1;
    background: var(--gradient-1);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
}

.btn-buy:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(10, 102, 194, 0.3); }

.btn-contact {
    background: var(--primary-light);
    color: var(--primary);
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
}

.btn-contact:hover { background: #d3e7ff; }

/* ============ DASHBOARD VENDEUR ============ */
.dashboard {
    max-width: 1400px;
    margin: 24px auto;
    padding: 0 24px;
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
}

.dashboard-header h1 {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 4px;
}

.dashboard-header p { color: var(--text-muted); font-size: 15px; }

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
    margin-bottom: 30px;
}

.kpi-card {
    background: white;
    border-radius: var(--radius);
    padding: 22px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition);
    border: 1px solid var(--border);
}

.kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary);
}

.kpi-icon {
    font-size: 32px;
    width: 56px; height: 56px;
    display: flex; align-items: center; justify-content: center;
    background: var(--primary-light);
    border-radius: 14px;
    flex-shrink: 0;
}

.kpi-info { display: flex; flex-direction: column; }
.kpi-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
.kpi-value { font-size: 24px; font-weight: 800; color: var(--text); line-height: 1.2; }

.dashboard-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
}

.tab-btn {
    background: transparent;
    border: none;
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all var(--transition);
    white-space: nowrap;
}

.tab-btn:hover { color: var(--primary); }

.tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
}

.tab-content { display: none; animation: fadeIn 0.3s ease; }
.tab-content.active { display: block; }

.table-wrapper {
    background: white;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
}

.data-table th {
    background: var(--bg);
    padding: 14px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-bottom: 1px solid var(--border);
}

.data-table td {
    padding: 14px 16px;
    font-size: 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
}

.data-table tbody tr:last-child td { border-bottom: none; }

.data-table tbody tr:hover { background: var(--bg); }

.status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
}

.status-success { background: rgba(49,162,76,0.12); color: var(--success); }
.status-warning { background: rgba(247,185,40,0.15); color: #b07b00; }
.status-info { background: var(--primary-light); color: var(--primary); }
.status-danger { background: rgba(228,30,63,0.1); color: var(--danger); }

.btn-table {
    background: var(--primary-light);
    color: var(--primary);
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--transition);
}

.btn-table:hover { background: #cfe3fc; }

.btn-table.danger {
    background: rgba(228,30,63,0.1);
    color: var(--danger);
}

.btn-table.danger:hover { background: rgba(228,30,63,0.2); }

/* ============ MESSENGER ============ */
.messenger {
    display: grid;
    grid-template-columns: 340px 1fr;
    height: calc(100vh - var(--navbar-height) - 24px);
    max-width: 1400px;
    margin: 12px auto;
    background: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

.messenger-sidebar {
    background: white;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.messenger-header {
    padding: 18px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
}

.messenger-header h2 {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.3px;
}

.messenger-search {
    padding: 12px 16px;
}

.messenger-search input {
    width: 100%;
    padding: 10px 14px;
    border: none;
    border-radius: 20px;
    background: var(--bg);
    font-size: 14px;
    outline: none;
    transition: all var(--transition);
}

.messenger-search input:focus {
    background: white;
    box-shadow: 0 0 0 2px var(--primary-light);
}

.conversations {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.conv-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: background var(--transition);
    align-items: center;
    position: relative;
}

.conv-item:hover { background: var(--bg); }

.conv-item.active { background: var(--primary-light); }

.conv-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 18px;
    flex-shrink: 0;
    position: relative;
}

.conv-avatar.online::after {
    content: '';
    position: absolute;
    bottom: 2px; right: 2px;
    width: 12px; height: 12px;
    background: var(--success);
    border: 2px solid white;
    border-radius: 50%;
}

.conv-info {
    flex: 1;
    min-width: 0;
}

.conv-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    margin-bottom: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.conv-name span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.conv-time {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
    flex-shrink: 0;
}

.conv-preview {
    font-size: 13px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.conv-preview-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.conv-unread {
    background: var(--primary);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 50px;
    min-width: 18px;
    text-align: center;
    flex-shrink: 0;
}

/* Chat */
.messenger-chat {
    display: flex;
    flex-direction: column;
    background: #fbfcfe;
    min-width: 0;
}

.chat-header {
    padding: 14px 20px;
    background: white;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    min-height: 68px;
}

.chat-user {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chat-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--bg);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    flex-shrink: 0;
}

.chat-user strong {
    display: block;
    font-size: 15px;
    color: var(--text);
}

.chat-status {
    font-size: 12px;
    color: var(--success);
    font-weight: 500;
}

.chat-status.offline { color: var(--text-muted); }

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    gap: 12px;
}

.chat-empty-icon { font-size: 60px; opacity: 0.4; }

.chat-empty p { font-size: 15px; }

.message {
    max-width: 70%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.45;
    word-wrap: break-word;
    animation: messageIn 0.25s ease;
    position: relative;
}

@keyframes messageIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}

.message.received {
    background: white;
    color: var(--text);
    align-self: flex-start;
    border-bottom-left-radius: 6px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.message.sent {
    background: var(--gradient-1);
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 6px;
}

.message-time {
    display: block;
    font-size: 11px;
    margin-top: 4px;
    opacity: 0.7;
}

.message-date-separator {
    text-align: center;
    font-size: 12px;
    color: var(--text-muted);
    margin: 12px 0;
    font-weight: 500;
}

.typing-indicator {
    align-self: flex-start;
    background: white;
    padding: 12px 16px;
    border-radius: 18px;
    border-bottom-left-radius: 6px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    display: flex;
    gap: 4px;
    align-items: center;
}

.typing-dot {
    width: 6px; height: 6px;
    background: var(--text-muted);
    border-radius: 50%;
    animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-5px); opacity: 1; }
}

.chat-input-bar {
    padding: 12px 20px;
    background: white;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
}

.chat-input-bar input {
    flex: 1;
    padding: 12px 18px;
    border: none;
    border-radius: 22px;
    background: var(--bg);
    font-size: 14px;
    outline: none;
    transition: all var(--transition);
}

.chat-input-bar input:focus {
    background: white;
    box-shadow: 0 0 0 2px var(--primary-light);
}

.chat-input-bar input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-send {
    background: var(--gradient-1);
    color: white;
    border: none;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: all var(--transition);
    flex-shrink: 0;
}

.btn-send:hover:not(:disabled) { transform: scale(1.08); }

.btn-send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* ============ MODAL ============ */
.modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(13, 17, 23, 0.65);
    backdrop-filter: blur(6px);
    z-index: 2000;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.modal-overlay.active { display: flex; }

.modal {
    background: white;
    border-radius: var(--radius-lg);
    max-width: 520px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 32px;
    position: relative;
    animation: slideUp 0.3s ease;
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
}

@keyframes slideUp {
    from { transform: translateY(30px) scale(0.96); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
}

.modal-close {
    position: absolute;
    top: 14px; right: 18px;
    background: none; border: none;
    font-size: 28px; cursor: pointer;
    color: var(--text-muted);
    padding: 4px 10px; border-radius: 8px;
    transition: background var(--transition);
}

.modal-close:hover { background: var(--bg); }

.modal h2 {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 6px;
    letter-spacing: -0.3px;
}

.modal-desc {
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 22px;
}

.form-group { margin-bottom: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.form-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
    font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 15px;
    font-family: inherit;
    transition: all var(--transition);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(10, 102, 194, 0.1);
}

.form-group textarea {
    resize: vertical;
    min-height: 90px;
}

.modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
}

/* ============ TOAST ============ */
.toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(120px);
    background: var(--text);
    color: white;
    padding: 14px 26px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: var(--shadow-lg);
    opacity: 0;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 3000;
    pointer-events: none;
    max-width: 90vw;
    text-align: center;
}

.toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
.toast.success { background: var(--success); }
.toast.error { background: var(--danger); }

/* ============ RESPONSIVE ============ */
@media (max-width: 992px) {
    .nav-menu {
        display: none;
        position: absolute;
        top: 100%; left: 0; right: 0;
        background: white;
        flex-direction: column;
        padding: 16px;
        box-shadow: var(--shadow-lg);
        border-bottom: 1px solid var(--border);
        gap: 6px;
    }

    .nav-menu.active { display: flex; }
    .menu-toggle { display: block; }

    .container { grid-template-columns: 1fr; }
    .sidebar { position: static; }

    .messenger {
        grid-template-columns: 280px 1fr;
        height: calc(100vh - var(--navbar-height) - 12px);
        margin: 6px;
        border-radius: 12px;
    }

    .messenger-sidebar.conversations-hidden {
        display: none;
    }

    .form-row { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
    .messenger {
        grid-template-columns: 1fr;
    }

    .messenger-chat.hidden-mobile {
        display: none;
    }

    .messenger-sidebar.hidden-mobile {
        display: none;
    }
}

@media (max-width: 640px) {
    .nav-container { padding: 0 16px; }
    .logo { font-size: 18px; }
    .logo-icon { font-size: 22px; }
    .btn-primary { padding: 8px 14px; font-size: 13px; }

    .section { padding: 60px 20px; }
    .hero { min-height: auto; padding: 50px 20px; }
    .hero-stats { padding: 22px 14px; gap: 14px; }

    .listings-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
    .card-img { height: 140px; font-size: 46px; }

    .dashboard { padding: 0 16px; margin: 16px auto; }
    .dashboard-header h1 { font-size: 22px; }

    .kpi-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
    .kpi-card { padding: 16px; gap: 12px; }
    .kpi-icon { width: 44px; height: 44px; font-size: 24px; }
    .kpi-value { font-size: 19px; }

    .messenger-header { padding: 14px; }
    .messenger-header h2 { font-size: 17px; }
    .chat-messages { padding: 14px; }
    .message { max-width: 85%; }
}
