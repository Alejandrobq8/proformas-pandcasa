ALTER TABLE "ProformaItem"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered_items AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "proformaId"
      ORDER BY "createdAt" ASC, id ASC
    ) - 1 AS position
  FROM "ProformaItem"
)
UPDATE "ProformaItem" AS item
SET "sortOrder" = ordered_items.position
FROM ordered_items
WHERE item.id = ordered_items.id;

CREATE INDEX "ProformaItem_proformaId_sortOrder_idx"
ON "ProformaItem"("proformaId", "sortOrder");
