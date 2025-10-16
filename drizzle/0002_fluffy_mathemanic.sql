ALTER TABLE "hub_members" ALTER COLUMN "access_role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "hub_members" DROP COLUMN "is_owner";