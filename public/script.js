// まごころおにぎり屋 - 顧客向けWebサイト JavaScript

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 初期化処理
    initializeWebsite();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // メニューデータの読み込み
    loadMenuData();
    
    // アニメーションの開始
    startAnimations();
});

// サイトの初期化
function initializeWebsite() {
    // スクロールアニメーションの設定
    setupScrollAnimations();
    
    // スムーススクロールの設定
    setupSmoothScrolling();
    
    // 現在時刻の表示
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

// イベントリスナーの設定
function setupEventListeners() {
    // ハンバーガーメニュー
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    
    if (hamburger && navList) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navList.classList.toggle('active');
        });
    }
    
    // お問い合わせフォーム
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // メニューフィルター
    const menuFilters = document.querySelectorAll('.menu-filter');
    menuFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.dataset.category;
            filterMenu(category);
            
            // アクティブフィルターの更新
            menuFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // モーダル関連
    setupModalEvents();
}

// スクロールアニメーションの設定
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // アニメーション対象要素の監視
    const animateElements = document.querySelectorAll('.fade-in, .slide-up, .slide-in-left, .slide-in-right');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// スムーススクロールの設定
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 現在時刻の更新
function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timeElement.textContent = timeString;
    }
}

// メニューデータの読み込み
async function loadMenuData() {
    try {
        // 実際のAPIが利用可能になるまでのダミーデータ
        const menuData = [
            { id: 1, name: '塩', price: 90, category: 'classic', image: '/images/shio.jpg', description: 'シンプルで飽きのこない塩味' },
            { id: 2, name: 'ツナマヨ', price: 100, category: 'popular', image: '/images/tuna-mayo.jpg', description: '人気No.1のツナマヨネーズ' },
            { id: 3, name: 'とりそぼろ', price: 110, category: 'popular', image: '/images/chicken.jpg', description: '甘辛いとりそぼろが絶品' },
            { id: 4, name: 'こんぶ', price: 110, category: 'classic', image: '/images/konbu.jpg', description: '昆布の旨味たっぷり' },
            { id: 5, name: '鮭', price: 120, category: 'classic', image: '/images/salmon.jpg', description: '定番の焼き鮭' },
            { id: 6, name: 'たらこ', price: 130, category: 'premium', image: '/images/tarako.jpg', description: 'プチプチ食感のたらこ' },
            { id: 7, name: '高菜', price: 130, category: 'premium', image: '/images/takana.jpg', description: 'ピリ辛高菜' }
        ];
        
        displayMenu(menuData);
    } catch (error) {
        console.error('メニューデータの読み込みエラー:', error);
        displayMenuError();
    }
}

// メニューの表示
function displayMenu(menuData) {
    const menuContainer = document.getElementById('menu-items');
    if (!menuContainer) return;
    
    menuContainer.innerHTML = menuData.map(item => `
        <div class="menu-item" data-category="${item.category}">
            <div class="menu-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='/images/placeholder.jpg'">
                <div class="menu-item-overlay">
                    <button class="btn btn-primary" onclick="showMenuDetail(${item.id})">詳細を見る</button>
                </div>
            </div>
            <div class="menu-item-content">
                <h3 class="menu-item-name">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-price">¥${item.price}</div>
            </div>
        </div>
    `).join('');
    
    // メニューアイテムにアニメーションクラスを追加
    const menuItems = menuContainer.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        item.classList.add('fade-in');
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

// メニューエラー表示
function displayMenuError() {
    const menuContainer = document.getElementById('menu-items');
    if (menuContainer) {
        menuContainer.innerHTML = `
            <div class="error-message">
                <p>メニューの読み込みに失敗しました。</p>
                <button class="btn btn-primary" onclick="loadMenuData()">再試行</button>
            </div>
        `;
    }
}

// メニューフィルタリング
function filterMenu(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            item.classList.add('fade-in');
        } else {
            item.style.display = 'none';
        }
    });
}

// メニュー詳細表示
function showMenuDetail(menuId) {
    // メニューIDに基づく詳細情報の表示
    console.log('メニュー詳細:', menuId);
    showNotification('LINE公式アカウントで予約できます', 'info');
}

