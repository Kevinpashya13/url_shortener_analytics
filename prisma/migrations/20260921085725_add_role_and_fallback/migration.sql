-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STANDARD', 'PRO', 'PREMIUM', 'ADMIN');

-- AlterTable
ALTER TABLE "urls" ADD COLUMN     "fallbackUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STANDARD';
