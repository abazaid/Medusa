import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Pool } from "pg"

type BrandProductsRow = {
  id: string
  in_stock: boolean
  created_at: string | null
}

type CountRow = {
  count: string
}

let pool: Pool | null = null

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error("DATABASE_URL is required to list brand products.")
    }

    pool = new Pool({ connectionString })
  }

  return pool
}

const normalizeHandle = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

const parsePositiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(Math.floor(parsed), max)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandHandle = normalizeHandle(req.params.handle)

  if (!brandHandle) {
    res.status(400).json({ message: "Brand handle is required." })
    return
  }

  const limit = parsePositiveInt((req.query as Record<string, unknown>)?.limit, 12, 100)
  const safeOffsetRaw = Number((req.query as Record<string, unknown>)?.offset)
  const safeOffset =
    Number.isFinite(safeOffsetRaw) && safeOffsetRaw >= 0 ? Math.floor(safeOffsetRaw) : 0

  const db = getPool()

  const countQuery = await db.query<CountRow>(
    `
      SELECT COUNT(*)::text AS count
      FROM product p
      WHERE deleted_at IS NULL
        AND metadata IS NOT NULL
        AND LOWER(COALESCE(metadata->>'brand_handle', '')) = $1
    `,
    [brandHandle]
  )

  const count = Number(countQuery.rows[0]?.count || 0)

  if (!count) {
    res.status(200).json({
      brand_handle: brandHandle,
      count: 0,
      limit,
      offset: safeOffset,
      product_ids: [],
    })
    return
  }

  const idsQuery = await db.query<BrandProductsRow>(
    `
      SELECT
        p.id,
        EXISTS (
          SELECT 1
          FROM product_variant pv
          WHERE pv.product_id = p.id
            AND pv.deleted_at IS NULL
            AND (
              COALESCE(pv.manage_inventory, false) = false
              OR COALESCE(pv.allow_backorder, false) = true
              OR COALESCE(pv.inventory_quantity, 0) > 0
            )
        ) AS in_stock,
        p.created_at
      FROM product p
      WHERE p.deleted_at IS NULL
        AND p.metadata IS NOT NULL
        AND LOWER(COALESCE(p.metadata->>'brand_handle', '')) = $1
      ORDER BY in_stock DESC, p.created_at DESC, p.id DESC
      LIMIT $2
      OFFSET $3
    `,
    [brandHandle, limit, safeOffset]
  )

  res.status(200).json({
    brand_handle: brandHandle,
    count,
    limit,
    offset: safeOffset,
    product_ids: idsQuery.rows.map((row) => row.id).filter(Boolean),
  })
}
