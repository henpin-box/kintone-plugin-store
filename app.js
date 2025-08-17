// Kintoneミニプラグイン販売サイト - メインスクリプト

// グローバル変数
let currentLang = 'ja';
let currentCurrency = 'jpy';
let translations = {};
let products = [];

// 翻訳データをロード
async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
    } catch (error) {
        console.error('翻訳データの読み込みに失敗しました:', error);
        // フォールバック用のデフォルト翻訳
        translations = {
            ja: { site: { title: 'Kintone向けミニプラグイン' } },
            en: { site: { title: 'Kintone Mini Plugins' } }
        };
    }
}

// 商品データをロードして表示
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        products = await response.json();
        
        displayProducts(products);
        hideLoading();
        
    } catch (error) {
        console.error('商品データの読み込みに失敗しました:', error);
        showError();
        hideLoading();
    }
}

// 商品一覧を表示
function displayProducts(products) {
    const gridContainer = document.getElementById('products-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = products.map(product => {
        const title = currentLang === 'en' ? (product.titleEn || product.title) : product.title;
        const summary = currentLang === 'en' ? (product.summaryEn || product.summary) : product.summary;
        const tags = currentLang === 'en' ? (product.tagsEn || product.tags) : product.tags;
        const price = currentCurrency === 'usd' ? product.priceUsd || Math.round(product.price / 130) : product.price;
        const currency = currentCurrency === 'usd' ? '$' : '¥';
        const storesUrl = currentLang === 'en' ? (product.storesUrlEn || product.storesUrl) : product.storesUrl;
        const detailText = getTranslation('buttons.details') || '詳細';
        const purchaseText = getTranslation('buttons.purchase') || '購入';
        
        return `
            <div class="kb-product-card">
                <div class="kb-product-image">
                    <img src="${product.image}" alt="${title}" width="280" height="160" loading="lazy">
                </div>
                <div class="kb-product-info">
                    <h3 class="kb-product-title">${title}</h3>
                    <p class="kb-product-summary">${summary}</p>
                    <div class="kb-tags">
                        ${tags.map(tag => `<span class="kb-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="kb-product-meta">
                        <span class="kb-product-price">${currency}${price}</span>
                    </div>
                    <div class="kb-product-actions">
                        <a href="products/${product.slug}.html" class="kb-btn">${detailText}</a>
                        <a href="${storesUrl}" class="kb-btn kb-btn-primary" target="_blank" rel="noopener">${purchaseText}</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ローディング非表示
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// エラー表示
function showError() {
    const error = document.getElementById('error');
    if (error) {
        error.style.display = 'block';
    }
}

// 翻訳取得
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations[currentLang];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            return null;
        }
    }
    
    return value;
}

// UI要素を翻訳
function updateUITranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (translation) {
            element.innerHTML = translation;
        }
    });
    
    // 利用規約リストを更新
    updateTermsList();
    
    // ページタイトルを更新
    const titleKey = currentLang === 'en' ? 'site.title' : 'site.title';
    const title = getTranslation(titleKey);
    if (title) {
        document.title = title;
    }
    
    // HTML lang属性を更新
    document.getElementById('html-root').setAttribute('lang', currentLang);
}

// 利用規約リストを動的更新
function updateTermsList() {
    const termsList = document.getElementById('terms-list');
    if (!termsList) return;
    
    const termsItems = getTranslation('terms.items');
    if (termsItems && Array.isArray(termsItems)) {
        termsList.innerHTML = termsItems.map(item => `<li>${item}</li>`).join('');
    }
}

// 言語切り替え
function switchLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('preferred-language', lang);
    
    // ボタンの状態更新
    document.querySelectorAll('.kb-lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    updateUITranslations();
    
    // 商品表示を更新
    if (products.length > 0) {
        displayProducts(products);
    }
}

// 通貨切り替え
function switchCurrency(currency) {
    currentCurrency = currency;
    localStorage.setItem('preferred-currency', currency);
    
    // ボタンの状態更新
    document.querySelectorAll('.kb-currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-currency') === currency);
    });
    
    // 商品表示を更新
    if (products.length > 0) {
        displayProducts(products);
    }
}

// 設定を復元
function restoreSettings() {
    const savedLang = localStorage.getItem('preferred-language');
    const savedCurrency = localStorage.getItem('preferred-currency');
    
    if (savedLang && ['ja', 'en'].includes(savedLang)) {
        currentLang = savedLang;
    }
    
    if (savedCurrency && ['jpy', 'usd'].includes(savedCurrency)) {
        currentCurrency = savedCurrency;
    }
    
    // ボタンの初期状態を設定
    document.querySelectorAll('.kb-lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
    
    document.querySelectorAll('.kb-currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-currency') === currentCurrency);
    });
}

