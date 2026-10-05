/*
  Warnings:

  - You are about to drop the column `duration` on the `plans` table. All the data in the column will be lost.
  - Added the required column `subscription_id` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `membership` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlanTypes" AS ENUM ('BASIC', 'PREMIUM');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "subscription_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "duration",
DROP COLUMN "name",
ADD COLUMN     "name" "PlanTypes" NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "membership" "MembershipTypes" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
