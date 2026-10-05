/*
  Warnings:

  - You are about to drop the column `price` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "price";

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "membership" "MembershipTypes" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_plan_id_membership_key" ON "plan_prices"("plan_id", "membership");

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
