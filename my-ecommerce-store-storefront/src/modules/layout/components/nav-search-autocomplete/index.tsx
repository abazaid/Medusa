"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

type Suggestion = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
}

type Props = {
  placeholder: string
}

export default function NavSearchAutocomplete({ placeholder }: Props) {
  const router = useRouter()
  const params = useParams()
  const countryCode =
    typeof params.countryCode === "string" ? params.countryCode : "sa"
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(
            query
          )}&countryCode=${countryCode}`,
          {
            signal: controller.signal,
          }
        )

        if (!response.ok) {
          setSuggestions([])
          return
        }

        const payload = (await response.json()) as { suggestions?: Suggestion[] }
        setSuggestions((payload.suggestions || []).slice(0, 5))
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [countryCode, query])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setFocused(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const submitSearch = (value: string) => {
    const normalized = value.trim()
    if (!normalized) {
      return
    }

    setFocused(false)
    router.push(`/${countryCode}/store?q=${encodeURIComponent(normalized)}`)
  }

  const openSuggestion = (suggestion: Suggestion) => {
    setFocused(false)
    setQuery("")
    router.push(`/${countryCode}/products/${suggestion.handle}`)
  }

  const showSuggestions = focused && (suggestions.length > 0 || loading)

  return (
    <div ref={containerRef} className="relative min-w-[280px] flex-1 xl:max-w-xl">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitSearch(query)
        }}
      >
        <input
          type="search"
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none ring-sky-400 transition focus:ring-2"
        />
      </form>

      {showSuggestions ? (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 rounded-md border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">جاري البحث...</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => openSuggestion(suggestion)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-slate-50"
                  >
                    {suggestion.thumbnail ? (
                      <img
                        src={suggestion.thumbnail}
                        alt={suggestion.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                        ?
                      </span>
                    )}
                    <span className="line-clamp-2 text-sm text-slate-800">
                      {suggestion.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
