# 🚀 دليل النشر على Vercel

## ✅ الخطوات المطلوبة للنشر

### 1️⃣ إنشاء حساب على Vercel
- اذهب إلى: https://vercel.com/signup
- سجل الدخول باستخدام حساب GitHub الخاص بك

### 2️⃣ ربط المشروع مع Vercel

#### الطريقة الأولى: من خلال واجهة Vercel (الأسهل)
1. اذهب إلى: https://vercel.com/new
2. اختر "Import Git Repository"
3. ابحث عن مشروع `tiqtaqo-frontend`
4. اضغط على "Import"
5. **إعدادات المشروع:**
   - **Framework Preset:** Other (أو اتركها فارغة)
   - **Root Directory:** `./` (الجذر)
   - **Build Command:** اتركها فارغة (لا نحتاج build)
   - **Output Directory:** `./` (الجذر)
6. اضغط على "Deploy"

#### الطريقة الثانية: من خلال Vercel CLI
```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# النشر
cd tiqtaqo-frontend
vercel --prod
```

### 3️⃣ التحقق من النشر
بعد النشر، ستحصل على رابط مثل:
- `https://tiqtaqo-frontend.vercel.app`
- أو رابط مخصص يمكنك تعيينه لاحقاً

### 4️⃣ إعدادات إضافية (اختيارية)

#### ربط Domain مخصص:
1. اذهب إلى Project Settings
2. اختر "Domains"
3. أضف Domain الخاص بك

#### متغيرات البيئة (Environment Variables):
إذا كنت تحتاج لإضافة متغيرات بيئة:
1. اذهب إلى Project Settings
2. اختر "Environment Variables"
3. أضف المتغيرات المطلوبة

### 5️⃣ النشر التلقائي
✅ **تم تفعيل النشر التلقائي!**
- كل مرة تقوم بعمل `git push` إلى GitHub
- سيتم نشر التحديثات تلقائياً على Vercel

---

## 📊 مقارنة Vercel vs Netlify

| الميزة | Vercel | Netlify |
|--------|--------|---------|
| Bandwidth | 100GB/شهر | 100GB/شهر |
| Build Minutes | Unlimited | 300 دقيقة/شهر |
| السرعة | ⚡ سريع جداً | ⚡ سريع |
| النشر التلقائي | ✅ | ✅ |
| SSL مجاني | ✅ | ✅ |
| الحد الأقصى للمشاريع | Unlimited | Unlimited |

---

## 🔧 الملفات المضافة

- ✅ `vercel.json` - ملف تكوين Vercel
- ✅ `.vercelignore` - ملف تجاهل الملفات غير الضرورية
- ✅ `VERCEL_DEPLOYMENT.md` - هذا الملف (دليل النشر)

---

## 🌐 روابط مهمة

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **Backend API:** https://tiqtaqo-backend-production.up.railway.app/api

---

## ⚠️ ملاحظات مهمة

1. **Backend API:** موقعك يتصل بـ Backend على Railway - تأكد من أن Backend يعمل بشكل صحيح
2. **CORS:** تأكد من أن Backend يسمح بالطلبات من Domain الجديد على Vercel
3. **Environment Variables:** إذا كان لديك متغيرات بيئة، أضفها في إعدادات Vercel

---

## 🎉 تم!

بعد اتباع هذه الخطوات، سيكون موقعك منشوراً على Vercel بنجاح! 🚀
