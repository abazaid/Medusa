import { retrieveCustomer } from "@lib/data/customer"
import { retrieveOrder } from "@lib/data/orders"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return {
      title: "تفاصيل الطلب",
    }
  }

  return {
    title: `طلب #${order.display_id}`,
    description: "عرض تفاصيل الطلب.",
  }
}

export default async function OrderDetailsPage(props: Props) {
  const params = await props.params
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    redirect(`/${params.countryCode}/account`)
  }

  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return <OrderDetailsTemplate order={order} />
}
