import { Heading } from "@medusajs/ui"

const testimonials = [
  {
    name: "أحمد محمد",
    role: "مستخدم منذ عام",
    text: "أفضل متجر للسجائر الإلكترونية في المملكة! الجودة ممتازة والأسعار تنافسية. التوصيل كان سريع جداً خلال يومين فقط.",
    rating: 5
  },
  {
    name: "خالد عبدالله",
    role: "محترف في السجائر الإلكترونية",
    text: "أتعامل معهم منذ فترة طويلة وخدمتهم ممتازة. المنتجات أصلية وتحصل على ضمان. أنصح بهم بشدة!",
    rating: 5
  },
  {
    name: "فهد سعيد",
    role: "عميل جديد",
    text: "تجربة شراء ممتازة! الدعم الفني سريع في الرد ويساعد في اختيار المنتج المناسب. سأكرر الشراء بالتأكيد.",
    rating: 4
  }
]

const Testimonials = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-secondary-50 to-secondary-0">
      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20">
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-2 bg-primary-500 text-white text-sm font-semibold rounded-full mb-4">
            آراء العملاء
          </div>
          <Heading level="h2" className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            ماذا يقول عملاؤنا
          </Heading>
          <p className="text-secondary-600 text-lg max-w-2xl mx-auto">
            نحن نفخر بثقة عملائنا ونسعى دائماً لتقديم أفضل تجربة شراء
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center mb-4">
                <div className="flex space-x-1 rtl:space-x-reverse">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-primary-400' : 'text-secondary-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              <p className="text-secondary-600 mb-4 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="mr-3">
                  <div className="font-semibold text-secondary-900">{testimonial.name}</div>
                  <div className="text-sm text-secondary-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
            اقرأ المزيد من التقييمات
          </button>
        </div>
      </div>
    </section>
  )
}

export default Testimonials