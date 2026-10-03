# RTL Admin Dashboard

داشبورد مدیریتی فارسی و راست‌چین مبتنی بر Next.js، React، TypeScript، Tailwind CSS، Better Auth، Prisma و Microsoft SQL Server.

A Persian RTL administration dashboard built with Next.js, React, TypeScript, Tailwind CSS, Better Auth, Prisma, and Microsoft SQL Server.

---

## راهنمای فارسی

### پیش‌نیازها

- Node.js نسخه `20.9` یا جدیدتر
- Microsoft SQL Server
- دسترسی کاربر SQL Server برای ایجاد دیتابیس در اولین اجرا و تغییر ساختار آن

### تنظیم متغیرهای محیطی

فایل `.env.example` را با نام `.env.local` کپی کنید و مقادیر آن را تغییر دهید:

```powershell
Copy-Item .env.example .env.local
```

متغیرهای مهم:

- `DATABASE_URL`: آدرس SQL Server و نام دیتابیس
- `BETTER_AUTH_SECRET`: کلید امن و تصادفی برای Better Auth
- `BETTER_AUTH_URL`: آدرس اصلی برنامه
- `BETTER_AUTH_TRUSTED_ORIGINS`: آدرس‌های مجاز برای احراز هویت
- `SEED_ADMIN_USERNAME`: نام کاربری ادمین اولیه؛ مقدار پیش‌فرض `admin` است
- `SEED_ADMIN_PASSWORD`: رمز ادمین اولیه با حداقل ۱۲ کاراکتر
- `SEED_OPERATOR_PASSWORD` و `SEED_VIEWER_PASSWORD`: رمز کاربران نمونه محیط توسعه
- `SQLSERVER_BACKUP_DIR`: مسیر اختیاری ذخیره فایل‌های پشتیبان SQL Server

رمزهای Seeder را داخل Git ثبت نکنید. فایل `.env.local` مخصوص همان سیستم یا سرور است.

### اجرای محیط توسعه

```sh
npm install
npm run dev
```

پیش از اجرای سرور توسعه، فرمان `db:setup:dev` خودکار اجرا می‌شود و عملیات زیر را انجام می‌دهد:

1. وجود دیتابیس تنظیم‌شده در `DATABASE_URL` را بررسی می‌کند.
2. اگر دیتابیس وجود نداشته باشد، آن را ایجاد می‌کند.
3. Sequence مربوط به کد مشتری را ایجاد می‌کند.
4. ساختار `prisma/schema.prisma` را با دیتابیس همگام می‌کند.
5. ادمین اولیه را فقط در صورت نبودن ایجاد می‌کند.
6. کاربران نمونه `operator` و `viewer` را فقط در صورت نبودن ایجاد می‌کند.
7. مشتریان و تگ‌های نمونه را فقط در صورت نبودن ایجاد می‌کند.

کاربران معمولی و مشتریان نمونه فقط با فرمان توسعه ساخته می‌شوند و در راه‌اندازی Production ایجاد نخواهند شد.

### اجرای محیط واقعی

ابتدا پروژه را Build و سپس اجرا کنید:

```sh
npm run build
npm start
```

پیش از `npm start`، فرمان امن `db:setup` اجرا می‌شود. این فرمان دیتابیس و schema را آماده می‌کند، اما از داده‌های اولیه فقط ادمین مفقود را ایجاد می‌کند. کاربران معمولی، مشتریان نمونه و تگ‌های نمونه در Production ساخته نمی‌شوند.

برای اجرای دستی:

```sh
npm run db:setup
```

برای ساخت داده‌های نمونه محیط توسعه به‌صورت دستی:

```sh
npm run db:setup:dev
```

### رفتار رمز ادمین

- `SEED_ADMIN_PASSWORD` فقط هنگام ساخت ادمین برای اولین بار استفاده می‌شود.
- اگر ادمین از قبل وجود داشته باشد، Seeder نام، نقش، وضعیت یا رمز او را تغییر نمی‌دهد.
- اگر رمز ادمین از داخل برنامه یا مستقیماً در دیتابیس تغییر کند، اجرای مجدد برنامه آن را بازنشانی نمی‌کند.
- برای ادمین موجود، نبودن `SEED_ADMIN_PASSWORD` مانع اجرای برنامه نمی‌شود.
- اگر ادمین وجود نداشته باشد، `SEED_ADMIN_PASSWORD` باید حداقل ۱۲ کاراکتر داشته باشد.

### فونت

پروژه از فونت `Vazirmatn` توسط `next/font/google` استفاده می‌کند. نصب فونت روی Windows یا Server و کپی دستی آن در پوشه خاصی لازم نیست. Next.js فونت را هنگام Build دریافت و همراه خروجی برنامه مدیریت می‌کند.

اگر سرور هنگام `npm run build` به اینترنت دسترسی ندارد، باید فایل فونت داخل پروژه قرار داده شود و پیکربندی از `next/font/google` به `next/font/local` تغییر کند.

