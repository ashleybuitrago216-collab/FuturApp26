-- Keep one appointment per service so admin assignment does not create duplicates.
DELETE a1 FROM appointments a1
INNER JOIN appointments a2
  ON a1.serviceId = a2.serviceId
  AND a1.id > a2.id
WHERE a1.serviceId IS NOT NULL;

CREATE UNIQUE INDEX `appointments_serviceId_key` ON `appointments`(`serviceId`);
