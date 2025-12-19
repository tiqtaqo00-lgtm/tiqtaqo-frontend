# 🎯 دليل لوحة التحكم الجديدة - TiqtaQo Admin Dashboard

## 📋 نظرة عامة

تم إنشاء لوحة تحكم جديدة وحديثة لإدارة موقع TiqtaQo بالكامل. اللوحة توفر واجهة سهلة الاستخدام لإدارة المنتجات والأقسام والفروع.

---

## 🔐 بيانات الدخول

### بيانات المسؤول:
- **البريد الإلكتروني:** `tiqtaqo00@gmail.com`
- **كلمة المرور:** `Med123med`

---

## 🌐 روابط الوصول

### لوحة التحكم:
- **الرابط:** `https://tiqtaqo-frontend-o2fa.vercel.app/admin/login.html`
- **صفحة تسجيل الدخول:** `login.html`
- **صفحة لوحة التحكم:** `dashboard.html`

### Backend API:
- **الرابط الأساسي:** `https://tiqtaqo-backend-hx6ych8ay-tiqtaqos-projects.vercel.app/api`

---

## 📂 الأقسام والفروع المتاحة

### الأقسام الرئيسية:
1. **Packs** (الباقات)
   - Packs Homme (باقات رجالية)
   - Packs Femme (باقات نسائية)

2. **Homme** (الرجالي)
   - Montres Homme (ساعات رجالية)
   - Accessoires Homme (إكسسوارات رجالية)

3. **Femme** (النسائي)
   - Montres Femme (ساعات نسائية)
   - Accessoires Femme (إكسسوارات نسائية)

4. **Accessoires** (الإكسسوارات)
   - Accessoires Homme
   - Accessoires Femme

5. **Wallets** (المحافظ)
   - Wallets Homme
   - Wallets Femme

6. **Belts** (الأحزمة)
   - Belts Homme
   - Belts Femme

7. **Glasses** (النظارات)
   - Glasses Homme
   - Glasses Femme

---

## 🎨 ميزات لوحة التحكم

### 1️⃣ تسجيل الدخول (Login)
- واجهة حديثة وآمنة
- التحقق من بيانات المسؤول
- حفظ التوكن في localStorage
- إعادة توجيه تلقائية للمسؤولين المسجلين

### 2️⃣ لوحة التحكم الرئيسية (Dashboard)
- عرض معلومات المسؤول
- قائمة جانبية للتنقل السهل
- واجهة استجابية (Responsive)

### 3️⃣ إدارة المنتجات
**الميزات:**
- ✅ عرض جميع المنتجات
- ✅ إضافة منتج جديد
- ✅ حذف منتج
- ⏳ تعديل منتج (قيد التطوير)

**بيانات المنتج:**
- اسم المنتج
- السعر
- القسم
- الفرع
- الجنس (رجالي/نسائي/للجميع)
- الوصف
- رابط الصورة
- المخزون
- منتج مميز (Featured)

### 4️⃣ إدارة الأقسام
**الميزات:**
- ✅ عرض جميع الأقسام
- ✅ إضافة قسم جديد
- ✅ حذف قسم
- ⏳ تعديل قسم (قيد التطوير)

**بيانات القسم:**
- معرف القسم (ID)
- اسم القسم
- الأيقونة
- ترتيب العرض
- الفروع

---

## 🔌 API Endpoints

### المصادقة (Authentication)
```
POST /api/auth/login
- Body: { email, password }
- Response: { success, token, admin }

GET /api/auth/verify
- Headers: Authorization: Bearer {token}
- Response: { success, user }
```

### الأقسام (Categories)
```
GET /api/categories
- Response: [{ id, name, icon, displayOrder, subcategories }]

GET /api/categories/:id
- Response: { id, name, icon, displayOrder, subcategories }

POST /api/categories
- Headers: Authorization: Bearer {token}
- Body: { id, name, icon, displayOrder, subcategories }
- Response: { id, name, icon, displayOrder, subcategories }

PUT /api/categories/:id
- Headers: Authorization: Bearer {token}
- Body: { name, icon, displayOrder, subcategories }
- Response: { id, name, icon, displayOrder, subcategories }

DELETE /api/categories/:id
- Headers: Authorization: Bearer {token}
- Response: { id, name, icon, displayOrder, subcategories }
```

