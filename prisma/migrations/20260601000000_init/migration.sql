-- CreateTable: users (admin)
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `mobile_number` VARCHAR(20) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_mobile_number_key`(`mobile_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: courier_partners
CREATE TABLE `courier_partners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `courier_partners_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: shipment_orders
CREATE TABLE `shipment_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(100) NOT NULL,
    `courier_partner` VARCHAR(50) NOT NULL,
    `courier_order_id` VARCHAR(100) NULL,
    `awb_number` VARCHAR(50) NULL,
    `status` ENUM('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED', 'RTO') NOT NULL DEFAULT 'CREATED',
    `request_payload` JSON NOT NULL,
    `response_payload` JSON NULL,
    `label_url` TEXT NULL,
    `batch_id` VARCHAR(36) NULL,
    `failure_reason` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `shipment_orders_order_id_key`(`order_id`),
    INDEX `shipment_orders_courier_partner_idx`(`courier_partner`),
    INDEX `shipment_orders_awb_number_idx`(`awb_number`),
    INDEX `shipment_orders_batch_id_idx`(`batch_id`),
    INDEX `shipment_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: shipment_tracking_history
CREATE TABLE `shipment_tracking_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shipment_id` INTEGER NOT NULL,
    `status` ENUM('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED', 'RTO') NOT NULL,
    `location` VARCHAR(255) NULL,
    `description` VARCHAR(500) NULL,
    `raw_payload` JSON NOT NULL,
    `event_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `shipment_tracking_history_shipment_id_idx`(`shipment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: bulk_batches
CREATE TABLE `bulk_batches` (
    `id` VARCHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL_FAILURE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `total_count` INTEGER NOT NULL DEFAULT 0,
    `success_count` INTEGER NOT NULL DEFAULT 0,
    `failed_count` INTEGER NOT NULL DEFAULT 0,
    `results` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: courier_api_logs
CREATE TABLE `courier_api_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shipment_id` INTEGER NULL,
    `order_id` VARCHAR(100) NULL,
    `courier_partner` VARCHAR(50) NOT NULL,
    `operation` ENUM('AUTH', 'CREATE_SHIPMENT', 'TRACK_SHIPMENT', 'CANCEL_SHIPMENT', 'WEBHOOK') NOT NULL,
    `request_payload` JSON NULL,
    `response_payload` JSON NULL,
    `http_status` INTEGER NULL,
    `error_code` VARCHAR(50) NULL,
    `error_message` TEXT NULL,
    `request_id` VARCHAR(100) NULL,
    `duration_ms` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `courier_api_logs_order_id_idx`(`order_id`),
    INDEX `courier_api_logs_courier_partner_idx`(`courier_partner`),
    INDEX `courier_api_logs_shipment_id_idx`(`shipment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: webhook_events
CREATE TABLE `webhook_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courier_partner` VARCHAR(50) NOT NULL,
    `awb_number` VARCHAR(50) NULL,
    `order_id` VARCHAR(100) NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processed_at` TIMESTAMP(0) NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `webhook_events_courier_partner_idx`(`courier_partner`),
    INDEX `webhook_events_awb_number_idx`(`awb_number`),
    INDEX `webhook_events_processed_idx`(`processed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipment_tracking_history` ADD CONSTRAINT `shipment_tracking_history_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `shipment_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courier_api_logs` ADD CONSTRAINT `courier_api_logs_shipment_id_fkey` FOREIGN KEY (`shipment_id`) REFERENCES `shipment_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: courier partners
INSERT INTO `courier_partners` (`code`, `name`, `is_active`, `updated_at`) VALUES
    ('mock', 'Mock Courier', true, NOW()),
    ('urbanebolt', 'UrbaneBolt', true, NOW());

-- Seed: default admin user (password: Admin@12345, bcrypt rounds: 12)
INSERT INTO `users` (
    `name`, `email`, `password`, `mobile_number`, `status`, `updated_at`
) VALUES (
    'Admin',
    'admin@example.com',
    '$2b$12$dSGTLvrYfD3S4wcgj5gNcOHE9jfMUQ20J8HVnrjsb8SzLoRGasrmO',
    '9999999999',
    'ACTIVE',
    NOW()
);
