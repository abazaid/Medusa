"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { toStoreCountryCode } from "@lib/util/slug"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) =>
      (regions || [])
        .map((region) => ({
          ...region,
          countries:
            region.countries?.filter(
              (country) => country?.iso_2?.toLowerCase() === "sa"
            ) || [],
        }))
        .filter((region) => (region.countries?.length || 0) > 0)
    )
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string) => {
  try {
    const storeCountryCode = toStoreCountryCode(countryCode)

    if (regionMap.has(storeCountryCode)) {
      return regionMap.get(storeCountryCode)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        if (c?.iso_2?.toLowerCase() !== "sa") {
          return
        }

        regionMap.set(c.iso_2 ?? "", region)
        regionMap.set("ar", region)
        regionMap.set("en", region)
      })
    })

    const region = storeCountryCode
      ? regionMap.get(storeCountryCode)
      : regionMap.get("sa")

    return region
  } catch (e: any) {
    return null
  }
}
