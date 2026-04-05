# MS test

MS test is a full-stack crowdtesting platform built with Next.js App Router. Clients create software testing campaigns, testers submit bugs with local file attachments, moderators review quality and duplicates, test managers validate final reports, and admins manage the platform.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- MySQL / MariaDB
- Prisma 7
- JWT cookie authentication
- Local filesystem uploads in `/uploads`

## Core platform areas

- Public marketing pages: home, about, how it works, signup, login
- Client pages: dashboard, create campaign, reports
- Tester pages: profile, available campaigns, workspace, bug submission
- Moderator pages: review queue, campaign moderation
- Test manager pages: dashboard, validation, reports
- Admin pages: users, campaigns, settings
- REST API routes for auth, campaigns, bugs, uploads, and secure file reads
- Server Actions for signup, login, campaign creation, and bug submission

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` in `.env` to point at your MySQL or MariaDB server.

4. Generate the Prisma client:

```bash
npm run db:generate
```

5. Push the schema to your database:

```bash
npm run db:push
```

6. Seed sample data if desired:

```bash
npm run db:seed
```

7. Start the development server:

```bash
npm run dev
```

## Environment variables

See [.env.example](/C:/Users/10072/Documents/projects/MS_teste/.env.example).

- `DATABASE_URL`: MySQL or MariaDB connection string
- `JWT_SECRET`: secret used for signed JWT session cookies
- `APP_URL`: base URL for links and deployment
- `UPLOAD_DIR`: kept for config compatibility, but the app stores files under `/uploads`
- `MAX_UPLOAD_MB`: max file size accepted by upload handlers
- `CROWD_TESTER_BASE_PRICE`: price estimator base for crowd testers
- `DEVELOPER_TESTER_BASE_PRICE`: price estimator base for developer testers
- `COUNTRY_MULTIPLIER_STEP`: added per extra selected country
- `PLATFORM_MULTIPLIER_STEP`: added per extra selected platform

## Upload storage

Uploads are stored directly on the server filesystem:

- `uploads/screenshots`
- `uploads/videos`
- `uploads/logs`
- `uploads/attachments`

Files are written with UUID-based filenames and exposed through the authenticated file route:

- `GET /api/files/[...segments]`

## Demo seed accounts

After running `npm run db:seed`, you can use:

- `admin@mstest.local`
- `client@mstest.local`
- `manager@mstest.local`
- `moderator@mstest.local`
- `tester@mstest.local`

Password for all demo accounts:

- `password123`

## Hostinger deployment notes

- The app is configured with `output: "standalone"` in [next.config.ts](/C:/Users/10072/Documents/projects/MS_teste/next.config.ts).
- Deploy it as a standard Node.js app, not an edge-only deployment.
- Provision MySQL or MariaDB on Hostinger and set `DATABASE_URL` on the server.
- Ensure the `uploads` directory exists and remains writable by the Node.js process.
- Persist the `uploads` directory between deployments if your Hostinger setup replaces the app directory on each release.
- Run `npm run db:generate` during build and `npm run db:push` during provisioning or release automation.

## Validation status

Verified locally:

- `npm run db:generate`
- `npm run lint`
- `npm run build`

Not verified locally:

- `npm run db:push`
- `npm run db:seed`

Those two commands require a reachable MySQL or MariaDB instance.
