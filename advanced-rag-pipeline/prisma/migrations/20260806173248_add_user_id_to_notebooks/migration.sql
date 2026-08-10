/*
  Warnings:

  - Added the required column `userId` to the `Notebook` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notebook" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Notebook_userId_idx" ON "Notebook"("userId");
