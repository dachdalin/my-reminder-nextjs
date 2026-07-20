/* eslint-disable @typescript-eslint/no-require-imports */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  let connString;

  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/DATABASE_URL=['"']?([^'"\n]+)['"']?/);
      if (match && match[1]) {
        connString = match[1].trim();
      }
    }
  } catch (e) {
    console.error('Failed to read .env file:', e);
  }

  if (!connString) {
    connString = process.env.DATABASE_URL;
  }

  if (!connString) {
    console.error('Error: DATABASE_URL not found in .env or environment variables.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  
  // Neon requires SSL. We rely on sslmode=require in the connectionString, 
  // but we also pass ssl: true or ssl: { rejectUnauthorized: false } as fallback.
  const pool = new Pool({
    connectionString: connString,
    ssl: connString.includes('sslmode=') ? undefined : { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected successfully. Creating tables...');

    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "place" TEXT NOT NULL,
        "participants" TEXT NOT NULL,
        "meetingDate" DATE NOT NULL,
        "sentAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "telegramConnection" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "telegramChatId" TEXT NOT NULL,
        "telegramUserId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "place" TEXT;
      ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "participants" TEXT;
      ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "meetingDate" DATE;
      ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP;
      ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "meetingTime" TEXT;

      UPDATE "reminders"
      SET "place" = ''
      WHERE "place" IS NULL;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'reminders'
            AND column_name = 'description'
        ) THEN
          UPDATE "reminders"
          SET "participants" = COALESCE("description", '')
          WHERE "participants" IS NULL;
        ELSE
          UPDATE "reminders"
          SET "participants" = ''
          WHERE "participants" IS NULL;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'reminders'
            AND column_name = 'scheduledTime'
        ) THEN
          UPDATE "reminders"
          SET "meetingDate" = COALESCE("scheduledTime"::date, CURRENT_DATE)
          WHERE "meetingDate" IS NULL;
        ELSE
          UPDATE "reminders"
          SET "meetingDate" = CURRENT_DATE
          WHERE "meetingDate" IS NULL;
        END IF;
      END $$;

      ALTER TABLE "reminders" ALTER COLUMN "place" SET NOT NULL;
      ALTER TABLE "reminders" ALTER COLUMN "participants" SET NOT NULL;
      ALTER TABLE "reminders" ALTER COLUMN "meetingDate" SET NOT NULL;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'reminders'
            AND column_name = 'scheduledTime'
        ) THEN
          ALTER TABLE "reminders" ALTER COLUMN "scheduledTime" DROP NOT NULL;
        END IF;
      END $$;
    `;

    await client.query(createTablesQuery);
    console.log('✅ Tables created/verified successfully!');

    // Show tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Available tables now:', res.rows.map(r => r.table_name).join(', '));

    client.release();
  } catch (err) {
    console.error('❌ Error executing SQL:', err);
  } finally {
    await pool.end();
  }
}

run();
