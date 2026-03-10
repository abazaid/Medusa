import { HttpTypes } from "@medusajs/types"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  placeholder?: string
  getOptionLabel?: (value: string) => string
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  placeholder,
  getOptionLabel,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const selectId = `product-option-${option.id}`

  return (
    <div className="flex flex-col gap-y-2">
      <label htmlFor={selectId} className="text-sm break-words">
        {title || "Select"}
      </label>
      <div
        className="w-full"
        data-testid={dataTestId}
      >
        <select
          id={selectId}
          value={current ?? ""}
          onChange={(event) => {
            if (event.target.value) {
              updateOption(option.id, event.target.value)
            }
          }}
          disabled={disabled}
          className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none ring-0 transition focus:border-sky-500"
          data-testid="option-select"
        >
          <option value="">{placeholder || title || "Select"}</option>
          {filteredOptions.map((v) => (
            <option key={v} value={v}>
              {getOptionLabel ? getOptionLabel(v) : v}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default OptionSelect
