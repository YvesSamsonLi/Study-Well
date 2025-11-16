-- CreateTable
CREATE TABLE `Student` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Student_email_key`(`email`),
    INDEX `Student_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Preferences` (
    `studentId` VARCHAR(191) NOT NULL,
    `outdoorAllowed` BOOLEAN NOT NULL DEFAULT true,
    `nudgeWindowStart` INTEGER NOT NULL DEFAULT 9,
    `nudgeWindowEnd` INTEGER NOT NULL DEFAULT 21,
    `quietHoursStart` INTEGER NOT NULL DEFAULT 23,
    `quietHoursEnd` INTEGER NOT NULL DEFAULT 7,
    `timezone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Semester` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `academicYearShort` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NOT NULL,
    `semesterNo` INTEGER NOT NULL,
    `startsOn` DATETIME(3) NOT NULL,
    `endsOn` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Semester_name_key`(`name`),
    INDEX `Semester_startsOn_idx`(`startsOn`),
    INDEX `Semester_endsOn_idx`(`endsOn`),
    INDEX `Semester_semesterNo_idx`(`semesterNo`),
    INDEX `Semester_academicYearShort_idx`(`academicYearShort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicCalEvent` (
    `id` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `kind` ENUM('TEACHING_WEEK', 'RECESS_WEEK', 'EXAM_WEEK', 'PUBLIC_HOLIDAY', 'STUDY_WEEK') NOT NULL,
    `title` LONGTEXT NOT NULL,
    `notes` TEXT NULL,
    `weekNo` INTEGER NULL,
    `startsOn` DATETIME(3) NOT NULL,
    `endsOn` DATETIME(3) NOT NULL,
    `month` INTEGER NULL,
    `weekday` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AcademicCalEvent_semesterId_startsOn_idx`(`semesterId`, `startsOn`),
    INDEX `AcademicCalEvent_semesterId_weekNo_idx`(`semesterId`, `weekNo`),
    INDEX `AcademicCalEvent_month_idx`(`month`),
    INDEX `AcademicCalEvent_weekday_idx`(`weekday`),
    UNIQUE INDEX `AcademicCalEvent_semesterId_startsOn_kind_key`(`semesterId`, `startsOn`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MainCalendar` (
    `id` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `source` ENUM('USER', 'ACADEMIC', 'TIMETABLE') NOT NULL,
    `externalId` VARCHAR(191) NULL,
    `isSynced` BOOLEAN NOT NULL DEFAULT false,
    `googleEventId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MainCalendar_studentId_idx`(`studentId`),
    INDEX `MainCalendar_semesterId_idx`(`semesterId`),
    INDEX `MainCalendar_startsAt_idx`(`startsAt`),
    INDEX `MainCalendar_source_idx`(`source`),
    INDEX `MainCalendar_externalId_idx`(`externalId`),
    UNIQUE INDEX `MainCalendar_studentId_source_externalId_startsAt_key`(`studentId`, `source`, `externalId`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Course_code_idx`(`code`),
    UNIQUE INDEX `Course_code_name_key`(`code`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseClass` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `index` VARCHAR(191) NOT NULL,
    `component` ENUM('LEC', 'TUT', 'LAB', 'SEM', 'OTHER') NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `weeksJson` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `delivery` ENUM('PHYSICAL', 'ONLINE', 'HYBRID') NULL DEFAULT 'PHYSICAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseClass_courseId_semesterId_idx`(`courseId`, `semesterId`),
    INDEX `CourseClass_semesterId_dayOfWeek_idx`(`semesterId`, `dayOfWeek`),
    INDEX `CourseClass_delivery_idx`(`delivery`),
    UNIQUE INDEX `CourseClass_semesterId_index_component_dayOfWeek_startTime_e_key`(`semesterId`, `index`, `component`, `dayOfWeek`, `startTime`, `endTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimetableEnrollment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TimetableEnrollment_studentId_idx`(`studentId`),
    INDEX `TimetableEnrollment_courseId_idx`(`courseId`),
    UNIQUE INDEX `TimetableEnrollment_studentId_classId_key`(`studentId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseExam` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CourseExam_courseId_semesterId_idx`(`courseId`, `semesterId`),
    INDEX `CourseExam_startsAt_idx`(`startsAt`),
    INDEX `CourseExam_endsAt_idx`(`endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `recurrence` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `source` ENUM('USER', 'ACADEMIC', 'TIMETABLE') NOT NULL DEFAULT 'USER',
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `externalId` VARCHAR(191) NULL,
    `semesterId` VARCHAR(191) NULL,
    `courseCode` VARCHAR(191) NULL,
    `classType` ENUM('LEC', 'TUT', 'LAB', 'SEM', 'OTHER') NULL,
    `classIndex` VARCHAR(191) NULL,

    INDEX `Event_studentId_startsAt_idx`(`studentId`, `startsAt`),
    INDEX `Event_studentId_endsAt_idx`(`studentId`, `endsAt`),
    INDEX `Event_source_idx`(`source`),
    INDEX `Event_semesterId_idx`(`semesterId`),
    INDEX `Event_externalId_idx`(`externalId`),
    UNIQUE INDEX `Event_studentId_source_externalId_startsAt_key`(`studentId`, `source`, `externalId`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicCalendarFile` (
    `id` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `content` LONGBLOB NOT NULL,
    `textContent` LONGTEXT NULL,
    `extractedJson` JSON NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AcademicCalendarFile_semesterId_idx`(`semesterId`),
    INDEX `AcademicCalendarFile_studentId_idx`(`studentId`),
    INDEX `AcademicCalendarFile_uploadedAt_idx`(`uploadedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SemesterCalendarFile` (
    `id` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `content` LONGBLOB NOT NULL,
    `textContent` LONGTEXT NULL,
    `extractedJson` JSON NULL,

    INDEX `SemesterCalendarFile_semesterId_idx`(`semesterId`),
    INDEX `SemesterCalendarFile_studentId_idx`(`studentId`),
    INDEX `SemesterCalendarFile_uploadedAt_idx`(`uploadedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Upload` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `originalFilename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `tempPath` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',

    INDEX `Upload_studentId_idx`(`studentId`),
    INDEX `Upload_status_idx`(`status`),
    INDEX `Upload_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Preferences` ADD CONSTRAINT `Preferences_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicCalEvent` ADD CONSTRAINT `AcademicCalEvent_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MainCalendar` ADD CONSTRAINT `MainCalendar_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MainCalendar` ADD CONSTRAINT `MainCalendar_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseClass` ADD CONSTRAINT `CourseClass_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseClass` ADD CONSTRAINT `CourseClass_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimetableEnrollment` ADD CONSTRAINT `TimetableEnrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimetableEnrollment` ADD CONSTRAINT `TimetableEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimetableEnrollment` ADD CONSTRAINT `TimetableEnrollment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `CourseClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseExam` ADD CONSTRAINT `CourseExam_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseExam` ADD CONSTRAINT `CourseExam_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicCalendarFile` ADD CONSTRAINT `AcademicCalendarFile_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicCalendarFile` ADD CONSTRAINT `AcademicCalendarFile_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SemesterCalendarFile` ADD CONSTRAINT `SemesterCalendarFile_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SemesterCalendarFile` ADD CONSTRAINT `SemesterCalendarFile_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
