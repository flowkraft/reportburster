-- CreateTable
CREATE TABLE "rbcom_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rbcom_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "rbcom_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rbcom_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "rbcom_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "rbcom_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rbcom_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_current_period_end" DATETIME
);

-- CreateTable
CREATE TABLE "rbcom_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rbcom_forms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "form_type" TEXT NOT NULL,
    "form_data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rbcom_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "rbcom_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "rbcom_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_accounts_provider_providerAccountId_key" ON "rbcom_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_sessions_sessionToken_key" ON "rbcom_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_users_email_key" ON "rbcom_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_users_stripe_customer_id_key" ON "rbcom_users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_users_stripe_subscription_id_key" ON "rbcom_users"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_verification_tokens_token_key" ON "rbcom_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "rbcom_verification_tokens_identifier_token_key" ON "rbcom_verification_tokens"("identifier", "token");
