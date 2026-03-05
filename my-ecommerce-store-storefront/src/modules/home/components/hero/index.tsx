import { Button, Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative min-h-[60vh] md:min-h-[70vh] lg:min-h-[80vh] w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10"></div>
      
      {/* Main Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-full tracking-wide">
                  أفضل متجر للسجائر الإلكترونية
                </span>
              </div>
              
                <Heading
                  level="h1"
                  className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 leading-tight"
                >
                  اكتشف عالم
                  <br />
                  <span className="text-primary-400">السجائر الإلكترونية</span>
                </Heading>
              
              <Heading
                level="h2"
                className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-lg"
              >
                أفضل العلامات التجارية، أسعار تنافسية، وشحن سريع إلى جميع أنحاء المملكة
              </Heading>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <LocalizedClientLink href="/store" className="w-full sm:w-auto">
                  <Button 
                    variant="primary" 
                    className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 text-base md:text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    تسوق الآن
                  </Button>
                </LocalizedClientLink>
                <LocalizedClientLink href="/collections/featured" className="w-full sm:w-auto">
                  <Button 
                    variant="secondary" 
                    className="bg-transparent text-white border-2 border-primary-400 hover:bg-primary-500/20 px-8 py-3 text-base md:text-lg font-semibold rounded-lg transition-all duration-300"
                  >
                    عرض جميع المنتجات
                  </Button>
                </LocalizedClientLink>
              </div>
              
              {/* Trust Badges */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-success-400 rounded-full"></span>
                    <span>شحن سريع 2-4 أيام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-primary-400 rounded-full"></span>
                    <span>ضمان استبدال 30 يوم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-accent-400 rounded-full"></span>
                    <span>دفع آمن 100%</span>
                  </div>
                </div>
            </div>
            
            {/* Right Image */}
            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-full h-full bg-orange-500/20 rounded-2xl transform rotate-1"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary-800 rounded-lg p-4">
                      <div className="text-primary-400 font-bold text-2xl mb-2">1000+</div>
                      <div className="text-secondary-300 text-sm">منتجات متوفرة</div>
                    </div>
                    <div className="bg-secondary-800 rounded-lg p-4">
                      <div className="text-primary-400 font-bold text-2xl mb-2">99%</div>
                      <div className="text-secondary-300 text-sm">رضا العملاء</div>
                    </div>
                    <div className="bg-secondary-800 rounded-lg p-4">
                      <div className="text-primary-400 font-bold text-2xl mb-2">50+</div>
                      <div className="text-secondary-300 text-sm">علامة تجارية</div>
                    </div>
                    <div className="bg-secondary-800 rounded-lg p-4">
                      <div className="text-primary-400 font-bold text-2xl mb-2">24/7</div>
                      <div className="text-secondary-300 text-sm">دعم فني</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className="inline-block bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      عروض خاصة هذا الأسبوع
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-primary-500/10 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="absolute top-32 left-10 w-16 h-16 bg-primary-400/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-primary-600/10 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
    </div>
  )
}

export default Hero
