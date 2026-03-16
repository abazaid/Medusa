import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import Overview from "@modules/account/components/overview"
import LoginTemplate from "@modules/account/templates/login-template"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "الحساب",
  description: "إدارة حسابك وطلباتك في المتجر.",
}

export default async function AccountPage() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    return <LoginTemplate />
  }

  const orders = (await listOrders().catch(() => null)) || null

  return <Overview customer={customer} orders={orders} />
}
