-- CreateTable
CREATE TABLE "public"."teams_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "messageId" TEXT NOT NULL,
    "chatId" TEXT,
    "channelId" TEXT,
    "teamId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "importance" TEXT NOT NULL DEFAULT 'normal',
    "messageType" TEXT NOT NULL,
    "attachments" JSONB,
    "mentions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams_channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "webUrl" TEXT,
    "memberCount" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."slack_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT,
    "fromUserId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'message',
    "threadTs" TEXT,
    "attachments" JSONB,
    "reactions" JSONB,
    "mentions" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."slack_channels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "topic" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "memberCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zoom_meetings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "meetingId" TEXT NOT NULL,
    "uuid" TEXT,
    "topic" TEXT NOT NULL,
    "agenda" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL,
    "joinUrl" TEXT,
    "startUrl" TEXT,
    "password" TEXT,
    "hostEmail" TEXT,
    "participantCount" INTEGER,
    "hasRecording" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zoom_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."zoom_participants" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "zoomUserId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "joinTime" TIMESTAMP(3) NOT NULL,
    "leaveTime" TIMESTAMP(3),
    "duration" INTEGER,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zoom_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salesforce_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingCountry" TEXT,
    "description" TEXT,
    "revenue" DOUBLE PRECISION,
    "employees" INTEGER,
    "ownerId" TEXT,
    "metadata" JSONB,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salesforce_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salesforce_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "department" TEXT,
    "leadSource" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "metadata" JSONB,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salesforce_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salesforce_opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT,
    "opportunityId" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "stage" TEXT NOT NULL,
    "probability" DOUBLE PRECISION,
    "closeDate" TIMESTAMP(3),
    "type" TEXT,
    "leadSource" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "metadata" JSONB,
    "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salesforce_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_messages_messageId_key" ON "public"."teams_messages"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_channels_channelId_key" ON "public"."teams_channels"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "slack_messages_messageId_key" ON "public"."slack_messages"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "slack_channels_channelId_key" ON "public"."slack_channels"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "zoom_meetings_meetingId_key" ON "public"."zoom_meetings"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "salesforce_accounts_accountId_key" ON "public"."salesforce_accounts"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "salesforce_contacts_contactId_key" ON "public"."salesforce_contacts"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "salesforce_opportunities_opportunityId_key" ON "public"."salesforce_opportunities"("opportunityId");

-- AddForeignKey
ALTER TABLE "public"."teams_messages" ADD CONSTRAINT "teams_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams_messages" ADD CONSTRAINT "teams_messages_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams_messages" ADD CONSTRAINT "teams_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams_channels" ADD CONSTRAINT "teams_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."slack_messages" ADD CONSTRAINT "slack_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."slack_messages" ADD CONSTRAINT "slack_messages_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."slack_messages" ADD CONSTRAINT "slack_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."slack_channels" ADD CONSTRAINT "slack_channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zoom_meetings" ADD CONSTRAINT "zoom_meetings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zoom_meetings" ADD CONSTRAINT "zoom_meetings_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zoom_participants" ADD CONSTRAINT "zoom_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."zoom_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."zoom_participants" ADD CONSTRAINT "zoom_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_accounts" ADD CONSTRAINT "salesforce_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_accounts" ADD CONSTRAINT "salesforce_accounts_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_contacts" ADD CONSTRAINT "salesforce_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_contacts" ADD CONSTRAINT "salesforce_contacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."salesforce_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_opportunities" ADD CONSTRAINT "salesforce_opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_opportunities" ADD CONSTRAINT "salesforce_opportunities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salesforce_opportunities" ADD CONSTRAINT "salesforce_opportunities_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."salesforce_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
