import { Badge } from "@medusajs/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">تنبيه:</span> للاختبار فقط.
    </Badge>
  )
}

export default PaymentTest
