-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Depot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ParkingSpot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotNumber" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    CONSTRAINT "ParkingSpot_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vin" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "colorTag" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "depotId" TEXT NOT NULL,
    "currentParkingSpotId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Truck_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Truck_currentParkingSpotId_fkey" FOREIGN KEY ("currentParkingSpotId") REFERENCES "ParkingSpot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT,
    "startPoint" TEXT NOT NULL,
    "stops" JSONB,
    "destination" TEXT NOT NULL,
    "mileage" DECIMAL,
    "fuelUsage" DECIMAL,
    "routeDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Route_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Route_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "truckId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DECIMAL,
    "notes" TEXT,
    "nextServiceDate" DATETIME,
    "workOrderId" TEXT,
    CONSTRAINT "MaintenanceLog_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "truckId" TEXT NOT NULL,
    "mechanicId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "WorkOrder_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_mechanicId_fkey" FOREIGN KEY ("mechanicId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "truckId" TEXT NOT NULL,
    "frequencyMiles" INTEGER,
    "frequencyDays" INTEGER,
    "lastOdometer" INTEGER,
    "lastServiceDate" DATETIME,
    "nextServiceDate" DATETIME,
    CONSTRAINT "ServiceSchedule_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "truckId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "truckId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Depot_code_key" ON "Depot"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpot_depotId_spotNumber_key" ON "ParkingSpot"("depotId", "spotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_vin_key" ON "Truck"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_plate_key" ON "Truck"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_barcode_key" ON "Truck"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_currentParkingSpotId_key" ON "Truck"("currentParkingSpotId");

-- CreateIndex
CREATE INDEX "Route_truckId_idx" ON "Route"("truckId");

-- CreateIndex
CREATE INDEX "Route_driverId_idx" ON "Route"("driverId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_truckId_idx" ON "MaintenanceLog"("truckId");

-- CreateIndex
CREATE INDEX "ServiceSchedule_truckId_idx" ON "ServiceSchedule"("truckId");

-- CreateIndex
CREATE INDEX "Alert_truckId_idx" ON "Alert"("truckId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
