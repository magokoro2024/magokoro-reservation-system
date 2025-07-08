// 管理画面用JavaScript

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // 初期表示
    loadDashboard();
    
    // イベントリスナーの設定
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
    // メニューフォームの送信
    document.getElementById('menuForm').addEventListener('submit', handleMenuFormSubmit);
}

// タブ切り替え
function showTab(tabName) {
    // すべてのタブコンテンツを非表示
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // すべてのナビボタンからアクティブクラスを削除
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // 選択されたタブを表示
    document.getElementById(tabName).classList.add('active');
    
    // 対応するナビボタンをアクティブに
    event.target.classList.add('active');
    
    // タブに応じてデータを読み込み
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'menu':
            loadMenu();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ダッシュボードの読み込み
async function loadDashboard() {
    try {
        // 統計情報の取得
        const statsResponse = await fetch('/api/reservations/stats/summary');
        const stats = await statsResponse.json();
        
        // 統計情報の表示更新
        document.getElementById('todayReservations').textContent = stats.today || 0;
        document.getElementById('weekReservations').textContent = stats.thisWeek || 0;
        document.getElementById('monthReservations').textContent = stats.thisMonth || 0;
        document.getElementById('totalReservations').textContent = stats.total || 0;
        
        // チャートデータの取得と表示
        loadCharts();
    } catch (error) {
        console.error('ダッシュボードの読み込みエラー:', error);
        showAlert('ダッシュボードの読み込みに失敗しました', 'error');
    }
}

// チャートの読み込み
async function loadCharts() {
    try {
        // メニュー別統計
        const menuStatsResponse = await fetch('/api/reservations/stats/menu');
        const menuStats = await menuStatsResponse.json();
        displayMenuChart(menuStats);
        
        // 時間帯別統計
        const timeStatsResponse = await fetch('/api/reservations/stats/time');
        const timeStats = await timeStatsResponse.json();
        displayTimeChart(timeStats);
    } catch (error) {
        console.error('チャートデータの読み込みエラー:', error);
    }
}

// メニュー別チャートの表示
function displayMenuChart(data) {
    const chartElement = document.getElementById('menuChart');
    if (data.length === 0) {
        chartElement.innerHTML = '<p>データがありません</p>';
        return;
    }
    
    let chartHTML = '<div class="chart-bars">';
    const maxCount = Math.max(...data.map(item => item.reservation_count));
    
    data.forEach(item => {
        const percentage = (item.reservation_count / maxCount) * 100;
        chartHTML += `
            <div class="chart-bar">
                <div class="bar-fill" style="height: ${percentage}%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                <div class="bar-label">${item.menu_name}</div>
                <div class="bar-value">${item.reservation_count}</div>
            </div>
        `;
    });
    chartHTML += '</div>';
    
    chartElement.innerHTML = chartHTML;
}

// 時間帯別チャートの表示
function displayTimeChart(data) {
    const chartElement = document.getElementById('timeChart');
    if (data.length === 0) {
        chartElement.innerHTML = '<p>データがありません</p>';
        return;
    }
    
    let chartHTML = '<div class="chart-bars">';
    const maxCount = Math.max(...data.map(item => item.reservation_count));
    
    data.forEach(item => {
        const percentage = (item.reservation_count / maxCount) * 100;
        chartHTML += `
            <div class="chart-bar">
                <div class="bar-fill" style="height: ${percentage}%; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);"></div>
                <div class="bar-label">${item.reservation_time}</div>
                <div class="bar-value">${item.reservation_count}</div>
            </div>
        `;
    });
    chartHTML += '</div>';
    
    chartElement.innerHTML = chartHTML;
}

// 予約管理の読み込み
async function loadReservations() {
    try {
        const response = await fetch('/api/reservations');
        const reservations = await response.json();
        displayReservations(reservations);
    } catch (error) {
        console.error('予約データの読み込みエラー:', error);
        showAlert('予約データの読み込みに失敗しました', 'error');
    }
}

// 予約一覧の表示
function displayReservations(reservations) {
    const tbody = document.getElementById('reservationTableBody');
    
    if (reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-data">予約データがありません</td></tr>';
        return;
    }
    
    tbody.innerHTML = reservations.map(reservation => `
        <tr>
            <td>${reservation.id}</td>
            <td>${formatDate(reservation.reservation_date)} ${reservation.reservation_time}</td>
            <td>${reservation.menu_name}</td>
            <td>¥${reservation.menu_price}</td>
            <td><span class="status-${reservation.status}">${getStatusText(reservation.status)}</span></td>
            <td>${formatDateTime(reservation.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-view" onclick="viewReservation(${reservation.id})">詳細</button>
                    <button class="action-btn action-btn-edit" onclick="editReservation(${reservation.id})">編集</button>
                    <button class="action-btn action-btn-delete" onclick="deleteReservation(${reservation.id})">削除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 予約更新
function refreshReservations() {
    loadReservations();
}

// 予約フィルタリング
function filterReservations() {
    const status = document.getElementById('statusFilter').value;
    // フィルタリングロジックを実装
    loadReservations(); // 簡単のため全データを再読み込み
}

// メニュー管理の読み込み
async function loadMenu() {
    try {
        const response = await fetch('/api/menu');
        const menuItems = await response.json();
        displayMenu(menuItems);
    } catch (error) {
        console.error('メニューデータの読み込みエラー:', error);
        showAlert('メニューデータの読み込みに失敗しました', 'error');
    }
}

// メニュー一覧の表示
function displayMenu(menuItems) {
    const tbody = document.getElementById('menuTableBody');
    
    if (menuItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-data">メニューデータがありません</td></tr>';
        return;
    }
    
    tbody.innerHTML = menuItems.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>¥${item.price}</td>
            <td>${item.available ? '有効' : '無効'}</td>
            <td>${formatDateTime(item.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn action-btn-edit" onclick="editMenuItem(${item.id})">編集</button>
                    <button class="action-btn action-btn-delete" onclick="deleteMenuItem(${item.id})">削除</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// メニュー追加フォームの表示
function showAddMenuForm() {
    document.getElementById('menuModalTitle').textContent = 'メニュー追加';
    document.getElementById('menuForm').reset();
    document.getElementById('menuModal').style.display = 'block';
}

// メニュー編集フォームの表示
async function editMenuItem(id) {
    try {
        const response = await fetch(`/api/menu/${id}`);
        const menuItem = await response.json();
        
        document.getElementById('menuModalTitle').textContent = 'メニュー編集';
        document.getElementById('menuName').value = menuItem.name;
        document.getElementById('menuPrice').value = menuItem.price;
        document.getElementById('menuAvailable').value = menuItem.available;
        
        // 編集用のIDを保存
        document.getElementById('menuForm').dataset.editId = id;
        document.getElementById('menuModal').style.display = 'block';
    } catch (error) {
        console.error('メニュー情報の取得エラー:', error);
        showAlert('メニュー情報の取得に失敗しました', 'error');
    }
}

// メニューフォームの送信処理
async function handleMenuFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('menuName').value,
        price: parseInt(document.getElementById('menuPrice').value),
        available: parseInt(document.getElementById('menuAvailable').value)
    };
    
    const editId = document.getElementById('menuForm').dataset.editId;
    const isEdit = !!editId;
    
    try {
        const response = await fetch(isEdit ? `/api/menu/${editId}` : '/api/menu', {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showAlert(isEdit ? 'メニューが更新されました' : 'メニューが追加されました', 'success');
            closeMenuModal();
            loadMenu();
        } else {
            throw new Error('保存に失敗しました');
        }
    } catch (error) {
        console.error('メニュー保存エラー:', error);
        showAlert('メニューの保存に失敗しました', 'error');
    }
}

// メニュー削除
async function deleteMenuItem(id) {
    if (!confirm('このメニューを削除してもよろしいですか？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/menu/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('メニューが削除されました', 'success');
            loadMenu();
        } else {
            throw new Error('削除に失敗しました');
        }
    } catch (error) {
        console.error('メニュー削除エラー:', error);
        showAlert('メニューの削除に失敗しました', 'error');
    }
}

// 設定の読み込み
function loadSettings() {
    // 設定データの読み込み処理
    console.log('設定データを読み込み中...');
}

// 設定保存
function saveSettings() {
    const settings = {
        storeName: document.getElementById('storeName').value,
        storeAddress: document.getElementById('storeAddress').value,
        storePhone: document.getElementById('storePhone').value,
        storeEmail: document.getElementById('storeEmail').value,
        businessHours: document.getElementById('businessHours').value
    };
    
    // 保存処理（実装例）
    console.log('設定を保存:', settings);
    showAlert('設定が保存されました', 'success');
}

// 予約詳細表示
async function viewReservation(id) {
    try {
        const response = await fetch(`/api/reservations/${id}`);
        const reservation = await response.json();
        
        document.getElementById('reservationDetails').innerHTML = `
            <div class="reservation-detail">
                <h4>予約ID: ${reservation.id}</h4>
                <p><strong>日時:</strong> ${formatDate(reservation.reservation_date)} ${reservation.reservation_time}</p>
                <p><strong>メニュー:</strong> ${reservation.menu_name}</p>
                <p><strong>金額:</strong> ¥${reservation.menu_price}</p>
                <p><strong>状態:</strong> ${getStatusText(reservation.status)}</p>
                <p><strong>作成日時:</strong> ${formatDateTime(reservation.created_at)}</p>
                ${reservation.updated_at ? `<p><strong>更新日時:</strong> ${formatDateTime(reservation.updated_at)}</p>` : ''}
            </div>
        `;
        
        document.getElementById('reservationModal').style.display = 'block';
    } catch (error) {
        console.error('予約詳細の取得エラー:', error);
        showAlert('予約詳細の取得に失敗しました', 'error');
    }
}

// 予約編集
function editReservation(id) {
    // 予約編集フォームの実装
    console.log('予約編集:', id);
}

// 予約削除
async function deleteReservation(id) {
    if (!confirm('この予約を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/reservations/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('予約が削除されました', 'success');
            loadReservations();
        } else {
            throw new Error('削除に失敗しました');
        }
    } catch (error) {
        console.error('予約削除エラー:', error);
        showAlert('予約の削除に失敗しました', 'error');
    }
}

// モーダル関連
function closeMenuModal() {
    document.getElementById('menuModal').style.display = 'none';
    document.getElementById('menuForm').removeAttribute('data-edit-id');
}

function closeReservationModal() {
    document.getElementById('reservationModal').style.display = 'none';
}

// ユーティリティ関数
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ja-JP');
}

function getStatusText(status) {
    const statusMap = {
        'confirmed': '確定',
        'cancelled': 'キャンセル',
        'completed': '完了',
        'pending': '待機中'
    };
    return statusMap[status] || status;
}

// アラート表示
function showAlert(message, type = 'info') {
    // 既存のアラートを削除
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // アラートを画面上部に追加
    document.querySelector('.admin-main').insertBefore(alert, document.querySelector('.admin-main').firstChild);
    
    // 3秒後に自動削除
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const menuModal = document.getElementById('menuModal');
    const reservationModal = document.getElementById('reservationModal');
    
    if (event.target === menuModal) {
        closeMenuModal();
    }
    if (event.target === reservationModal) {
        closeReservationModal();
    }
}

// チャート用CSS（動的追加）
const chartCSS = `
.chart-bars {
    display: flex;
    align-items: end;
    height: 250px;
    gap: 1rem;
    padding: 1rem;
}

.chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    position: relative;
}

.bar-fill {
    width: 100%;
    max-width: 60px;
    border-radius: 4px 4px 0 0;
    transition: height 0.3s ease;
    margin-bottom: 0.5rem;
}

.bar-label {
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.2rem;
    text-align: center;
}

.bar-value {
    font-size: 0.9rem;
    font-weight: bold;
    color: #667eea;
}

.reservation-detail {
    line-height: 1.8;
}

.reservation-detail h4 {
    color: #667eea;
    margin-bottom: 1rem;
    border-bottom: 2px solid #667eea;
    padding-bottom: 0.5rem;
}

.reservation-detail p {
    margin-bottom: 0.5rem;
}

.reservation-detail strong {
    color: #333;
    min-width: 100px;
    display: inline-block;
}
`;

// CSSを動的に追加
const style = document.createElement('style');
style.textContent = chartCSS;
document.head.appendChild(style); 