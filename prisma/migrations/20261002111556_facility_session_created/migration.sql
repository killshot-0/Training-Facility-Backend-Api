-- CreateTable
CREATE TABLE "facility_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3),

    CONSTRAINT "facility_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facility_sessions_user_id_idx" ON "facility_sessions"("user_id");

-- CreateIndex
CREATE INDEX "facility_sessions_facility_id_idx" ON "facility_sessions"("facility_id");

-- AddForeignKey
ALTER TABLE "facility_sessions" ADD CONSTRAINT "facility_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_sessions" ADD CONSTRAINT "facility_sessions_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
