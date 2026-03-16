import { retrieveCustomer } from "@lib/data/customer"
import { listRegions } from "@lib/data/regions"
import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "الملف الشخصي",
  description: "عرض وتعديل بيانات حسابك.",
}

export const dynamic = "force-dynamic"

export default async function ProfilePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const customer = await retrieveCustomer().catch(() => null)
  const regions = await listRegions().catch(() => null)

  if (!customer || !regions) {
    redirect(`/${params.countryCode}/account`)
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">الملف الشخصي</h1>
        <p className="text-base-regular">
          يمكنك عرض بيانات حسابك وتحديث الاسم والبريد الإلكتروني ورقم الجوال
          وعنوان الفاتورة من هذه الصفحة.
        </p>
      </div>
      <div className="flex flex-col gap-y-8 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfileEmail customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
        <Divider />
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}

const Divider = () => {
  return <div className="w-full h-px bg-gray-200" />
}
