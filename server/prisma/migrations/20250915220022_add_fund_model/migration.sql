-- CreateTable
CREATE TABLE "public"."funds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "strategy" TEXT,
    "targetSize" DOUBLE PRECISION NOT NULL,
    "minimumCommitment" DOUBLE PRECISION,
    "managementFee" DOUBLE PRECISION,
    "carriedInterest" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "vintage" INTEGER,
    "investmentPeriod" INTEGER,
    "fundTerm" INTEGER,
    "geoFocus" TEXT,
    "sectorFocus" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pre-Launch',
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "investorCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funds_pkey" PRIMARY KEY ("id")
);
