-- Add optional coordinates for nearest-distance sorting.
ALTER TABLE "Restaurant"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;
