-- CreateTable
CREATE TABLE "public"."lp_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "criteria" JSONB,
    "autoAssign" BOOLEAN NOT NULL DEFAULT false,
    "emailPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lp_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."investor_group_members" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoAssigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "investor_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investor_group_members_investorId_groupId_key" ON "public"."investor_group_members"("investorId", "groupId");

-- AddForeignKey
ALTER TABLE "public"."investors" ADD CONSTRAINT "investors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funds" ADD CONSTRAINT "funds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lp_groups" ADD CONSTRAINT "lp_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."investor_group_members" ADD CONSTRAINT "investor_group_members_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "public"."investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."investor_group_members" ADD CONSTRAINT "investor_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."lp_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
