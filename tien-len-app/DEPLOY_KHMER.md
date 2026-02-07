
# របៀបដាក់ឱ្យគេលេងបានដោយមិនបាច់ Host (Deployment Guide)

ឥឡូវនេះកូដរបស់អ្នកស្ថិតនៅលើ GitHub ហើយ (`https://github.com/Socheat89/bea`)។
ជំហានបន្ទាប់គឺដាក់វាឱ្យដំណើរការនៅលើ **Render (Free)**៖

## 1. ចុះឈ្មោះ និងបង្កើតសេវាកម្ម

1. ចូលទៅកាន់ **[render.com](https://render.com)**
2. ចុច **Sign In** -> ជ្រើសរើស **GitHub** (Sign in with GitHub)
3. ចុចប៊ូតុង **New +** (ខាងស្តាំលើ) -> ជ្រើសរើស **Web Service**

## 2. ភ្ជាប់ជាមួយ GitHub

1. នៅក្រោម "Connect a repository", ស្វែងរក `bea` ឬ `Socheat89/bea`
2. ចុចប៊ូតុង **Connect**

## 3. កំណត់ការកំណត់ (Settings) - **សំខាន់ណាស់!**

បំពេញព័ត៌មាននៅក្នុងទម្រង់បែបបទដូចខាងក្រោម៖

| Setting | Value (ត្រូវដាក់ឱ្យដូច) |
| :--- | :--- |
| **Name** | `tien-len-game` (ឬឈ្មោះអ្វីក៏បាន) |
| **Region** | `Singapore` (ដើម្បីឱ្យលឿន) |
| **Branch** | `main` |
| **Root Directory** | `tien-len-app` |
| **Runtime** | `Node` |
| **Build Command** | `cd client && npm install && npm run build && cd ../server && npm install` |
| **Start Command** | `node server/index.js` |

*ចំណាំ៖ កុំភ្លេចដាក់ **Root Directory** ជា `tien-len-app` ព្រោះកូដស្ថិតនៅក្នុង Folder នោះ។*

## 4. ចុច Deploy

1. អូសចុះក្រោម រួចជ្រើសរើស **Free** Plan.
2. ចុចប៊ូតុង **Create Web Service**.

## 5. រង់ចាំ និងលេង

- Render នឹងចាប់ផ្តើមដំឡើង (អាចចំណាយពេល ៣-៥ នាទី)។
- បន្ទាប់ពីវាចេញពណ៌បៃតង (**Live**), អ្នកនឹងឃើញ Link នៅខាងលើ (ឧទាហរណ៍: `https://tien-len-game.onrender.com`)។
- ចុច Link នោះ ហើយផ្ញើទៅមិត្តភក្តិដើម្បីលេង!
