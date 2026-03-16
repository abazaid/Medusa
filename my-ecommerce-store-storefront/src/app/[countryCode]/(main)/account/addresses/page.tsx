import { retrieveCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import AddressBook from "@modules/account/components/address-book"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "العناوين",
  description: "عرض وإدارة عناوين الشحن الخاصة بك.",
}

export const dynamic = "force-dynamic"

export default async function AddressesPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const region = await getRegion(params.countryCode).catch(() => null)

  if (!customer || !region) {
    redirect(`/${params.countryCode}/account`)
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">عناوين الشحن</h1>
        <p className="text-base-regular">
          يمكنك عرض عناوين الشحن وتحديثها وإضافة أكثر من عنوان. سيتم استخدام
          العناوين المحفوظة بسهولة أثناء إتمام الطلب.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
