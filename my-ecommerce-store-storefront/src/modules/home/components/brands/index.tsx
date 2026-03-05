import { Heading } from "@medusajs/ui"

const brands = [
  { name: "Vaporesso", logo: "https://via.placeholder.com/120x60/ffffff/000000?text=Vaporesso" },
  { name: "SMOK", logo: "https://via.placeholder.com/120x60/ffffff/000000?text=SMOK" },
  { name: "Uwell", logo: "https://via.placeholder.com/120x60/ffffff/000000?text=Uwell" },
  { name: "Voopoo", logo: "https://via.placeholder.com/120x60/ffffff/000000?text=Voopoo" },
  { name: "Aspire", logo: "https://via.placeholder.com/120x60/ffffff/000000?text=Aspire" },
  { name: "GeekVape", logo: "https://via.placeholder.com/120x60/ffffff/000000?text=GeekVape" },
]

const Brands = () => {
  return (
    <section className="py-16 bg-secondary-0">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20">
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-2 bg-primary-500 text-white text-sm font-semibold rounded-full mb-4">
            شركاؤنا
          </div>
          <Heading level="h2" className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            أفضل العلامات التجارية
          </Heading>
          <p className="text-secondary-600 text-lg max-w-2xl mx-auto">
            نتعامل مع أفضل العلامات التجارية العالمية لضمان جودة منتجاتنا
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {brands.map((brand, index) => (
            <div
              key={index}
              className="group flex items-center justify-center p-6 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="w-24 h-12 mx-auto mb-2 bg-secondary-300 rounded flex items-center justify-center text-sm font-semibold text-secondary-600">
                  {brand.name}
                </div>
                <div className="text-xs text-secondary-500">علامة تجارية عالمية</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 bg-secondary-50 rounded-full px-6 py-3">
            <div className="w-3 h-3 bg-success-400 rounded-full animate-pulse"></div>
            <span className="text-secondary-600 font-medium">جميع المنتجات أصلية وتحصل على ضمان</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Brands