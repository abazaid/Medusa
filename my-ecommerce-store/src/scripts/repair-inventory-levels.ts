import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

type InventoryLevelSnapshot = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: number
}

export default async function repairInventoryLevels({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const inventoryModuleService = container.resolve(Modules.INVENTORY)

  const existingLevels = (await inventoryModuleService.listInventoryLevels(
    {},
    { take: 10000 } as any
  )) as any[]

  const snapshots: InventoryLevelSnapshot[] = existingLevels
    .map((level) => ({
      id: String(level.id || ""),
      inventory_item_id: String(level.inventory_item_id || ""),
      location_id: String(level.location_id || ""),
      stocked_quantity: Number(level.stocked_quantity || 0),
    }))
    .filter(
      (level) =>
        level.id &&
        level.inventory_item_id &&
        level.location_id
    )

  if (!snapshots.length) {
    logger.info("No inventory levels found to repair.")
    return
  }

  logger.info(`Repairing ${snapshots.length} inventory levels via workflow recreation...`)

  await inventoryModuleService.deleteInventoryLevels(
    snapshots.map((level) => level.id)
  )

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: snapshots.map((level) => ({
        inventory_item_id: level.inventory_item_id,
        location_id: level.location_id,
        stocked_quantity: level.stocked_quantity,
      })),
    },
  })

  logger.info("Inventory levels repaired successfully.")
}
