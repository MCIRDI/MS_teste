# Hostinger deployment commands

This project is configured for MySQL/MariaDB on Hostinger.

## Environment variables

Set these in Hostinger before running the build:

```env
DATABASE_URL="mysql://u577165078_abdallah:hAbdallah10072003@localhost:3306/u577165078_MS_teste"
JWT_SECRET="replace-this-with-a-long-random-secret"
APP_URL="https://your-domain.tld"
UPLOAD_DIR="uploads"
MAX_UPLOAD_MB="50"
CROWD_TESTER_BASE_PRICE="35"
DEVELOPER_TESTER_BASE_PRICE="85"
COUNTRY_MULTIPLIER_STEP="0.08"
PLATFORM_MULTIPLIER_STEP="0.05"
```

I treated the trailing `.` in your message after the password as sentence punctuation, not as part of the actual password.

## Commands to run on Hostinger

Run these once on deployment:

```sh
mkdir -p uploads uploads/screenshots uploads/videos uploads/logs uploads/attachments
npm install
npm run db:generate
npm run db:push
npm run build
```

Start the application with:

```sh
npm run start
```

If you want demo users in a non-production environment, run this separately:

```sh
npm run db:seed
```

You can also use the prepared script:

```sh
sh scripts/hostinger-deploy.sh
```
