# Fix: "Network Error" on Register/Login (Vercel ↔ Railway)

**التاريخ / Date:** 2026-06-04
**الأعراض / Symptom:** عند إنشاء حساب على `https://nextlearn-saas.vercel.app/register`
تظهر رسالة **"Network Error"** (انظر لقطة الشاشة). نفس المشكلة تحصل على
تسجيل الدخول وأي طلب من المتصفح للـ backend.

---

## 1. السبب الجذري / Root cause

الـ frontend (Vercel) يتكلم مع الـ backend (Railway) من المتصفح مباشرة:

```
المتصفح → axios (client/lib/api-client.ts) → NEXT_PUBLIC_API_URL → Express (Railway)
```

"Network Error" معناها إن الطلب **لم يصل لرد من السيرفر إطلاقًا** (status = 0).
هذا ليس باجًا في الكود — هو أحد ثلاثة إعدادات نشر:

| # | السبب | الإصلاح | مكان الإصلاح |
|---|-------|---------|--------------|
| **A** | `NEXT_PUBLIC_API_URL` غير مضبوط على Vercel (أو مضبوط بعد آخر build) فالكود يستخدم `http://localhost:5000` | اضبطه على رابط Railway + أعد الـ Deploy | **Vercel** |
| **B** | الـ backend على Railway لا يسمح لدومين Vercel في CORS | اضبط `CLIENT_URL` / `ALLOWED_ORIGINS` | **Railway** |
| **C** | الـ backend نفسه واقع / غير سليم | تأكد من `/health` | **Railway** |

> ⚠️ **مهم جدًا:** متغيرات `NEXT_PUBLIC_*` تُحقَن وقت الـ **build** مش وقت التشغيل.
> لو ضفت/عدّلت `NEXT_PUBLIC_API_URL` على Vercel لازم تعمل **Redeploy** (build جديد)
> عشان القيمة تتحدث في الـ bundle. مجرد إضافتها مش كفاية.

---

## 2. تحسينات الكود في هذا الـ commit / Code changes

1. **`server/src/config/env.ts`** — `allowedOrigins` بقى يضم `CLIENT_URL`
   تلقائيًا (مع إزالة الـ trailing slash و التكرار). ده يمنع أشهر خطأ: تضبط
   `CLIENT_URL` على دومين Vercel وتنسى `ALLOWED_ORIGINS` → السيرفر يرفض الـ
   frontend بتاعه. دلوقتي ضبط `CLIENT_URL` لوحده كفاية.

2. **`client/lib/api-client.ts`** — لما الطلب ما يوصلش رد (Network/CORS) المستخدم
   يشوف رسالة واضحة فيها رابط الـ API المطلوب بدل "Network Error" المبهمة، فيبقى
   سهل تشخيص الخطأ من شاشة المستخدم.

---

## 3. خطوات الإصلاح بالظبط / Exact steps

### الخطوة 1 — تأكد إن الـ backend شغال (Railway)

افتح في المتصفح:

```
https://<your-railway-domain>/health
```

المفروض يرجّع `{"status":"ok"}`. لو مرجّعش → المشكلة في الـ backend نفسه
(راجع لوجات Railway و `docs/RAILWAY_DEPLOYMENT_GUIDE.md`).

### الخطوة 2 — اضبط متغيرات Railway (Backend)

في Railway → Service (server) → **Variables**، تأكد من:

| المتغير | القيمة |
|---------|--------|
| `CLIENT_URL` | `https://nextlearn-saas.vercel.app` |
| `ALLOWED_ORIGINS` | `https://nextlearn-saas.vercel.app` (افصل بفاصلة لو فيه أكثر من دومين) |
| `MONGODB_URI` | رابط Mongo بتاعك (لازم يحتوي اسم الـ DB، مثلًا `.../nextlearn`) |
| `JWT_ACCESS_SECRET` | 32 حرف على الأقل |
| `JWT_REFRESH_SECRET` | 32 حرف على الأقل |

