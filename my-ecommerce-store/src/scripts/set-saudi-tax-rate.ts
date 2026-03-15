import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createTaxRatesWorkflow,
  updateTaxRatesWorkflow,
} from "@medusajs/medusa/core-flows"

const SAUDI_TAX_RATE = 15
const SAUDI_COUNTRY_CODE = "sa"

export default async function setSaudiTaxRate({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code", "provider_id", "parent_id"],
    filters: {
      country_code: SAUDI_COUNTRY_CODE,
    },
  })

  const saudiRegion = (taxRegions || []).find(
    (region: any) => !region.parent_id && String(region.country_code || "").toLowerCase() === SAUDI_COUNTRY_CODE
  ) as
    | {
        id: string
        country_code: string
        provider_id?: string | null
        parent_id?: string | null
      }
    | undefined

  if (!saudiRegion?.id) {
    throw new Error("Saudi Arabia tax region was not found.")
  }

  const { data: existingRates } = await query.graph({
    entity: "tax_rate",
    fields: ["id", "tax_region_id", "name", "code", "rate", "is_default"],
    filters: {
      tax_region_id: saudiRegion.id,
    },
  })

  const matchingDefaultRate = (existingRates || []).find(
    (rate: any) => Boolean(rate.is_default)
  ) as
    | {
        id: string
        rate?: number | null
      }
    | undefined

  if (matchingDefaultRate?.id) {
    await updateTaxRatesWorkflow(container as any).run({
      input: {
        selector: { id: matchingDefaultRate.id },
        update: {
          name: "VAT 15%",
          code: "VAT15",
          rate: SAUDI_TAX_RATE,
          is_default: true,
          is_combinable: false,
        },
      },
    })

    logger.info(`Updated Saudi Arabia default tax rate to ${SAUDI_TAX_RATE}%.`)
    return
  }

  await createTaxRatesWorkflow(container as any).run({
    input: [
      {
        tax_region_id: saudiRegion.id,
        name: "VAT 15%",
        code: "VAT15",
        rate: SAUDI_TAX_RATE,
        is_default: true,
      },
    ],
  })

  logger.info(`Created Saudi Arabia default tax rate at ${SAUDI_TAX_RATE}%.`)
}