// トースト表示
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `kb-toast kb-toast-${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// 個別商品ページ用の共通関数
window.loadProductData = async function(slug) {
    try {
        const response = await fetch('../products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        return products.find(product => product.slug === slug);
    } catch (error) {
        console.error('商品データの読み込みに失敗しました:', error);
        showToast('商品データの読み込みに失敗しました', 'error');
        return null;
    }
};

// 個別商品ページの関連商品を取得
window.getRelatedProducts = function(currentProduct, allProducts, limit = 2) {
    if (!currentProduct || !allProducts) return [];
    
    return allProducts
        .filter(product => 
            product.slug !== currentProduct.slug && 
            product.tags.some(tag => currentProduct.tags.includes(tag))
        )
        .slice(0, limit);
};

// スムーススクロール
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // 空のhrefやJavaScriptリンクは除外
            if (href === '#' || href.startsWith('#!')) return;
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 購入ボタンのクリック追跡（アナリティクス用）
function trackPurchaseClick(productTitle, storesUrl) {
    // Google Analytics や他のアナリティクスツール用
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase_click', {
            event_category: 'Product',
            event_label: productTitle,
            value: storesUrl
        });
    }
    
    // コンソールログ（開発用）
    console.log('Purchase click tracked:', { productTitle, storesUrl });
}

// 詳細ボタンのクリック追跡
function trackDetailClick(productTitle, detailUrl) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'detail_click', {
            event_category: 'Product',
            event_label: productTitle,
            value: detailUrl
        });
    }
    
    console.log('Detail click tracked:', { productTitle, detailUrl });
}

// イベントリスナーの設定
function setupEventListeners() {
    // 言語切り替えボタン
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('kb-lang-btn')) {
            const lang = e.target.getAttribute('data-lang');
            switchLanguage(lang);
        }
        
        // 通貨切り替えボタン
        if (e.target.classList.contains('kb-currency-btn')) {
            const currency = e.target.getAttribute('data-currency');
            switchCurrency(currency);
        }
        
        // 購入ボタンのクリック追跡
        const target = e.target.closest('a[href*="stores.jp"]');
        if (target) {
            const productCard = target.closest('.kb-product-card');
            if (productCard) {
                const productTitle = productCard.querySelector('.kb-product-title')?.textContent || 'Unknown';
                trackPurchaseClick(productTitle, target.href);
            }
        }
        
        // 詳細ボタンのクリック追跡
        const detailTarget = e.target.closest('a[href*="products/"]');
        if (detailTarget && (detailTarget.textContent.includes('詳細') || detailTarget.textContent.includes('Details'))) {
            const productCard = detailTarget.closest('.kb-product-card');
            if (productCard) {
                const productTitle = productCard.querySelector('.kb-product-title')?.textContent || 'Unknown';
                trackDetailClick(productTitle, detailTarget.href);
            }
        }
    });
}

// フォームバリデーション（将来の拡張用）
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.setAttribute('aria-invalid', 'true');
            field.classList.add('kb-field-error');
            isValid = false;
        } else {
            field.setAttribute('aria-invalid', 'false');
            field.classList.remove('kb-field-error');
        }
    });
    
    return isValid;
}

// パフォーマンス監視（将来の拡張用）
function measurePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('Page load performance:', {
                        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    });
                }
            }, 0);
        });
    }
}

// アクセシビリティ向上
function enhanceAccessibility() {
    // フォーカス可視性の向上
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('kb-keyboard-focus');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('kb-keyboard-focus');
    });
    
    // 減速モーション設定の検出
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty('--animation-duration', '0s');
    }
}

// 初期化
async function init() {
    // 翻訳データをロード
    await loadTranslations();
    
    // 設定を復元
    restoreSettings();
    
    // UI翻訳を適用
    updateUITranslations();
    
    // メインページでのみ商品ロード
    if (document.getElementById('products-grid')) {
        await loadProducts();
    }
    
    setupSmoothScroll();
    setupEventListeners();
    enhanceAccessibility();
    measurePerformance();
    
    // ページロード完了のログ
    console.log('Kintone Mini Plugins site initialized');
}

// DOM読み込み完了時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    
    // 重要なエラーの場合はユーザーに通知
    if (e.error && e.error.message && e.error.message.includes('products.json')) {
        showToast('商品データの読み込みでエラーが発生しました', 'error');
    }
});

// モジュールエクスポート（将来の拡張用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadProducts,
        displayProducts,
        showToast,
        validateForm
    };
}