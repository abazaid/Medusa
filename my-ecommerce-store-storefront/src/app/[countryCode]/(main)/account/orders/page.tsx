import { listOrders } from "@lib/data/orders"
import { retrieveCustomer } from "@lib/data/customer"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import OrderOverview from "@modules/account/components/order-overview"
import Divider from "@modules/common/components/divider"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "الطلبات",
  description: "عرض طلباتك السابقة وحالتها.",
}

export const dynamic = "force-dynamic"

export default async function OrdersPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const orders = await listOrders().catch(() => null)

  if (!customer || !orders) {
    redirect(`/${params.countryCode}/account`)
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">الطلبات</h1>
        <p className="text-base-regular">
          راجع طلباتك السابقة وتابع حالتها من مكان واحد.
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <Divider className="my-16" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
