import { model } from "@medusajs/framework/utils"

const Post = model.define("blog_post", {
  id: model.id().primaryKey(),
  handle: model.text(),
  status: model.text(),
  title_ar: model.text(),
  title_en: model.text(),
  excerpt_ar: model.text(),
  excerpt_en: model.text(),
  content_ar: model.text(),
  content_en: model.text(),
  cover_image: model.text(),
  meta_title_ar: model.text(),
  meta_title_en: model.text(),
  meta_description_ar: model.text(),
  meta_description_en: model.text(),
  canonical_url: model.text(),
  published_at: model.text(),
  created_by: model.text(),
  updated_by: model.text(),
})

export default Post