### حذف نرم

موجودیت‌های اصلی از فیلدهای `isDeleted` و `deletedAt` برای حذف نرم استفاده می‌کنند. حذف کاربر اطلاعات احراز هویت او را نگه می‌دارد، اما دسترسی وی را مسدود می‌کند. حذف دائمی فقط باید برای عملیات مدیریتی یا بازیابی ویژه استفاده شود.

### پشتیبان‌گیری

ادمین می‌تواند خروجی JSON برنامه یا فایل بومی `.bak` مربوط به SQL Server را از صفحه Backup دریافت کند. مسیر پیش‌فرض فایل‌های موقت `sql-backups` است. برای تغییر آن، `SQLSERVER_BACKUP_DIR` را روی یک مسیر مطلق تنظیم کنید که هم سرویس SQL Server اجازه نوشتن و هم برنامه اجازه خواندن آن را داشته باشد.

---

## English Guide

### Requirements

- Node.js `20.9` or newer
- Microsoft SQL Server
- A SQL Server identity allowed to create the configured database on first run and update its schema

### Environment configuration

Copy `.env.example` to `.env.local` and replace the example values:

```powershell
Copy-Item .env.example .env.local
```

Important variables:

- `DATABASE_URL`: SQL Server connection string and database name
- `BETTER_AUTH_SECRET`: a secure random secret for Better Auth
- `BETTER_AUTH_URL`: the primary application URL
- `BETTER_AUTH_TRUSTED_ORIGINS`: origins allowed to use authentication
- `SEED_ADMIN_USERNAME`: initial administrator username; defaults to `admin`
- `SEED_ADMIN_PASSWORD`: initial administrator password with at least 12 characters
- `SEED_OPERATOR_PASSWORD` and `SEED_VIEWER_PASSWORD`: development sample-user passwords
- `SQLSERVER_BACKUP_DIR`: optional SQL Server backup output directory

Never commit seed passwords. `.env.local` is specific to each machine or server.

### Development

```sh
npm install
npm run dev
```

Before the development server starts, `db:setup:dev` automatically:

1. Checks whether the database configured in `DATABASE_URL` exists.
2. Creates the database when it is missing.
3. Creates the customer-code sequence.
4. Synchronizes `prisma/schema.prisma` with the database.
5. Creates the initial administrator only when missing.
6. Creates the sample `operator` and `viewer` users only when missing.
7. Creates sample customers and starter tags only when missing.

Regular sample users and sample customers are development-only and are not created by the production setup.

### Production

Build and start the application:

```sh
npm run build
npm start
```

Before `npm start`, the production-safe `db:setup` command prepares the database and schema. From the seed data, it creates only a missing administrator. It does not create regular users, sample customers, or starter tags.

Run the production-safe setup manually with:

```sh
npm run db:setup
```

Create development sample data manually with:

```sh
npm run db:setup:dev
```

### Administrator password behavior

- `SEED_ADMIN_PASSWORD` is used only when the administrator is created for the first time.
- When the administrator already exists, the seed process does not modify its name, role, status, or password.
- Restarting the application never resets an administrator password changed through the application or database.
- An existing administrator does not require `SEED_ADMIN_PASSWORD` to be present during startup.
- When the administrator is missing, `SEED_ADMIN_PASSWORD` must contain at least 12 characters.

### Font

The project loads `Vazirmatn` through `next/font/google`. You do not need to install the font on Windows or the server, and no manual folder copy is required. Next.js downloads and bundles the font during the build.

If the build server has no internet access, store the font files in the project and replace `next/font/google` with `next/font/local`.

### Soft deletion

Main entities use `isDeleted` and `deletedAt` for soft deletion. Removing a user preserves authentication history while blocking access. Permanent deletion should remain limited to explicit administrative or recovery operations.

### Backups

Administrators can download a JSON export or create a native SQL Server `.bak` file from the Backup page. Temporary backup files use `sql-backups` by default. To override it, set `SQLSERVER_BACKUP_DIR` to an absolute path writable by the SQL Server service and readable by the application.

## Useful commands / فرمان‌های کاربردی

| Command | Description |
| --- | --- |
| `npm run dev` | اجرای محیط توسعه همراه داده‌های نمونه / Start development with sample data |
| `npm run build` | ساخت نسخه Production / Create the production build |
| `npm start` | اجرای Production همراه راه‌اندازی امن دیتابیس / Start production with safe database setup |
| `npm run db:setup` | ساخت دیتابیس، schema و فقط ادمین / Prepare database, schema, and admin only |
| `npm run db:setup:dev` | راه‌اندازی دیتابیس همراه داده‌های نمونه / Prepare database with development sample data |
| `npm run db:seed` | ایجاد ادمین مفقود / Create the missing administrator |
| `npm run db:seed:dev` | ایجاد داده‌های نمونه مفقود / Create missing development sample data |
| `npm run typecheck` | بررسی TypeScript / Run TypeScript checks |
