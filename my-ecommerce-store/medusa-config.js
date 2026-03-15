const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const plugins = [
  {
    resolve: "@lambdacurry/medusa-product-reviews",
    options: {},
  },
  {
    resolve: "@alpha-solutions/medusa-image-alt",
    options: {},
  },
]

if (process.env.MEILISEARCH_ENABLED === "true" && process.env.MEILISEARCH_HOST) {
  plugins.push({
    resolve: "@rokmohar/medusa-plugin-meilisearch",
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST ?? "",
        apiKey: process.env.MEILISEARCH_API_KEY ?? "",
      },
      settings: {
        products: {
          type: "products",
          enabled: true,
          fields: [
            "id",
            "title",
            "subtitle",
            "description",
            "handle",
            "variant_sku",
            "thumbnail",
          ],
          indexSettings: {
            searchableAttributes: [
              "title",
              "subtitle",
              "description",
              "variant_sku",
              "handle",
            ],
            displayedAttributes: [
              "id",
              "title",
              "subtitle",
              "description",
              "handle",
              "variant_sku",
              "thumbnail",
            ],
            filterableAttributes: ["id", "handle"],
          },
          primaryKey: "id",
        },
        categories: {
          type: "categories",
          enabled: true,
          fields: ["id", "name", "description", "handle", "is_active", "parent_id"],
          indexSettings: {
            searchableAttributes: ["name", "description", "handle"],
            displayedAttributes: [
              "id",
              "name",
              "description",
              "handle",
              "is_active",
              "parent_id",
            ],
            filterableAttributes: ["id", "handle", "is_active", "parent_id"],
          },
          primaryKey: "id",
        },
      },
      i18n: {
        strategy: "field-suffix",
        languages: ["ar", "en"],
        defaultLanguage: "ar",
        translatableFields: ["title", "description", "name"],
      },
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS,
      adminCors: process.env.ADMIN_CORS,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/blog",
    },
  ],
  plugins,
})
