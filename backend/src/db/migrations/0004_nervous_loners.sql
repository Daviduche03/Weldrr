CREATE TABLE "discoveries" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"docs_markdown" text,
	"endpoints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"narrative" text,
	"error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "spec_raw" text;--> statement-breakpoint
ALTER TABLE "discoveries" ADD CONSTRAINT "discoveries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discoveries" ADD CONSTRAINT "discoveries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discoveries_project_idx" ON "discoveries" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "discoveries_workspace_idx" ON "discoveries" USING btree ("workspace_id");