import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="group flex items-center gap-x-1 text-primary-700 transition-colors hover:text-primary-600"
      href={href}
      onClick={onClick}
      {...props}
    >
      <Text className="text-inherit">{children}</Text>
      <ArrowUpRightMini
        className="group-hover:rotate-45 ease-in-out duration-150"
        color="currentColor"
      />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
