CREATE TABLE "workspace_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"account_login" text,
	"account_name" text,
	"avatar_url" text,
	"token_encrypted" text NOT NULL,
	"token_expires_at" timestamp with time zone,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_connections" ADD CONSTRAINT "workspace_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_connections_ws_provider_idx" ON "workspace_connections" USING btree ("workspace_id","provider");--> statement-breakpoint
CREATE INDEX "workspace_connections_workspace_idx" ON "workspace_connections" USING btree ("workspace_id");