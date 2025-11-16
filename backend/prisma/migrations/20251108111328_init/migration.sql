/*
  Warnings:

  - A unique constraint covering the columns `[courseId,semesterId,startsAt]` on the table `CourseExam` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `CourseExam_courseId_semesterId_startsAt_key` ON `CourseExam`(`courseId`, `semesterId`, `startsAt`);
