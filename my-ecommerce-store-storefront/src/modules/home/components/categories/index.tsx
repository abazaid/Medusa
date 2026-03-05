import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const categories = [
  {
    handle: "vape-kits",
    name: "أجهزة السجائر الإلكترونية",
    description: "أحدث الأجهزة والمعدات",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    color: "from-blue-500 to-cyan-500"
  },
  {
    handle: "e-liquids",
    name: "السوائل الإلكترونية",
    description: "نكهات متنوعة وجودة عالية",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=400&fit=crop",
    color: "from-green-500 to-emerald-500"
  },
  {
    handle: "coils",
    name: "الكويلات",
    description: "قطع غيار أصلية",
    image: "https://images.unsplash.com/photo-1580910051074-3eb604433992?w=400&h=400&fit=crop",
    color: "from-purple-500 to-pink-500"
  },
  {
    handle: "accessories",
    name: "الإكسسوارات",
    description: "ملحقات ومستلزمات",
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
    color: "from-orange-500 to-red-500"
  },
]

const Categories = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20">
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-2 bg-primary-500 text-white text-sm font-semibold rounded-full mb-4">
            تصفح حسب الفئة
          </div>
          <Heading level="h2" className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            اكتشف منتجاتنا المميزة
          </Heading>
          <p className="text-secondary-600 text-lg max-w-2xl mx-auto">
            نقدم لك أفضل المنتجات من العلامات التجارية العالمية بجودة عالية وأسعار تنافسية
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <LocalizedClientLink
              key={category.handle}
              href={`/categories/${category.handle}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={category.image}
                  alt={`${category.name} ${category.description}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-80 transition-opacity`}></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                      {index + 1} منتج
                    </span>
                  </div>
                  <Heading level="h3" className="text-xl md:text-2xl font-bold mb-2">
                    {category.name}
                  </Heading>
                  <p className="text-sm text-white/90">{category.description}</p>
                </div>
                
                <div className="absolute top-4 right-4 bg-white/90 text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <LocalizedClientLink href="/store">
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
              عرض جميع الفئات
            </button>
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default Categories
