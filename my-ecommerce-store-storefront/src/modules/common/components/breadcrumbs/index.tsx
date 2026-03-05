import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const visibleItems = items.filter((item) => item.label?.trim())

  if (visibleItems.length < 2) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ui-fg-subtle"
    >
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.href && !isLast ? (
              <LocalizedClientLink
                href={item.href}
                className="transition-colors hover:text-ui-fg-base"
              >
                {item.label}
              </LocalizedClientLink>
            ) : (
              <span className={isLast ? "font-semibold text-ui-fg-base" : ""}>
                {item.label}
              </span>
            )}
            {!isLast && <span>/</span>}
          </span>
        )
      })}
    </nav>
  )
}
