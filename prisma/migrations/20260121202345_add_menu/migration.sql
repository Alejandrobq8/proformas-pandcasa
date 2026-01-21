-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('BOCADILLOS', 'POSTRES', 'QUEQUES');

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "MenuCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuItem_userId_category_idx" ON "MenuItem"("userId", "category");

-- CreateIndex
CREATE INDEX "MenuItem_userId_name_idx" ON "MenuItem"("userId", "name");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