> بعد تحديث المتغيرات Railway هيعمل redeploy تلقائي. بفضل تعديل الكود ده،
> لو ضبطت `CLIENT_URL` بس، الـ CORS هيسمح بدومين Vercel برضه.

> 💡 لو بتستخدم Vercel Preview deployments (روابط بتتغير زي
> `nextlearn-saas-git-xxx.vercel.app`)، ضيفها كمان في `ALLOWED_ORIGINS`
> مفصولة بفاصلة، لأن كل preview ليه دومين مختلف.

### الخطوة 3 — اضبط متغيرات Vercel (Frontend)

في Vercel → Project → **Settings → Environment Variables** (Production):

| المتغير | القيمة |
|---------|--------|
| `NEXT_PUBLIC_API_URL` | `https://<your-railway-domain>/api/v1` ← **لازم ينتهي بـ `/api/v1`** |
| `NEXT_PUBLIC_SOCKET_URL` | `https://<your-railway-domain>` (من غير `/api/v1`) |
| `NEXT_PUBLIC_APP_URL` | `https://nextlearn-saas.vercel.app` |
| `NEXT_PUBLIC_TENANT_ID` | الـ ObjectId بتاع الـ tenant في قاعدة بيانات الإنتاج |
| `AUTH_SECRET` | سر NextAuth (`openssl rand -base64 32`) |

> ⚠️ غلطة شائعة: نسيان `/api/v1` في آخر `NEXT_PUBLIC_API_URL` → كل الطلبات 404.

### الخطوة 4 — أعد النشر (Redeploy) على Vercel

Vercel → Deployments → آخر deployment → **⋯ → Redeploy**
(تأكد إن خيار "Use existing Build Cache" **مقفول** عشان يلتقط الـ env الجديد).

### الخطوة 5 — تأكد إن الـ tenant موجود في الإنتاج

`NEXT_PUBLIC_TENANT_ID` لازم يطابق tenant فعلي في قاعدة بيانات الإنتاج.
لو قاعدة بيانات Railway جديدة وفاضية، شغّل الـ seed مرة واحدة (locally موجّه على
نفس `MONGODB_URI` بتاع الإنتاج، أو من Railway shell):

```bash
cd server
npm run seed:tenant     # ينشئ الـ tenant ويطبع الـ id
npm run seed:courses    # (اختياري) كورسات تجريبية
```

خد الـ tenant id المطبوع وحطه في `NEXT_PUBLIC_TENANT_ID` على Vercel ثم Redeploy.

---

## 4. التحقق / Verify

1. افتح `https://<railway>/health` → `{"status":"ok"}` ✅
2. افتح DevTools (F12) → تبويب **Network** على صفحة register، جرّب التسجيل،
   وشوف طلب `auth/register`:
   - **لو الرابط `localhost`** → `NEXT_PUBLIC_API_URL` لسه مش متطبّق (أعد الـ build).
   - **لو CORS error** → الدومين مش في `ALLOWED_ORIGINS`/`CLIENT_URL` على Railway.
   - **لو 201/200** → اتحلّت ✅ (هتشوف شاشة "Check your email").

---

## 5. ملخص سريع / TL;DR

```
Railway:  CLIENT_URL = https://nextlearn-saas.vercel.app
          (+ ALLOWED_ORIGINS لو فيه دومينات إضافية)

Vercel:   NEXT_PUBLIC_API_URL    = https://<railway>/api/v1   ← /api/v1 مهم
          NEXT_PUBLIC_SOCKET_URL = https://<railway>
          NEXT_PUBLIC_APP_URL    = https://nextlearn-saas.vercel.app
          NEXT_PUBLIC_TENANT_ID  = <prod tenant ObjectId>
          AUTH_SECRET            = <random base64>
          → ثم Redeploy من غير build cache
```
