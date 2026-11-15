# انتشار مرکز آپدیت سپهریار

هدف: نگهداری کد در مخزن خصوصی GitHub و اجرای سایت در Cloudflare Workers با دانلود عمومی و بارگذاری فقط با رمز مدیریت.

## وضعیت

فایل‌های انتشار آماده‌اند؛ ایجاد مخزن GitHub، منابع Cloudflare و انتقال داده‌ها به ورود صاحب حساب نیاز دارند. وجود workflow به معنی انتشار موفق نیست.

## تنظیمات GitHub

در محیط `production` این Variables را تنظیم کنید:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_D1_DATABASE_NAME` (پیش‌فرض `sepehryar-updates-db`)
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_WORKER_NAME` (پیش‌فرض `sepehryar-updates`)

Secrets محیط `production`:

- `CLOUDFLARE_API_TOKEN`: دسترسی انتشار Worker و اجرای migration دیتابیس همان حساب.
- `UP_ADMIN_TOKEN`: رمز تصادفی مدیریت، حداقل ۳۲ کاراکتر؛ در فرم بارگذاری وارد می‌شود.

پس از ساخت D1 و R2 و تکمیل انتقال اطلاعات، Repository Variable به نام `CLOUDFLARE_DEPLOY_ENABLED` را `true` کنید. Workflow روی push به `main` یا اجرای دستی فعال می‌شود.

## اجرای انتشار

پس از فراهم شدن متغیرها و secrets در محیط اجرا:

```sh
npm run build
node scripts/configure-cloudflare.mjs
node scripts/deploy-cloudflare.mjs
```

اسکریپت ابتدا migrationهای D1 را اجرا می‌کند، Worker را منتشر می‌کند و رمز مدیریت را از stdin به Wrangler می‌دهد. رمز در فایل تنظیمات تولیدشده نوشته نمی‌شود. تا تنظیم رمز، بارگذاری اینترنتی با خطای 503 مسدود است. خواندن لیست و دانلود عمومی است. در اجرای توسعهٔ محلی، رفتار قبلی شبکه حفظ می‌شود.

## داده‌های قبلی

اطلاعات `.wrangler/state` و فایل‌های R2 محلی همراه Git منتقل نمی‌شوند. پیش از اعلام پایان مهاجرت، جدول `releases` و اشیای R2 باید با همان شناسه‌ها و کلیدها منتقل شوند و دانلود فایل‌های قبلی آزمایش شود. پوشهٔ `outputs` برای نسخه‌های پشتیبان محلی در Git نادیده گرفته می‌شود.

نسخهٔ قبلی Sites و remote داخلی Git هنگام آماده‌سازی تغییر نکرده‌اند.
