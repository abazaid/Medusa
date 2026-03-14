"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ReactCountryFlag from "react-country-flag"

import { StateType } from "@lib/hooks/use-toggle-state"
import { Locale } from "@lib/data/locales"

type LanguageOption = {
  code: string
  name: string
  localizedName: string
  countryCode: string
}

const DEFAULT_OPTIONS: LanguageOption[] = [
  {
    code: "ar",
    name: "Arabic",
    localizedName: "العربية",
    countryCode: "SA",
  },
  {
    code: "en",
    name: "English",
    localizedName: "English",
    countryCode: "GB",
  },
]

const getCountryCodeFromLocale = (localeCode: string): string => {
  try {
    const locale = new Intl.Locale(localeCode)

    if (locale.region) {
      return locale.region.toUpperCase()
    }

    const maximized = locale.maximize()
    return maximized.region?.toUpperCase() ?? localeCode.toUpperCase()
  } catch {
    const parts = localeCode.split(/[-_]/)
    return parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase()
  }
}

type LanguageSelectProps = {
  toggleState: StateType
  locales: Locale[]
  currentLocale: string | null
}

const getLocalizedLanguageName = (
  code: string,
  fallbackName: string,
  displayLocale: string = "ar"
): string => {
  try {
    const displayNames = new Intl.DisplayNames([displayLocale], {
      type: "language",
    })

    return displayNames.of(code) ?? fallbackName
  } catch {
    return fallbackName
  }
}

const LanguageSelect = ({
  toggleState,
  locales,
  currentLocale,
}: LanguageSelectProps) => {
  const [current, setCurrent] = useState<LanguageOption | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { state, close } = toggleState
  const isArabic = (currentLocale ?? "ar").toLowerCase() === "ar"

  const options = useMemo(() => {
    const uniqueOptions = new Map<string, LanguageOption>()

    for (const option of DEFAULT_OPTIONS) {
      uniqueOptions.set(option.code, option)
    }

    for (const locale of locales) {
      const code = locale.code.toLowerCase()

      if (code !== "ar" && code !== "en") {
        continue
      }

      uniqueOptions.set(code, {
        code,
        name: locale.name,
        localizedName:
          code === "ar"
            ? "العربية"
            : code === "en"
              ? "English"
              : getLocalizedLanguageName(
                  locale.code,
                  locale.name,
                  currentLocale ?? "ar"
                ),
        countryCode: code === "ar" ? "SA" : getCountryCodeFromLocale(locale.code),
      })
    }

    return ["ar", "en"]
      .map((code) => uniqueOptions.get(code))
      .filter((option): option is LanguageOption => Boolean(option))
  }, [locales, currentLocale])

  useEffect(() => {
    const activeCode = (currentLocale ?? "ar").toLowerCase()
    const option = options.find((o) => o.code === activeCode)

    setCurrent(option ?? options[0])
  }, [options, currentLocale])

  const handleChange = (option: LanguageOption) => {
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: option.code }),
      })
      close()
      router.refresh()
    })
  }

  return (
    <div>
      <Listbox
        as="span"
        onChange={handleChange}
        value={current}
        disabled={isPending}
      >
        <ListboxButton className="w-full py-1">
          <div className="txt-compact-small flex items-start gap-x-2">
            <span>{isArabic ? "اللغة:" : "Language:"}</span>
            {current && (
              <span className="txt-compact-small flex items-center gap-x-2">
                {/* @ts-ignore */}
                <ReactCountryFlag
                  svg
                  style={{
                    width: "16px",
                    height: "16px",
                  }}
                  countryCode={current.countryCode}
                />
                {isPending ? "..." : current.localizedName}
              </span>
            )}
          </div>
        </ListboxButton>
        <div className="relative flex w-full min-w-[320px]">
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute -bottom-[calc(100%-36px)] left-0 z-[900] max-h-[442px] w-full overflow-y-scroll rounded-rounded bg-white text-black drop-shadow-md no-scrollbar text-small-regular xsmall:left-auto xsmall:right-0"
              static
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.code}
                  value={option}
                  className="flex cursor-pointer items-center gap-x-2 px-3 py-2 hover:bg-gray-200"
                >
                  {/* @ts-ignore */}
                  <ReactCountryFlag
                    svg
                    style={{
                      width: "16px",
                      height: "16px",
                    }}
                    countryCode={option.countryCode}
                  />
                  {option.localizedName}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default LanguageSelect
