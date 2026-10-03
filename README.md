# RTL Admin Dashboard

A Next.js App Router starter for a Persian, dark-only admin dashboard. The app uses Next.js 16.3, React 19.3, TypeScript 7, Tailwind CSS 4, Better Auth 1.7, Microsoft SQL Server, Drizzle ORM, and Sonner.

## Local setup

Use Node.js 20.9 or later and SQL Server on Windows. `.env.local` is configured for Windows Integrated Authentication: Prisma uses the Windows identity running the Next.js process, so no `sa` username or SQL password is needed. Set `BETTER_AUTH_SECRET` to a long random value before deployment. Create the `dashboard` database with your SQL Server administrator if it does not exist, then run `npm run db:generate` and `npm run db:push`.

```sh
npm install
npx auth migrate
npx auth create-admin --email bootstrap-admin@users.invalid --name "System Admin" --role admin --data '{"username":"admin","displayUsername":"admin"}'
npm run dev
```

Better Auth's migration creates the user, session, account, verification, username-plugin, and admin-plugin fields declared in `lib/auth.ts`. The Drizzle schema maps that same MSSQL `user` table, so dashboard-managed users and the initial CLI-created administrator share one record and one soft-delete state. The bootstrap command assigns the first admin the username `admin`; users can sign in with that username. Registration is disabled in the sign-in UI and in Better Auth.

If you are adding this change to a database that already has accounts, assign a distinct username to each existing account after running the migration and before switching users to username login. For example: `UPDATE [user] SET username = 'admin', displayUsername = 'admin' WHERE email = 'admin@example.com' AND username IS NULL;`.

The login and admin user form use usernames. Better Auth's account-creation API still requires an email field, so the server creates a random, non-deliverable address under the reserved `.invalid` domain internally. No email address is requested or used for login. Usernames are 3–30 characters and accept Unicode letters (including Persian), numbers, dots, underscores, and hyphens.

## Structure

```text
app/
  api/auth/[...all]/route.ts   Better Auth handlers
  login/page.tsx               Login only; no public registration
  users/layout.tsx             Auth and admin gate; fixed shell
  users/page.tsx               User management route
components/
  sidebar.tsx                  Right-side navigation and logout
  users-table.tsx              Search, CRUD dialogs, actions, toasts
  ui/                          Radix-backed Dialog components
db/
  schema.ts                    Drizzle model of Better Auth's extended MSSQL user table
  users-repository.ts          Soft-delete repository boundary
lib/
  actions/users.ts             Validated, admin-only server actions
  auth.ts                      Better Auth + MSSQL Kysely dialect
```

## Soft deletion

Application entities use `isDeleted` and nullable `deletedAt`. All user reads and mutations go through `createUsersRepository`: routine reads filter deleted records, `delete` writes the deletion flags and timestamp, and `hardDelete` is an explicit escape hatch. The `includeDeleted: true` option is available for audit/recovery reads. Avoid issuing direct Drizzle queries against soft-deletable entities in feature code. User removal also bans the corresponding Better Auth account, preserving its authentication data while preventing further sign-ins.

`prisma/schema.prisma` defines Better Auth's SQL Server tables and user fields, including `isActive`, `isDeleted`, and `deletedAt`. The user repository applies soft-delete filtering and exposes `includeDeleted` and `hardDelete` only as explicit recovery operations. User removal also bans the account, preserving authentication history while blocking future sign-ins.

## Backups

Administrators can download the application JSON export or create a native SQL Server `.bak` from the Backup page. The `.bak` is created in the project-local `sql-backups` directory by default. Set `SQLSERVER_BACKUP_DIR` in `.env.local` to override that directory; the path must be absolute, writable by the SQL Server service account, and readable by the Next.js process. SQL Server backup permissions are also required for the application's database login. The application streams the generated `.bak` to the browser and removes the temporary file afterward.

## Layout behavior

The document and app shell occupy the viewport with overflow hidden. The authenticated shell has a fixed-height right sidebar and a `min-w-0 flex-1` content region with vertical scrolling only. Table overflow is contained within the table wrapper on narrow screens.
