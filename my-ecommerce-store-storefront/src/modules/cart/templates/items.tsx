import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@medusajs/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
  locale?: string
}

const ItemsTemplate = ({ cart, locale = "ar" }: ItemsTemplateProps) => {
  const isArabic = locale.toLowerCase() === "ar"
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-[2rem] leading-[2.75rem]">
          {isArabic ? "السلة" : "Cart"}
        </Heading>
      </div>
      <Table className="overflow-hidden rounded-xl border border-slate-200">
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="!pl-0">
              {isArabic ? "المنتج" : "Item"}
            </Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell>{isArabic ? "الكمية" : "Quantity"}</Table.HeaderCell>
            <Table.HeaderCell className="hidden small:table-cell">
              {isArabic ? "السعر" : "Price"}
            </Table.HeaderCell>
            <Table.HeaderCell className="!pr-0 text-right">
              {isArabic ? "الإجمالي" : "Total"}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ItemsTemplate
