-- AlterTable User: add hall field
ALTER TABLE "User" ADD COLUMN "hall" TEXT;

-- AlterTable EventRegistration: add studentId, department, hall fields
ALTER TABLE "EventRegistration" ADD COLUMN "studentId" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN "department" TEXT;
ALTER TABLE "EventRegistration" ADD COLUMN "hall" TEXT;