### المنتجات (Products)
```
GET /api/products
- Query: ?category=&subcategory=&gender=&featured=
- Response: [{ _id, name, price, category, subcategory, gender, image, stock, visible, featured, description }]

GET /api/products/:id
- Response: { _id, name, price, category, subcategory, gender, image, stock, visible, featured, description }

POST /api/products
- Headers: Authorization: Bearer {token}
- Body: { name, price, category, subcategory, gender, image, stock, featured, description }
- Response: { _id, name, price, category, subcategory, gender, image, stock, visible, featured, description }

PUT /api/products/:id
- Headers: Authorization: Bearer {token}
- Body: { name, price, category, subcategory, gender, image, stock, featured, description, visible }
- Response: { _id, name, price, category, subcategory, gender, image, stock, visible, featured, description }

DELETE /api/products/:id
- Headers: Authorization: Bearer {token}
- Response: { _id, name, price, category, subcategory, gender, image, stock, visible, featured, description }

GET /api/products/category/:categoryId
- Response: [{ ... }]

GET /api/products/subcategory/:subcategoryName
- Response: [{ ... }]
```

---

## 🚀 كيفية الاستخدام

### 1. تسجيل الدخول
1. اذهب إلى `https://tiqtaqo-frontend-o2fa.vercel.app/admin/login.html`
2. أدخل البريد الإلكتروني: `tiqtaqo00@gmail.com`
3. أدخل كلمة المرور: `Med123med`
4. انقر على "دخول"

### 2. إضافة منتج جديد
1. من القائمة الجانبية، انقر على "إضافة منتج"
2. ملء جميع البيانات المطلوبة
3. انقر على "إضافة المنتج"

### 3. عرض المنتجات
1. من القائمة الجانبية، انقر على "المنتجات"
2. سيتم عرض جميع المنتجات في شكل بطاقات
3. يمكنك حذف أي منتج من خلال زر "حذف"

### 4. إدارة الأقسام
1. من القائمة الجانبية، انقر على "الأقسام"
2. سيتم عرض جميع الأقسام في جدول
3. يمكنك إضافة قسم جديد أو حذف قسم موجود

---

## 🛠️ التطوير المستقبلي

### الميزات المخطط إضافتها:
- ✅ تعديل المنتجات
- ✅ تعديل الأقسام
- ✅ البحث والتصفية
- ✅ الترتيب والفرز
- ✅ إدارة الصور
- ✅ إحصائيات المبيعات
- ✅ إدارة الطلبات
- ✅ إدارة المستخدمين

---

## 📱 التوافقية

- ✅ سطح المكتب (Desktop)
- ✅ الأجهزة اللوحية (Tablet)
- ✅ الهواتف الذكية (Mobile)

---

## 🔒 الأمان

- ✅ المصادقة باستخدام JWT
- ✅ حماية المسارات المحمية
- ✅ تشفير كلمات المرور
- ✅ التحقق من الصلاحيات

---

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى التواصل عبر:
- البريد الإلكتروني: `tiqtaqo00@gmail.com`
- الموقع: `https://tiqtaqo-frontend-o2fa.vercel.app`

---

## 📝 ملاحظات مهمة

1. **التوكن:** يتم حفظ التوكن في localStorage ويبقى صالحاً لمدة 30 يوم
2. **البيانات:** جميع البيانات يتم حفظها في MongoDB Atlas
3. **الصور:** يمكنك استخدام أي رابط صورة من الإنترنت
4. **المخزون:** يتم تتبع المخزون لكل منتج

---

**آخر تحديث:** 19 ديسمبر 2025
**الإصدار:** 1.0.0
