import { loadEnv, defineConfig } from "@medusajs/framework/utils"
import { MeilisearchPluginOptions } from "@rokmohar/medusa-plugin-meilisearch"

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

const modules: any[] = [
  {
    resolve: "./src/modules/blog",
  },
]

const redisUrl = process.env.REDIS_URL || process.env.CACHE_REDIS_URL

if (redisUrl) {
  modules.push(
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl,
        workerOptions: {
          concurrency: 1,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          url: redisUrl,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            id: "locking-redis",
            resolve: "@medusajs/medusa/locking-redis",
            is_default: true,
            options: {
              redisUrl,
            },
          },
        ],
      },
    }
  )
}

if (process.env.MEDUSA_ENABLE_CACHING_MODULE === "true" && redisUrl) {
  modules.push({
    resolve: "@medusajs/medusa/caching",
    options: {
      providers: [
        {
          id: "caching-redis",
          resolve: "@medusajs/medusa/caching-redis",
          is_default: true,
          options: {
            redisUrl,
          },
        },
      ],
    },
  })
}

if (
  process.env.MEILISEARCH_ENABLED === "true" &&
  process.env.MEILISEARCH_HOST
) {
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
    } satisfies MeilisearchPluginOptions,
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    redisPrefix: process.env.REDIS_PREFIX,
    workerMode:
      process.env.WORKER_MODE === "server" || process.env.WORKER_MODE === "worker"
        ? process.env.WORKER_MODE
        : "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules,
  plugins,
})