// お問い合わせフォームの処理
function handleContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    
    // バリデーション
    if (!data.name || !data.email || !data.message) {
        showNotification('すべての項目を入力してください', 'error');
        return;
    }
    
    // メール形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('正しいメールアドレスを入力してください', 'error');
        return;
    }
    
    // 送信処理（実装例）
    sendContactForm(data);
}

// お問い合わせフォーム送信
async function sendContactForm(data) {
    try {
        // ローディング表示
        showLoading();
        
        // 実際のAPI送信処理（例）
        await new Promise(resolve => setTimeout(resolve, 2000)); // 仮の遅延
        
        hideLoading();
        showNotification('お問い合わせを送信しました', 'success');
        
        // フォームリセット
        document.getElementById('contact-form').reset();
        
    } catch (error) {
        hideLoading();
        console.error('お問い合わせ送信エラー:', error);
        showNotification('送信に失敗しました。もう一度お試しください', 'error');
    }
}

// アニメーションの開始
function startAnimations() {
    // ヒーローセクションのアニメーション
    const hero = document.querySelector('.hero');
    if (hero) {
        setTimeout(() => {
            hero.classList.add('loaded');
        }, 500);
    }
    
    // 統計カウンターアニメーション
    startCounterAnimation();
}

// カウンターアニメーション
function startCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000; // 2秒
        const step = target / (duration / 16); // 60fps
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current);
        }, 16);
    });
}

// モーダルイベントの設定
function setupModalEvents() {
    // モーダルを閉じる
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 閉じるボタン
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// 営業状態の確認
function checkBusinessStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0: 日曜, 1: 月曜, ..., 6: 土曜
    
    // 土日祝（0: 日曜, 6: 土曜）は休業
    if (currentDay === 0 || currentDay === 6) {
        return { isOpen: false, message: '土日祝は休業日です' };
    }
    
    // 平日 11:00-14:30
    if (currentHour >= 11 && currentHour < 14) {
        return { isOpen: true, message: '営業中です' };
    } else if (currentHour === 14 && now.getMinutes() <= 30) {
        return { isOpen: true, message: '営業中です（まもなく終了）' };
    } else {
        return { isOpen: false, message: '営業時間外です' };
    }
}

// 営業状態の表示更新
function updateBusinessStatus() {
    const statusElement = document.getElementById('business-status');
    if (statusElement) {
        const status = checkBusinessStatus();
        statusElement.textContent = status.message;
        statusElement.className = `business-status ${status.isOpen ? 'open' : 'closed'}`;
    }
}

// LINE予約ボタンの処理
function openLineReservation() {
    // LINE公式アカウントへのリンク（実際のURLに置き換え）
    const lineUrl = 'https://line.me/R/ti/p/@your-line-id';
    window.open(lineUrl, '_blank');
}

// スクロール位置に応じたヘッダーの変更
function handleScroll() {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
}

// トップに戻るボタン
function showBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 通知表示
function showNotification(message, type = 'info') {
    // 既存の通知を削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // アニメーションで表示
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // 5秒後に自動削除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// ローディング表示
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>送信中...</p>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
        loading.remove();
    }
}

// 画像の遅延読み込み
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ページ初期化後の追加設定
window.addEventListener('load', function() {
    // 営業状態の更新
    updateBusinessStatus();
    setInterval(updateBusinessStatus, 60000); // 1分ごと
    
    // 遅延読み込みの設定
    setupLazyLoading();
});

// スクロールイベント
window.addEventListener('scroll', function() {
    handleScroll();
    showBackToTop();
});

// レスポンシブ対応
window.addEventListener('resize', function() {
    // ウィンドウサイズ変更時の処理
    const navList = document.querySelector('.nav-list');
    const hamburger = document.querySelector('.hamburger');
    
    if (window.innerWidth > 768) {
        // デスクトップサイズでは強制的にメニューを表示
        if (navList) navList.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
    }
});

// デバッグ用（開発時のみ）
if (process.env.NODE_ENV === 'development') {
    console.log('まごころおにぎり屋 - 開発モード');
}

// 外部API連携（将来の拡張用）
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }
    
    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error('API GET エラー:', error);
            throw error;
        }
    }
    
    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API POST エラー:', error);
            throw error;
        }
    }
}

// APIクライアントのインスタンス
const apiClient = new APIClient('/api');

// パフォーマンス監視
function trackPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`Page load time: ${loadTime}ms`);
            }, 0);
        });
    }
} 