
# របៀបឱ្យគេលេងបានដោយមិនបាច់ Host (Deployment Guide)

ដើម្បីឱ្យមិត្តភក្តិរបស់អ្នកអាចលេងបានគ្រប់ពេលដោយមិនចាំបាច់អោយអ្នកបើកកុំព្យូទ័រចោល អ្នកត្រូវ **Deploy** កម្មវិធីនេះទៅលើ Server (Cloud)។
ខាងក្រោមនេះជារបៀបប្រើ **Render (Free)**:

## 1. រៀបចំកូដ (Prepare for Deployment)

អ្នកត្រូវមានគណនី GitHub ហើយធ្វើការ Push កូដទាំងអស់ទៅកាន់ Repository ថ្មីមួយ។

1. **បង្កើត GitHub Repository**
   - ចូលទៅ [github.com](https://github.com)
   - ចុច "New Repository"
   - ដាក់ឈ្មោះ (ឧទាហរណ៍: `tien-len-game`)
   - ចុច "Create repository"

2. **Push កូដទៅ GitHub**
   បើក Terminal របស់អ្នកនៅ `d:\bea\tien-len-app` ហើយវាយពាក្យបញ្ជាខាងក្រោម៖
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # ជំនួស URL ខាងក្រោមដោយ URL នៃ Repository របស់អ្នក
   git remote add origin https://github.com/YOUR_USERNAME/tien-len-game.git
   git push -u origin main
   ```

## 2. Deploy ទៅ Render (Free)

1. **ចុះឈ្មោះនៅ [render.com](https://render.com)** (អាចប្រើ GitHub Login)
2. ចុច **New +** -> **Web Service**
3. ជ្រើសរើស Repository ដែលអ្នកទើបតែបង្កើត (`tien-len-game`)
4. បំពេញព័ត៌មានដូចខាងក្រោម៖
   - **Name**: `tien-len-game` (ឬឈ្មោះផ្សេង)
   - **Region**: Singapore (ជិតនិងលឿន) (Singapore is recommended for Asia users)
   - **Branch**: `main`
   - **Root Directory**: `.` (ទុកទំនេរ)
   - **Runtime**: `Node`
   - **Environment**: Node
   - **Build Command**: `cd client && npm install && npm run build && cd ../server && npm install`
   - **Start Command**: `node server/index.js`
5. ចុច **Create Web Service**

## 3. លេងបានហើយ!

បន្ទាប់ពី Deploy ចប់ (ប្រហែល 3-5 នាទី), Render នឹងផ្តល់ URL មួយឱ្យអ្នក (ឧទាហរណ៍: `https://tien-len-game.onrender.com`)។
អ្នកគ្រាន់តែCopy Link នេះផ្ញើទៅមិត្តភក្តិ ពួកគេនឹងអាចលេងបានភ្លាមៗ ទោះបីជាអ្នកបិទកុំព្យូទ័រក៏ដោយ!
