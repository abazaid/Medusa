import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260304233503 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "blog_post" ("id" text not null, "handle" text not null, "status" text not null, "title_ar" text not null, "title_en" text not null, "excerpt_ar" text not null, "excerpt_en" text not null, "content_ar" text not null, "content_en" text not null, "cover_image" text not null, "meta_title_ar" text not null, "meta_title_en" text not null, "meta_description_ar" text not null, "meta_description_en" text not null, "canonical_url" text not null, "published_at" text not null, "created_by" text not null, "updated_by" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "blog_post_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_blog_post_deleted_at" ON "blog_post" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "blog_post" cascade;`);
  }

}
