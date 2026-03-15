import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const COD_PROVIDER_ID = "pp_system_default"

export default async function setCodOnlyPayment({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })

  const activeRegions = (regions || []) as Array<{
    id: string
    name?: string | null
    currency_code?: string | null
  }>

  if (!activeRegions.length) {
    throw new Error("No active regions were found.")
  }

  for (const region of activeRegions) {
    await updateRegionsWorkflow(container as any).run({
      input: {
        selector: { id: region.id },
        update: {
          payment_providers: [COD_PROVIDER_ID],
        },
      },
    })

    logger.info(
      `Region "${region.name || region.id}" now allows only "${COD_PROVIDER_ID}".`
    )
  }
}
