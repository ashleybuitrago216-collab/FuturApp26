-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('admin', 'tecnico', 'usuario') NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `area` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `userRole` ENUM('admin', 'tecnico', 'usuario') NOT NULL DEFAULT 'usuario',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `technicianId` INTEGER NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NULL,
    `prioridad` VARCHAR(191) NULL,
    `estado` ENUM('Pendiente', 'Completado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    `valor` DECIMAL(12, 2) NULL,
    `duracion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `services_userId_idx`(`userId`),
    INDEX `services_technicianId_idx`(`technicianId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `technicianId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `fecha` DATETIME(3) NULL,
    `hora` VARCHAR(191) NULL,
    `contacto` VARCHAR(191) NULL,
    `estado` ENUM('Pendiente', 'Programada', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Pendiente',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `appointments_userId_idx`(`userId`),
    INDEX `appointments_technicianId_idx`(`technicianId`),
    INDEX `appointments_serviceId_idx`(`serviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `technicianId` INTEGER NULL,
    `serviceId` INTEGER NULL,
    `appointmentId` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `platformCommission` DECIMAL(12, 2) NULL,
    `technicianEarnings` DECIMAL(12, 2) NULL,
    `method` VARCHAR(191) NULL,
    `status` ENUM('Pendiente', 'Pagado', 'Fallido', 'Reembolsado') NOT NULL DEFAULT 'Pendiente',
    `reference` VARCHAR(191) NULL,
    `confirmedByTechnician` BOOLEAN NOT NULL DEFAULT false,
    `confirmedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_transactionId_key`(`transactionId`),
    INDEX `payments_userId_idx`(`userId`),
    INDEX `payments_technicianId_idx`(`technicianId`),
    INDEX `payments_serviceId_idx`(`serviceId`),
    INDEX `payments_appointmentId_idx`(`appointmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `text` TEXT NOT NULL,
    `response` TEXT NULL,
    `respondedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `comments_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `technician_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `technicianId` INTEGER NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `status` VARCHAR(191) NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `technician_locations_technicianId_idx`(`technicianId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `services` ADD CONSTRAINT `services_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `appointments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `technician_locations` ADD CONSTRAINT `technician_locations_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
