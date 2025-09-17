/*
  Warnings:

  - The `scope` column on the `integrations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."integrations" DROP COLUMN "scope",
ADD COLUMN     "scope" TEXT[];
