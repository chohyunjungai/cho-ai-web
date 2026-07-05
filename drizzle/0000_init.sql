CREATE TABLE "book_links" (
	"isbn" text NOT NULL,
	"store" text NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "book_links_isbn_store_pk" PRIMARY KEY("isbn","store"),
	CONSTRAINT "book_links_store_check" CHECK ("book_links"."store" IN ('kyobo','yes24','aladin','other'))
);
--> statement-breakpoint
CREATE TABLE "books" (
	"isbn" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"cover_url" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"link_slug" text NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"referrer" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "outbound_clicks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"isbn" text NOT NULL,
	"store" text NOT NULL,
	"video_id" text,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "promos" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text,
	"image_path" text,
	"target_url" text,
	"isbn" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "promos_kind_check" CHECK ("promos"."kind" IN ('book','lecture','other'))
);
--> statement-breakpoint
CREATE TABLE "short_links" (
	"slug" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"position" text NOT NULL,
	"target_path" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "short_links_position_check" CHECK ("short_links"."position" IN ('description','comment','other'))
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tags_category_check" CHECK ("tags"."category" IN ('task','tech'))
);
--> statement-breakpoint
CREATE TABLE "template_tags" (
	"template_slug" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "template_tags_template_slug_tag_id_pk" PRIMARY KEY("template_slug","tag_id")
);
--> statement-breakpoint
CREATE TABLE "template_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_slug" text NOT NULL,
	"version" text NOT NULL,
	"note" text,
	"released_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"copy_url" text NOT NULL,
	"github_path" text,
	"version" text,
	"requires_auth" boolean DEFAULT false NOT NULL,
	"preview_path" text,
	"body_md" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_type_check" CHECK ("templates"."type" IN ('sheet','doc')),
	CONSTRAINT "templates_status_check" CHECK ("templates"."status" IN ('draft','published','deprecated'))
);
--> statement-breakpoint
CREATE TABLE "video_books" (
	"video_id" text NOT NULL,
	"isbn" text NOT NULL,
	CONSTRAINT "video_books_video_id_isbn_pk" PRIMARY KEY("video_id","isbn")
);
--> statement-breakpoint
CREATE TABLE "video_tags" (
	"video_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "video_tags_video_id_tag_id_pk" PRIMARY KEY("video_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "video_templates" (
	"video_id" text NOT NULL,
	"template_slug" text NOT NULL,
	CONSTRAINT "video_templates_video_id_template_slug_pk" PRIMARY KEY("video_id","template_slug")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"video_no" integer NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"thumbnail_url" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'public' NOT NULL,
	"is_short" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone,
	CONSTRAINT "videos_video_no_unique" UNIQUE("video_no"),
	CONSTRAINT "videos_status_check" CHECK ("videos"."status" IN ('public','unlisted','private','deleted'))
);
--> statement-breakpoint
ALTER TABLE "book_links" ADD CONSTRAINT "book_links_isbn_books_isbn_fk" FOREIGN KEY ("isbn") REFERENCES "public"."books"("isbn") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_slug_short_links_slug_fk" FOREIGN KEY ("link_slug") REFERENCES "public"."short_links"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_book_link_fk" FOREIGN KEY ("isbn","store") REFERENCES "public"."book_links"("isbn","store") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promos" ADD CONSTRAINT "promos_isbn_books_isbn_fk" FOREIGN KEY ("isbn") REFERENCES "public"."books"("isbn") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_template_slug_templates_slug_fk" FOREIGN KEY ("template_slug") REFERENCES "public"."templates"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_slug_templates_slug_fk" FOREIGN KEY ("template_slug") REFERENCES "public"."templates"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_books" ADD CONSTRAINT "video_books_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_books" ADD CONSTRAINT "video_books_isbn_books_isbn_fk" FOREIGN KEY ("isbn") REFERENCES "public"."books"("isbn") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_templates" ADD CONSTRAINT "video_templates_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_templates" ADD CONSTRAINT "video_templates_template_slug_templates_slug_fk" FOREIGN KEY ("template_slug") REFERENCES "public"."templates"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clicks_slug_at" ON "clicks" USING btree ("link_slug","clicked_at");--> statement-breakpoint
CREATE INDEX "idx_clicks_at" ON "clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "idx_outbound_video_at" ON "outbound_clicks" USING btree ("video_id","clicked_at");