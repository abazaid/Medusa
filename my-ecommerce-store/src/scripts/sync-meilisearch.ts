import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function syncMeilisearch({ container }: ExecArgs) {
  const eventBus = container.resolve(Modules.EVENT_BUS)

  await eventBus.emit({
    name: "meilisearch.sync",
    data: {},
  })
}
