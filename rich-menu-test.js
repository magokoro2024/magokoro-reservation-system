// リッチメニュー作成テストスクリプト
const axios = require('axios');

const API_BASE = 'https://magokoro-onigiri.onrender.com/api/line';

// 1. 現在のリッチメニューを確認
async function checkRichMenus() {
  try {
    const response = await axios.get(`${API_BASE}/rich-menu/list`);
    console.log('現在のリッチメニュー一覧:', response.data);
  } catch (error) {
    console.error('リッチメニュー確認エラー:', error.response?.data || error.message);
  }
}

// 2. 既存のリッチメニューを削除
async function deleteAllRichMenus() {
  try {
    const response = await axios.delete(`${API_BASE}/rich-menu/delete-all`);
    console.log('リッチメニュー削除結果:', response.data);
  } catch (error) {
    console.error('リッチメニュー削除エラー:', error.response?.data || error.message);
  }
}

// 3. 新しいリッチメニューを作成
async function createRichMenu() {
  try {
    const response = await axios.post(`${API_BASE}/rich-menu/create`);
    console.log('リッチメニュー作成結果:', response.data);
    return response.data.richMenuId;
  } catch (error) {
    console.error('リッチメニュー作成エラー:', error.response?.data || error.message);
  }
}

// 4. 画像付きリッチメニューを作成（推奨）
async function createRichMenuWithImage(imagePath) {
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    
    const response = await axios.post(`${API_BASE}/rich-menu/create-with-image`, form, {
      headers: form.getHeaders()
    });
    
    console.log('画像付きリッチメニュー作成結果:', response.data);
    return response.data.richMenuId;
  } catch (error) {
    console.error('画像付きリッチメニュー作成エラー:', error.response?.data || error.message);
  }
}

// 実行
async function main() {
  console.log('=== リッチメニュー作成テスト ===');
  
  // 1. 現在の状態を確認
  await checkRichMenus();
  
  // 2. 既存のリッチメニューを削除
  await deleteAllRichMenus();
  
  // 3. 新しいリッチメニューを作成
  const richMenuId = await createRichMenu();
  
  // 4. 確認
  await checkRichMenus();
}

// 画像ファイルがある場合は画像付きで作成
async function createWithImage(imagePath) {
  console.log('=== 画像付きリッチメニュー作成 ===');
  
  // 既存削除
  await deleteAllRichMenus();
  
  // 画像付きで作成
  const richMenuId = await createRichMenuWithImage(imagePath);
  
  // 確認
  await checkRichMenus();
}

module.exports = {
  checkRichMenus,
  deleteAllRichMenus,
  createRichMenu,
  createRichMenuWithImage,
  main,
  createWithImage
};

// 直接実行する場合
if (require.main === module) {
  main();
} 