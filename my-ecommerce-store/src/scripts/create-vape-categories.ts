import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  deleteProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

type ImportedCategory = {
  name: string
  parentName?: string
  hidden?: boolean
  pageTitle?: string
  pageLink?: string
  pageDescription?: string
}

type ExistingCategory = {
  id: string
  parent_category_id?: string | null
}

const IMPORT_SOURCE = "04-03-2026-05-51_iu60xtPmPtvE8MT5GZmnafYKnQj43W7JfetlTfTz_categories.xlsx"

const IMPORTED_CATEGORIES: ImportedCategory[] = [
  {
    name: "تانكات شيشة - Tanks",
    parentName: "ملحقات - Accessories",
    pageTitle: "تانكات شيشة الكترونية - Vape Tanks",
    pageLink: "تانكات",
    pageDescription:
      "استمتع بأفضل تانكات الشيشة الإلكترونية المصممة لتوفير نكهات غنية وأداء سلس، متوفرة بأحجام وتصاميم متعددة تناسب جميع الأذواق. تسوق الآن!",
  },
  {
    name: "فحم",
    parentName: "شيشة تقليدية",
    pageTitle: "فحم شيشة - Shisha Charcoal",
    pageLink: "فحم",
    pageDescription:
      "\"تسوق أفضل أنواع فحم الشيشة للحصول على تجربة تدخين مثالية تدوم طويلاً، يتميز بإشعال سريع وحرارة مستقرة. مثالي لعشاق الشيشة التقليدية.",
  },
  {
    name: "مزاج 4500",
    parentName: "سحبات مزاج",
    pageTitle: "مزاج انفينيتي 4500",
    pageLink: "مزاج-4500",
    pageDescription:
      "استمتع بتجربة فريدة مع مجموعة مزاج انفينيتي 4500، التي توفر سحب ناعم ونكهات متنوعة تصل إلى 4500 سحبة. مثالية لعشاق الشيشة الإلكترونية الباحثين عن جودة تدوم طويلاً. تسوق الآن",
  },
  {
    name: "عرض اليوم الوطني",
    hidden: true,
    pageTitle: "عرض اليوم الوطني: تخفيضات مميزة بمناسبة اليوم الوطني",
    pageLink: "عرض-اليوم-الوطني",
    pageDescription:
      "استمتع بعروض مميزة في عرض اليوم الوطني! اكتشف الآن واغتنم الفرصة!",
  },
  {
    name: "أفضل نكهات السحبات الإلكترونية في السعودية 2026",
    parentName: "نكهات سحبة سولت نيكوتين E Juice",
    pageTitle: "أفضل نكهات السحبات الإلكترونية في السعودية 2026 | خيارات أصلية",
    pageLink: "افضل-نكهات-السحبه-الالكترونيه",
    pageDescription:
      "اكتشف أفضل نكهات السحبات الإلكترونية في السعودية لعام 2026 🍓 نكهات سولت متنوعة، طعم قوي، واختيارات تناسب جميع الأذواق مع عروض مميزة.",
  },
  {
    name: "أفضل نكهات الفيب في السعودية 2026",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "أفضل نكهات الفيب الإلكترونية في السعودية 2026 | نكهات أصلية",
    pageLink: "افضل-نكهات-الفيب-للشيشه-الالكترونيه",
    pageDescription:
      "اكتشف أفضل نكهات الفيب الإلكترونية في السعودية لعام 2026 🍓 نكهات سولت متنوعة بطعم قوي، اختيارات تناسب جميع الأذواق مع عروض مميزة.",
  },
  {
    name: "أفضل الشيشة الإلكترونية في السعودية 2026",
    parentName: "أجهزة شيشة الكترونية",
    pageTitle: "أفضل شيشة إلكترونية في السعودية 2026 | أجهزة ونكهات أصلية",
    pageLink: "افضل-شيشة-الكترونية",
    pageDescription:
      "استكشف أفضل الشيشة الإلكترونية في السعودية لعام 2026 👌 أجهزة أصلية، نكهات متنوعة، خيارات تناسب جميع الأذواق مع شحن سريع وعروض حصرية",
  },
  {
    name: "أفضل السحبات الإلكترونية في السعودية 2026",
    parentName: "سحبة سيجارة Vape pen",
    pageTitle: "أفضل سحبة إلكترونية في السعودية 2026 | سحبات أصلية بنكهات متنوعة",
    pageLink: "افضل-سحبه-الكترونيه",
    pageDescription:
      "اكتشف أفضل السحبات الإلكترونية في السعودية لعام 2026 👌 سحبات أصلية بنكهات قوية، تصاميم عصرية، وخيارات تناسب جميع الأذواق مع عروض مميزة",
  },
  {
    name: "ورق راو -  RAW",
    parentName: "ورق لف السجائر - Rolling Paper",
    pageTitle: "ورق راو - RAW Rolling Paper",
    pageLink: "ورق-راو-raw-rolling-paper",
    pageDescription:
      "اكتشف ورق راو الأصلي للف السجائر - جودة استثنائية وطبيعية 100%. مثالي لمحبي التدخين النقي و السعر المنافس , ورق راو - RAW Rolling Paper",
  },
  {
    name: "TEREA IQOS ILUMA",
    parentName: "اجهزة ايكوس IQOS",
    pageTitle: "اشترِ أعواد التبغ تيرا ايكوس TEREA-IQOS ILUMA | IQOS السعودية",
    pageLink: "terea-iqos-iluma",
    pageDescription:
      "اكتشف TEREA ، أعواد ألتبغ الخاصة بجهاز IQOS ILUMA ، وتصفح جميع النكهات واشترِ النكهة التي تفضلها وفقًا لذوقك.",
  },
  {
    name: "عروض يوم التأسيس",
    parentName: "عروض تصفية",
    hidden: true,
    pageTitle: "عروض يوم التأسيس - تخفيضات كبيرة",
    pageLink: "عروض-يوم-التأسيس",
    pageDescription:
      "احتفل بيوم التأسيس مع عروضنا الحصرية على أفضل أجهزة الفيب والسوائل الإلكترونية! استفد من خصومات كبيرة، هدايا مجانية، وعروض خاصة لفترة محدودة.",
  },
  {
    name: "ولاعات سجائر و دخان",
    parentName: "مستلزمات التبغ - ملحقات و اكسسوارات الدخان",
    pageTitle: "ولاعات سجائر و دخان الكترونية و كهربائية USB",
    pageLink: "ولاعات-سجائر-و-دخان",
    pageDescription:
      "ولاعات سجائر و دخان الكترونية و كهربائية USB  عصرية وأنيقة بتقنية متطورة. ولاعات قابلة للشحن بواسطة USB، مقاومة للرياح، وصديقة للبيئة. تصاميم مبتكرة تناسب جميع الأذواق بألوان متعددة. استمتع بالاعتمادية والأداء الفائق في كل استخدام. تسوق الآن واحصل على ولاعة إلكترونية تدوم طويلاً.",
  },
  {
    name: "بودات معبأة جاهزة",
    parentName: "بودات - Pods",
    pageTitle: "بودات معبأة جاهزة – JUUL و MYLE و PHIX",
    pageLink: "بودات-معبأة-جاهزة",
    pageDescription:
      "اكتشف أفضل بودات معبأة جاهزة متوافقة مع أجهزة جول و مايلي و فيكس. نكهات أصلية، تجربة ثابتة، وشحن سريع لجميع مدن السعودية",
  },
  {
    name: "سحبات مزاج",
    parentName: "سحبات جاهزة لمرة واحدة",
    pageTitle: "سحبات مزاج الأصلية | جميع نكهات مزاج وأحجامها في السعودية",
    pageLink: "سحبات-مزاج",
    pageDescription:
      "تسوّق سحبات مزاج الأصلية بجميع الأحجام: 5000، 45000، 3000، مزاج بوكس ، 15000 وأكثر. وشحن سريع داخل السعودية. خيار مثالي لمن يبحث عن سحبة جاهزة قوية",
  },
  { name: "عروض خاصة", parentName: "عروض تصفية" },
  {
    name: "بطاريات",
    parentName: "ملحقات - Accessories",
    pageTitle: "بطاريات شيشة الكترونية - Vape Battery",
    pageLink: "بطاريات",
    pageDescription:
      "اكتشف بطاريات الشيشة الإلكترونية عالية الجودة لأداء يدوم طويلاً وشحن سريع، مصممة لتلبية احتياجات جميع أجهزة الفيب. احصل على الأفضل الآن",
  },
  {
    name: "0 نيكوتين",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات 0 نيكوتين - بدون نيكوتين",
    pageLink: "0-نيكوتين",
    pageDescription:
      "نقدم لكم نكهات 0 نيكوتين ، صفر نيكوتين لمن يرغب بالاقلاع بشكل كامل عن النيكوتين و يستمتع بطعم النكهات بشكل صافي بدون نيكوتين",
  },
  {
    name: "عروض تصفية",
    pageTitle: "عروض فيب - عروض تصفية",
    pageLink: "عروض-فيب-عروض-تصفية",
    pageDescription:
      "هل تبحث عن عروض فيب رائعة وبأسعار مذهلة؟ إذاً، عروض تصفية فيب هنا لتلبي توقعاتك! نقدم لكم تشكيلة رائعة من أجهزة الفيب بأسعار لا تقاوم. سواء كنت مبتدئ",
  },
  {
    name: "ايكوس هيتس IQOS Heets",
    parentName: "اجهزة ايكوس IQOS",
    pageTitle: "هيتس - هيتس دخان - ايكوس السعودية - Heets",
    pageLink: "هيتس-هيتس-دخان-ايكوس-السعودية-Heets",
    pageDescription:
      "هيتس - هيتس دخان - ايكوس السعودية - Heets , هيتس برونز  , هيتس اصفر  , هيتس سلفر , سجائر هيتس , انواع الهيتس",
  },
  { name: "مزاج 5000", parentName: "سحبات مزاج" },
  { name: "بف مي", parentName: "سحبات جاهزة لمرة واحدة" },
  {
    name: "طفايات سجائر و دخان",
    parentName: "مستلزمات التبغ - ملحقات و اكسسوارات الدخان",
    pageTitle: "طفايات سجائر و دخان",
    pageLink: "طفايات-سجائر-و-دخان",
    pageDescription:
      "طفايات سجائر و دخان عصرية بتصاميم أنيقة للسجائر التقليدية والإلكترونية. منتجات متينة عالية الجودة تناسب المنزل والسيارة والمكتب. حلول عملية للتخلص من الرماد بنظافة وأمان. اختر من تشكيلتنا المتنوعة واستمتع بتجربة تدخين أكثر أناقة وراحة.",
  },
  { name: "ميجا بار", parentName: "سحبات جاهزة لمرة واحدة" },
  {
    name: "3 نيكوتين",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات فيب 3 نيكوتين",
    pageLink: "3-نيكوتين",
    pageDescription:
      "هل تبحث عن نكهات فيب 3 نيكوتين ؟ في هذا القسم ستجد تشكيلة واسعة من نكهات الفيب 3 نيكوتين للتناسب مع ذوقك",
  },
  {
    name: "مزاج بوكس برو",
    parentName: "سحبات مزاج",
    pageTitle: "مزاج بوكس برو Mazaj Box Pro",
    pageLink: "مزاج-بوكس-برو",
    pageDescription:
      "جديد مزاج بوكس برو 12000 ، جهاز بطارية بسعة 750 ملي امبير مستقل بالاضافة لعدد 2 بود سعة كل بود 13 مل من النكهة و حتى 6000 موشة ، 20 و 50 نيكوتين",
  },
  {
    name: "بكجات توفير",
    pageTitle: "بكجات فيب توفير",
    pageLink: "بكجات-فيب-توفير",
    pageDescription:
      "احصل على بكجات فيب توفيرية باقل الاسعار في حال رغبتك بالحصول على عروضنا الترويجية من متجر زيرو فيب ، اطلب الان",
  },
  {
    name: "نكهات فيب أقل من 60 ريال",
    parentName: "عروض تصفية",
    pageTitle: "نكهات فيب أقل من 60 ريال | عروض قوية وتوفير حقيقي",
    pageLink: "نكهات-فيب-اقل-من-60-ريال",
    pageDescription:
      "تسوّق أفضل نكهات الفيب الأصلية بسعر أقل من 60 ريال. خيارات متعددة، جودة عالية، وتوفير مثالي لعشّاق الفيب في السعودية.",
  },
  {
    name: "سحبة سيجارة Vape pen",
    pageTitle: "سحبة | أجهزة سحبة فيب أصلية بأسعار منافسة",
    pageLink: "سحبة-سيجارة-vape-pen",
    pageDescription:
      "تسوق أجهزة سحبة فيب أصلية بجميع الأنواع والنكهات. سحبة جاهزة، سحبة قابلة للشحن، وأسعار منافسة مع شحن سريع داخل السعودية",
  },
  {
    name: "عروض للحبايب ( منتجات عامة )",
    parentName: "عروض تصفية",
    hidden: true,
  },
  { name: "مزاج 3000", parentName: "سحبات مزاج" },
  {
    name: "6 نيكوتين",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات فيب 6 نيكوتين",
    pageLink: "6-نيكوتين",
    pageDescription:
      "هل تبحث عن نكهات فيب 6 نيكوتين ؟ لقد وصلت وجهتك ، متجر زيرو يقدم لكم مجموعة واسعة من نكهات التركيز 6 نيكوتين لتلبي احتياجاتكم",
  },
  { name: "قوست فيب", parentName: "سحبات جاهزة لمرة واحدة" },
  {
    name: "أجهزة شيشة الكترونية",
    pageTitle: "أجهزة شيشة الكترونية",
    pageLink: "أجهزة-شيشة-الكترونية",
    pageDescription:
      "أجهزة شيشة الكترونية او الفيب الالكتروني هي اجهزة تحاكي الشيشة التقليدية وذات كثافة عاليه من الدخان تجدون هنا ارخص الاسعار مع الضمان واحجام صغيرة و كبيرة",
  },
  { name: "بودات مزاج 6000", parentName: "سحبات مزاج" },
  {
    name: "9 نيكوتين",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات فيب 9 نيكوتين - نكهات هاي نيكوتين - 9MG",
    pageLink: "نكهات-فيب-9-نيكوتين-نكهات-هاي-نيكوتين-9MG",
    pageDescription:
      "نكهات فيب 9 نيكوتين - نكهات هاي نيكوتين - 9MG - نكهات 9 نيكوتين - معسلات 9 نيكوتين , معسل الكتروني",
  },
  {
    name: "قمي بلس",
    parentName: "سحبات جاهزة لمرة واحدة",
    pageTitle: "سحبة قمي بلس 2200 موشة",
    pageDescription: "سحبة قمي بلس 2200 موشة",
  },
  {
    name: "نكهات سحبة سولت نيكوتين E Juice",
    pageTitle: "نكهات سحبة سولت نيكوتين",
    pageLink: "نكهات-سحبة-سولت-e-juice",
    pageDescription:
      "اكتشف أفضل نكهات سحبة سولت نيكوتين في مجموعة متنوعة من النكهات المميزة. تمتع بتجربة فيب سلسة وقوية بتركيزات عالية من النيكوتين لتلبية احتياجاتك. احصل على النكهة المثالية الآن!",
  },
  {
    name: "12 نيكوتين",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات فيب 12 نيكوتين - نكهات هاي نيكوتين - 12MG",
    pageLink: "نكهات-فيب-12-نيكوتين-نكهات-هاي-نيكوتين-12MG",
    pageDescription:
      "نكهات فيب 12 نيكوتين - نكهات هاي نيكوتين - 12MG - نكهات 12 نيكوتين - معسلات 12 نيكوتين , معسل الكتروني",
  },
  {
    name: "مزاج ريلود 5000",
    parentName: "سحبات مزاج",
    pageTitle: "سحبة مزاج ريلود 5000",
    pageLink: "مزاج-ريلود-5000",
    pageDescription:
      "استمتع بنكهة تدوم طويلاً مع سحبة مزاج ريلود 5000، مزيج مثالي من الأداء والجودة لمحبي التدخين الإلكتروني. جربه الآن واستمتع بأفضل العروض!",
  },
  {
    name: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات فيب للشيشة الالكترونية - نكهات معسل الكتروني",
    pageLink: "نكهات-فيب-شيشة",
    pageDescription:
      "نقدم افضل نكهات الفيب للشيشة الالكترونية و نكهات معسل الكتروني الاكثر مبيعا من بين مجموعة متنوعة بافضل الاسعار من افضل متجر في السعودية . Buy Best Vape Juice And Vape Liquids Online",
  },
  {
    name: "18 نيكوتين",
    parentName: "نكهات فيب شيشة - نكهات معسل الكتروني",
    pageTitle: "نكهات فيب 18 نيكوتين - نكهات هاي نيكوتين - 18MG",
    pageLink: "نكهات-فيب-18-نيكوتين-نكهات-هاي-نيكوتين-18MG",
    pageDescription:
      "نكهات فيب 18 نيكوتين - نكهات هاي نيكوتين - 18MG - نكهات 18 نيكوتين - معسلات 18 نيكوتين ، معسل الكتروني",
  },
  {
    name: "مزاج 15000",
    parentName: "سحبات مزاج",
    pageTitle: "سحبة مزاج 15000",
    pageLink: "مزاج-15000",
    pageDescription:
      "تجربة تدخين استثنائية مع سحبة مزاج 15000، تقدم نكهات عميقة وفعالية طويلة تدوم، مثالية لمحبي التدخين الإلكتروني المميز. تسوق الآن!",
  },
  {
    name: "نكهات بدون نيكوتين",
    pageTitle:
      "نكهات فيب بدون نيكوتين – نكهات صفر نيكوتين الأفضل في السعودية",
    pageLink: "نكهات-بدون-نيكوتين",
    pageDescription:
      "اكتشف أفضل نكهات فيب بدون نيكوتين في السعودية. نكهات صفر نيكوتين بنكهات فاكهية ومنعشة وجودة عالية. شحن سريع لجميع مدن المملكة – تسوق الآن من متجر زيرو",
  },
  { name: "نكهات شيشة فيب 120 مل", parentName: "نكهات فيب شيشة - نكهات معسل الكتروني" },
  {
    name: "مزاج 9000",
    parentName: "سحبات مزاج",
    pageTitle: "مزاج 9000 انفينيتي",
    pageLink: "مزاج-9000",
    pageDescription:
      "استمتع بأفضل نكهات التدخين الإلكتروني مع سحبة مزاج 9000 انفينيتي، تصميم مبتكر وأداء يدوم طويلاً لتجربة تدخين متكاملة. جربها الآن!",
  },
  {
    name: "سحبات جاهزة لمرة واحدة",
    pageTitle: "سحبات فيب جاهزة أصلية – توصيل سريع لكل السعودية",
    pageLink: "سحبات-جاهزة-لمرة-واحدة",
    pageDescription:
      "تسوق أفضل سحبات فيب جاهزة أصلية بنكهات قوية وسحبات طويلة. أسعار منافسة وتوصيل سريع لجميع مدن السعودية من زيرو فيب",
  },
  { name: "نكهات شيشه فيب 100 مل", parentName: "نكهات فيب شيشة - نكهات معسل الكتروني" },
  { name: "مزاج 10000", parentName: "سحبات مزاج" },
  { name: "مزاج 6000", parentName: "سحبات مزاج" },
  { name: "شيشة جاهزة لمرة واحدة" },
  {
    name: "بودات - Pods",
    pageTitle: "بودات سحبة - Replacement Pods",
    pageLink: "بودات-pods",
    pageDescription:
      "اكتشف تشكيلة واسعة من بودات السحبة البديلة بأنواع تناسب جميع الأجهزة، لتجربة تدخين إلكتروني سلسة ومستمرة. احصل على الأفضل الآن!",
  },
  {
    name: "مزاج كوب 6000",
    parentName: "سحبات مزاج",
    pageTitle: "سحبة مزاج كوب 6000",
    pageLink: "مزاج-كوب-6000",
    pageDescription:
      "اكتشف تجربة السحبة الجاهزة مع مزاج كوب 6000، تصميم عملي ونكهات تدوم طويلاً لعشاق الشيشة الإلكترونية. تسوق الآن للحصول على الأفضل!",
  },
  {
    name: "كويلات - Coils",
    pageTitle: "كويلات شيشة الكترونية - Coils Replacement",
    pageLink: "كويلات",
    pageDescription:
      "احصل على أفضل كويلات الشيشة الإلكترونية لضمان أداء قوي ونكهات نقية، متوفرة لأنواع متعددة من الأجهزة. تسوق الآن للتمتع بتجربة تدخين مثالية!",
  },
  {
    name: "مزاج 8000",
    parentName: "سحبات مزاج",
    pageTitle: "سحبة مزاج بلاك 8000",
    pageLink: "مزاج-8000",
    pageDescription:
      "تجربة تدخين فاخرة مع سحبة مزاج بلاك 8000، بتصميم أنيق ونكهات عميقة تدوم طويلاً لمحبي السحبات الجاهزة. احصل عليها الآن",
  },
  { name: "مزاج 1200", parentName: "سحبات مزاج" },
  {
    name: "مستلزمات التبغ - ملحقات و اكسسوارات الدخان",
    pageTitle: "مستلزمات التبغ - ملحقات و اكسسوارات الدخان",
    pageLink: "مستلزمات-التبغ-ملحقات-و-اكسسوارات-الدخان",
    pageDescription:
      "اكتشف أفضل مستلزمات التبغ وملحقات الدخان من ولاعات و طفايات ، كماليات السجائر، علب تبغ، فلترات وأكثر! تسوق الآن أحدث اكسسوارات التدخين بجودة عالية وأسعار تنافسية",
  },
  { name: "ملحقات - Accessories" },
  { name: "مزاج 8500", parentName: "سحبات مزاج" },
  {
    name: "معسلات",
    pageTitle: "معسلات - محل معسلات - شيش ومعسلات",
    pageLink: "معسلات",
    pageDescription:
      "اكتشف أفضل أنواع الشيش ومعسلات في السعودية من متجرنا افضل من محل معسلات . نوفر لك تشكيلة متنوعة من نكهات المعسلات الأصيلة وخدمات توصيل سريعة لتجربة فريدة",
  },
  { name: "مزاج 6500", parentName: "سحبات مزاج" },
  {
    name: "مزاج 7000",
    parentName: "سحبات مزاج",
    pageTitle: "سحبة مزاج الترا 7000",
    pageLink: "مزاج-7000",
    pageDescription:
      "استمتع بتجربة السحبة الجاهزة مع مزاج الترا 7000، مزيج من الأداء المتفوق والنكهات الغنية التي تدوم طويلاً. مثالي لعشاق التدخين الإلكتروني",
  },
  {
    name: "اظرف النيكوتين",
    pageTitle: "اظرف النيكوتين - Nicotine pouches",
    pageLink: "اظرف-النيكوتين-nicotine-pouches",
    pageDescription:
      "أظرف نيكوتين خالية من التبغ تعتبر بديلة عن منتجات التبغ المدخن ، تحتوي على نيكوتين عالي النقاوة من الدرجة الصيدلانية بالإضافة إلى مكونات أخرى والتي تعد آمنة للاستخدام.",
  },
  { name: "بودات مزاج 600", parentName: "سحبات مزاج" },
  {
    name: "اجهزة ايكوس IQOS",
    pageTitle: "ايكوس - جهاز ايكوس - ايكوس السعودية - IQOS Saudi",
    pageLink: "ايكوس-جهاز-ايكوس-ايكوس-السعودية-iqos-saudi",
    pageDescription:
      "ايكوس - جهاز ايكوس - ايكوس السعودية - IQOS Saudi , IQOS التميمي  , جهاز iqos  , IQOS terea  , دخان iqos  , سعر جهاز ايكوس",
  },
  { name: "مزاج 600", parentName: "سحبات مزاج" },
  {
    name: "ورق لف السجائر - Rolling Paper",
    pageTitle: "ورق لف السجائر - Rolling Paper",
    pageLink: "ورق-لف-السجائر-rolling-paper",
    pageDescription:
      "اكتشف تشكيلتنا المتنوعة من أفضل ورق لف السجائر لتجربة تدخين مثالية. جودة عالية، تنوع كبير، و اسعار مناسبة لكل الأذواق، ورق لف خام",
  },
  { name: "مزاج 900", parentName: "سحبات مزاج" },
  {
    name: "سيقار",
    pageTitle: "سيجار فاخرة: استمتع بأفضل أنواع السيجار الفاخر",
    pageLink: "سيقار-سيجار",
    pageDescription: "استمتع بأفضل أنواع سيقار الفاخر. اكتشف مجموعتنا اليوم!",
  },
  {
    name: "شيشة تقليدية",
    pageTitle: "شيشة تقليدية: استمتع بتجربة تدخين أصيلة وفريدة",
    pageDescription: "استمتع بتجربة فريدة مع شيشة تقليدية. اكتشف تشكيلتنا الآن!",
  },
  { name: "مزاج 1000", parentName: "سحبات مزاج" },
  { name: "مزاج 2000", parentName: "سحبات مزاج" },
  { name: "عروض مجنونة" },
  { name: "مزاج 2500", parentName: "سحبات مزاج" },
  { name: "مزاج 4000", parentName: "سحبات مزاج" },
  { name: "مزاج 5500", parentName: "سحبات مزاج" },
]

