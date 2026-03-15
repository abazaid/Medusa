"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Locale = "ar" | "en"

type HeroSlide = {
  id: string
  eyebrow: string
  title: string
  text: string
  buttonLabel: string
  href: string
  image?: string
}

export default function HeroCarousel({
  slides,
  locale,
}: {
  slides: HeroSlide[]
  locale: Locale
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [slides.length])

  if (!slides.length) {
    return null
  }

  const nextIndex = (activeIndex + 1) % slides.length
  const shouldLoadSlideImage = (index: number) =>
    index === activeIndex || index === nextIndex

  return (
    <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="relative overflow-hidden rounded-sm border border-slate-300 bg-[#f2f5f8] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-500 ${index === activeIndex ? "relative opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}
          >
            <div className="grid min-h-[360px] items-center gap-8 p-6 md:min-h-[430px] md:grid-cols-[1.05fr_0.95fr] md:p-10">
              <div className={locale === "ar" ? "order-2 md:order-1" : "order-2 md:order-1"}>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#18a7ff]">
                  {slide.eyebrow}
                </p>
                <h1 className="mt-4 max-w-xl text-[2rem] font-black leading-tight tracking-tight text-[#11233e] md:text-[3.25rem]">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-8 text-slate-600 md:text-[15px]">
                  {slide.text}
                </p>
                <LocalizedClientLink
                  href={slide.href}
                  className="mt-7 inline-flex rounded-sm bg-[#11233e] px-7 py-3 text-sm font-black text-white transition hover:bg-[#0f7fd6]"
                >
                  {slide.buttonLabel}
                </LocalizedClientLink>
              </div>
              <div className="relative order-1 h-[220px] overflow-hidden rounded-sm bg-gradient-to-br from-white to-slate-100 md:order-2 md:h-[320px]">
                {slide.image && shouldLoadSlideImage(index) ? (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-contain p-6"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority={index === activeIndex && activeIndex === 0}
                    loading={index === activeIndex ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d9e8f5] to-[#f8fbfe]" />
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={slide.title}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-[#18a7ff]" : "w-2.5 bg-slate-300"}`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`group relative overflow-hidden rounded-sm border p-4 text-start transition ${
              index === activeIndex
                ? "border-[#18a7ff] bg-[#11233e] text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
                : "border-slate-300 bg-white text-[#11233e] hover:border-[#18a7ff]"
            }`}
          >
            <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${index === activeIndex ? "text-[#8fd8ff]" : "text-[#18a7ff]"}`}>
              {slide.eyebrow}
            </p>
            <p className="mt-3 text-lg font-black leading-7">{slide.title}</p>
            <p className={`mt-2 line-clamp-3 text-sm leading-6 ${index === activeIndex ? "text-slate-200" : "text-slate-600"}`}>
              {slide.text}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
