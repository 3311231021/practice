# iPAS 淨零碳測驗

這是一個可部署到 GitHub Pages 的純前端測驗網頁。

## 功能
- 可選擇考科一、考科二或混合出題
- 可選 5、10 或 50 題
- 每次隨機抽題
- 作答後立即顯示正確答案與解析
- 完成測驗後集中列出錯題
- 題庫由 `questions.xlsx` 載入，不必修改程式碼

## 更新題庫
1. 開啟 `questions.xlsx`
2. 在「題庫」工作表新增題目
3. 維持欄位名稱不變
4. 將更新後檔案推送至 GitHub
5. 重新整理 GitHub Pages 網頁

## 部署 GitHub Pages
1. 建立一個新的 GitHub repository
2. 上傳本資料夾內全部檔案到 repository 根目錄
3. 到 **Settings → Pages**
4. Source 選 **Deploy from a branch**
5. Branch 選 `main`，資料夾選 `/ (root)`
6. 儲存後等待 GitHub 產生網站網址

## 檔案
- `index.html`：網頁結構
- `style.css`：視覺樣式
- `app.js`：測驗邏輯
- `questions.xlsx`：Excel 題庫

## 注意
網頁透過 SheetJS CDN 讀取 Excel，因此使用者瀏覽時需能連線至 CDN。
題目請以官方公開試題或合法授權內容為限，並在 Excel 的「來源」欄保留出處。
