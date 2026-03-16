import { config as loadDotenv } from "dotenv"
import { Client } from "pg"

loadDotenv()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required.")
}

const statements = [
  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_brand_handle_created_at_active
    ON product ((LOWER(COALESCE(metadata->>'brand_handle', ''))), created_at DESC, id DESC)
    WHERE deleted_at IS NULL AND metadata IS NOT NULL
  `,
]

async function main() {
  const client = new Client({
    connectionString,
  })

  await client.connect()

  try {
    for (const statement of statements) {
      console.log(`Running statement:\n${statement.trim()}\n`)
      await client.query(statement)
    }
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error("[optimize-store-performance] Failed:", error)
  process.exit(1)
})
