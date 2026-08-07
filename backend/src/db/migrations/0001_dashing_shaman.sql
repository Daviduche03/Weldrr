CREATE TABLE "sandboxes" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text,
	"job_type" text DEFAULT 'sdk' NOT NULL,
	"language" text,
	"status" text DEFAULT 'issuing' NOT NULL,
	"modal_sandbox_id" text,
	"tunnel_url" text,
	"opencode_password" text,
	"callback_token_hash" text NOT NULL,
	"spec" jsonb,
	"error" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sandboxes" ADD CONSTRAINT "sandboxes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sandboxes" ADD CONSTRAINT "sandboxes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sandboxes_workspace_idx" ON "sandboxes" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "sandboxes_project_idx" ON "sandboxes" USING btree ("project_id");