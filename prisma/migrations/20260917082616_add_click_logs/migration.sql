-- CreateTable
CREATE TABLE "click_logs" (
    "id" SERIAL NOT NULL,
    "urlId" INTEGER NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "country" TEXT,

    CONSTRAINT "click_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "click_logs_urlId_idx" ON "click_logs"("urlId");

-- CreateIndex
CREATE INDEX "click_logs_clickedAt_idx" ON "click_logs"("clickedAt");

-- AddForeignKey
ALTER TABLE "click_logs" ADD CONSTRAINT "click_logs_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
