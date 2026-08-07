CREATE TABLE "versions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"artifact_type" text NOT NULL,
	"version" text NOT NULL,
	"source_ref" text,
	"artifact_url" text,
	"sandbox_id" text,
	"discovery_id" text,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discoveries" ADD COLUMN "version" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sdk_version" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "docs_version" text;--> statement-breakpoint
ALTER TABLE "sandboxes" ADD COLUMN "version" text;--> statement-breakpoint
ALTER TABLE "versions" ADD CONSTRAINT "versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versions" ADD CONSTRAINT "versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "versions_project_idx" ON "versions" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "versions_project_type_version_idx" ON "versions" USING btree ("project_id","artifact_type","version");