const cleanText = (value?: string) => {
  if (!value) {
    return ""
  }

  return value.replace(/^"+|"+$/g, "").replace(/\s+/g, " ").trim()
}

const toHandle = (value: string) =>
  cleanText(value)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")

const getSeoTitle = (category: ImportedCategory) =>
  cleanText(category.pageTitle) || `${cleanText(category.name)} | تسوق الآن في السعودية`

const getSeoDescription = (category: ImportedCategory) =>
  cleanText(category.pageDescription) ||
  `تسوّق منتجات ${cleanText(
    category.name
  )} الأصلية مع شحن سريع داخل السعودية واكتشف أفضل العروض المتوفرة الآن.`

const getHandle = (category: ImportedCategory) =>
  toHandle(category.pageLink || category.name)

const loadExistingCategories = async (query: any) => {
  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "parent_category_id"],
  })

  return (data || []) as ExistingCategory[]
}

const getDeletionOrder = (categories: ExistingCategory[]) => {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const depthCache = new Map<string, number>()

  const getDepth = (category: ExistingCategory): number => {
    const cached = depthCache.get(category.id)

    if (typeof cached === "number") {
      return cached
    }

    const parentId = category.parent_category_id || undefined
    const depth = parentId && byId.has(parentId)
      ? getDepth(byId.get(parentId)!) + 1
      : 0

    depthCache.set(category.id, depth)

    return depth
  }

  return [...categories].sort((first, second) => getDepth(second) - getDepth(first))
}

