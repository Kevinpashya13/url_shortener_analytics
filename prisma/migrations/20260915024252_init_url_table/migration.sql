-- CreateTable
CREATE TABLE "urls" (
    "id" SERIAL NOT NULL,
    "shortcode" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "customAlias" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3),
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "urls_shortcode_key" ON "urls"("shortcode");
