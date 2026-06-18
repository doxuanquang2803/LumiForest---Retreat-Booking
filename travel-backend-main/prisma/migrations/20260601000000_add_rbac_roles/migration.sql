-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING role::text::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