export default async function syncImportedCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const existing = await loadExistingCategories(query)

  for (const category of getDeletionOrder(existing)) {
    await deleteProductCategoriesWorkflow(container).run({
      input: [category.id],
    })
  }

  const siblingRanks = new Map<string, number>()
  const createdCategoryIds = new Map<string, string>()

  const createCategory = async (category: ImportedCategory, parentCategoryId?: string) => {
    const siblingKey = parentCategoryId || "__root__"
    const rank = siblingRanks.get(siblingKey) || 0
    siblingRanks.set(siblingKey, rank + 1)

    const seoTitle = getSeoTitle(category)
    const seoDescription = getSeoDescription(category)

    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: cleanText(category.name),
            description: seoDescription,
            handle: getHandle(category),
            is_active: !category.hidden,
            parent_category_id: parentCategoryId,
            rank,
            metadata: {
              imported_from: IMPORT_SOURCE,
              page_title: seoTitle,
              page_description: seoDescription,
              meta_title: seoTitle,
              meta_description: seoDescription,
              source_page_link: cleanText(category.pageLink),
            },
          },
        ],
      },
    })

    createdCategoryIds.set(category.name, result[0].id)
  }

  const rootCategories = IMPORTED_CATEGORIES.filter((category) => !category.parentName)
  const childCategories = IMPORTED_CATEGORIES.filter((category) => category.parentName)

  for (const category of rootCategories) {
    await createCategory(category)
  }

  let pending = [...childCategories]

  while (pending.length) {
    const unresolved: ImportedCategory[] = []
    let createdThisPass = 0

    for (const category of pending) {
      const parentId = createdCategoryIds.get(category.parentName!)

      if (!parentId) {
        unresolved.push(category)
        continue
      }

      await createCategory(category, parentId)
      createdThisPass += 1
    }

    if (!createdThisPass && unresolved.length) {
      throw new Error(
        `Unable to resolve parent categories for: ${unresolved
          .map((category) => `${category.name} -> ${category.parentName}`)
          .join(", ")}`
      )
    }

    pending = unresolved
  }

  logger.info(
    `Category sync complete. Deleted: ${existing.length}. Created: ${IMPORTED_CATEGORIES.length}.`
  )
}
