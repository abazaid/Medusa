"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateAllProductDescriptions;
var utils_1 = require("@medusajs/framework/utils");
var core_flows_1 = require("@medusajs/core-flows");
var DRY_RUN = process.env.SEO_DRY_RUN === "true";
var MAX_PRODUCTS = Math.max(1, Number(process.env.SEO_MAX_PRODUCTS || "10000"));
var ONLY_MISSING_DESCRIPTION = process.env.SEO_ONLY_MISSING_DESCRIPTION === "true";
var UPDATE_BATCH_SIZE = Math.max(1, Number(process.env.SEO_UPDATE_BATCH_SIZE || "50"));
var COUNTRY_CODE = "ar";
var normalizeText = function (value) {
    return (value || "").replace(/\s+/g, " ").trim();
};
var normalizeKey = function (value) {
    return normalizeText(value)
        .toLowerCase()
        .replace(/[-_/]+/g, " ");
};
var stripHtml = function (value) {
    return normalizeText((value || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " "));
};
var uniq = function (values) {
    return Array.from(new Set(values.map(function (value) { return normalizeText(value); }).filter(Boolean)));
};
var extractMatches = function (text, regex, formatter) { return uniq(Array.from(text.matchAll(regex)).map(function (match) { return formatter(match[1] || match[0] || ""); })); };
var toListHtml = function (items) {
    return "<ul>".concat(items.map(function (item) { return "<li>".concat(item, "</li>"); }).join(""), "</ul>");
};
var truncate = function (value, limit) {
    return value.length <= limit ? value : "".concat(value.slice(0, Math.max(0, limit - 3)).trim(), "...");
};
var productUrl = function (handle) { return "/".concat(COUNTRY_CODE, "/products/").concat(encodeURIComponent(handle)); };
var categoryUrl = function (handle) {
    return "/".concat(COUNTRY_CODE, "/categories/").concat(encodeURIComponent(handle));
};
var brandUrl = function (handle) { return "/".concat(COUNTRY_CODE, "/brands/").concat(encodeURIComponent(handle)); };
var collectionUrl = function (handle) {
    return "/".concat(COUNTRY_CODE, "/collections/").concat(encodeURIComponent(handle));
};
var inferType = function (text) {
    var t = normalizeKey(text);
    if (/(disposable|سحبة|جاهزة)/i.test(t))
        return "disposable";
    if (/(coil|coils|كويل|mesh|ohm|resistance|مقاومة)/i.test(t))
        return "coil";
    if (/(pod|pods|بود|cartridge|cart|replacement pod)/i.test(t))
        return "pod";
    if (/(salt|سولت|nic salt|salt nic)/i.test(t))
        return "salt";
    if (/(freebase|free base|shortfill|e liquid|e-liquid|juice|نكهة)/i.test(t))
        return "freebase";
    if (/(kit|device|mod|starter|جهاز|بود سيستم|pod system|xros|argus|caliburn)/i.test(t))
        return "device";
    if (/(accessor|ملحق|بطارية|تانك|شاحن|قطن|ورق لف)/i.test(t))
        return "accessory";
    return "generic";
};
var isVariantAvailable = function (variant) {
    if (variant.allow_backorder)
        return true;
    if (variant.manage_inventory === false)
        return true;
    return Number(variant.inventory_quantity || 0) > 0;
};
var isProductAvailable = function (product) {
    var variants = product.variants || [];
    if (!variants.length) {
        return true;
    }
    return variants.some(isVariantAvailable);
};
var buildFacts = function (product) {
    var _a, _b, _c, _d, _e;
    var metadata = (product.metadata || {});
    var category = (_a = product.categories) === null || _a === void 0 ? void 0 : _a[0];
    var allText = normalizeText(__spreadArray(__spreadArray(__spreadArray(__spreadArray([
        product.title,
        stripHtml(product.description),
        (_b = product.type) === null || _b === void 0 ? void 0 : _b.value,
        category === null || category === void 0 ? void 0 : category.name,
        (_c = product.collection) === null || _c === void 0 ? void 0 : _c.title
    ], (product.tags || []).map(function (tag) { return tag.value || ""; }), true), (product.options || []).flatMap(function (option) { return __spreadArray([
        option.title || ""
    ], ((option.values || []).map(function (value) { return value.value || ""; })), true); }), true), (product.variants || []).flatMap(function (variant) { return __spreadArray([
        variant.title || ""
    ], ((variant.options || []).map(function (value) { return value.value || ""; })), true); }), true), [
        typeof metadata.brand_name_ar === "string" ? metadata.brand_name_ar : "",
        typeof metadata.brand_name_en === "string" ? metadata.brand_name_en : "",
        typeof metadata.product_type === "string" ? metadata.product_type : "",
    ], false).join(" "));
    var nicotineStrengths = extractMatches(allText, /(\d{1,2})\s*(?:mg|مجم|ملغ)/gi, function (value) { return "".concat(value, "mg"); });
    var volumeValues = extractMatches(allText, /(\d+(?:\.\d+)?)\s*(?:ml|مل)/gi, function (value) { return "".concat(value, "ml"); });
    var resistanceValues = extractMatches(allText, /(\d(?:\.\d+)?)\s*(?:ohm|Ω|اوم)/gi, function (value) { return "".concat(value, "ohm"); });
    var batteryValue = extractMatches(allText, /(\d{3,5})\s*(?:mah|mAh)/gi, function (value) { return "".concat(value, "mAh"); })[0] || "";
    var compatibleKeywords = uniq(Array.from(allText.matchAll(/(?:compatible with|متوافق مع|يناسب)\s+([^\.\،,\n]+)/gi)).map(function (match) { return truncate(normalizeText(match[1]), 70); }));
    var optionSummary = uniq((product.options || []).flatMap(function (option) {
        var title = normalizeText(option.title);
        var values = uniq((option.values || []).map(function (value) { return value.value || ""; }));
        return title && values.length ? ["".concat(title, ": ").concat(values.join("، "))] : [];
    }));
    var tags = uniq((product.tags || []).map(function (tag) { return tag.value || ""; }));
    var inferredType = inferType(allText);
    return {
        brandName: normalizeText((typeof metadata.brand_name_ar === "string" && metadata.brand_name_ar) ||
            (typeof metadata.brand_name_en === "string" && metadata.brand_name_en) ||
            "") || "العلامة الأصلية",
        brandHandle: typeof metadata.brand_handle === "string" ? normalizeText(metadata.brand_handle) : "",
        categoryName: normalizeText(category === null || category === void 0 ? void 0 : category.name) || "مستلزمات الفيب",
        categoryHandle: normalizeText(category === null || category === void 0 ? void 0 : category.handle) || "",
        collectionTitle: normalizeText((_d = product.collection) === null || _d === void 0 ? void 0 : _d.title),
        typeName: normalizeText((_e = product.type) === null || _e === void 0 ? void 0 : _e.value) || normalizeText(String(metadata.product_type || "")),
        inferredType: inferredType,
        nicotineStrengths: nicotineStrengths,
        volumeValues: volumeValues,
        resistanceValues: resistanceValues,
        batteryValue: batteryValue,
        compatibleKeywords: compatibleKeywords,
        optionSummary: optionSummary,
        tags: tags,
    };
};
var pickRelatedProducts = function (product, allProducts) {
    var _a, _b;
    var categoryHandle = normalizeText((_b = (_a = product.categories) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.handle);
    var brandHandle = typeof (product.metadata || {}).brand_handle === "string"
        ? normalizeText(String((product.metadata || {}).brand_handle))
        : "";
    var candidates = allProducts
        .filter(function (candidate) { return candidate.id !== product.id; })
        .filter(isProductAvailable);
    var sameCategory = candidates.filter(function (candidate) {
        var _a, _b, _c, _d;
        return normalizeText((_b = (_a = candidate.categories) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.handle) &&
            normalizeText((_d = (_c = candidate.categories) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.handle) === categoryHandle;
    });
    var sameBrand = candidates.filter(function (candidate) {
        var candidateBrand = typeof (candidate.metadata || {}).brand_handle === "string"
            ? normalizeText(String((candidate.metadata || {}).brand_handle))
            : "";
        return Boolean(brandHandle && candidateBrand === brandHandle);
    });
    return uniq(__spreadArray(__spreadArray([], sameCategory, true), sameBrand, true).map(function (candidate) { return candidate.id; }))
        .map(function (id) { return candidates.find(function (candidate) { return candidate.id === id; }); })
        .filter(function (candidate) { return Boolean(candidate); })
        .slice(0, 3);
};
var buildInternalLinks = function (product, facts, related) {
    var _a;
    var links = [];
    if (facts.categoryHandle) {
        links.push({
            href: categoryUrl(facts.categoryHandle),
            label: facts.categoryName,
        });
    }
    if (facts.brandHandle) {
        links.push({
            href: brandUrl(facts.brandHandle),
            label: "\u0628\u0631\u0627\u0646\u062F ".concat(facts.brandName),
        });
    }
    if ((_a = product.collection) === null || _a === void 0 ? void 0 : _a.handle) {
        links.push({
            href: collectionUrl(product.collection.handle),
            label: facts.collectionTitle || "المجموعة",
        });
    }
    var accessoryCategory = [
        { handle: "accessories", label: "مستلزمات الفيب" },
        { handle: "coils", label: "الكويلات" },
        { handle: "pods", label: "البودات" },
    ];
    for (var _i = 0, accessoryCategory_1 = accessoryCategory; _i < accessoryCategory_1.length; _i++) {
        var item = accessoryCategory_1[_i];
        if (links.length >= 5)
            break;
        links.push({
            href: categoryUrl(item.handle),
            label: item.label,
        });
    }
    for (var _b = 0, related_1 = related; _b < related_1.length; _b++) {
        var relatedProduct = related_1[_b];
        if (links.length >= 5)
            break;
        links.push({
            href: productUrl(relatedProduct.handle),
            label: relatedProduct.title,
        });
    }
    return uniq(links.map(function (item) { return "".concat(item.href, "|").concat(item.label); }))
        .map(function (item) {
        var _a = item.split("|"), href = _a[0], label = _a[1];
        return { href: href, label: label };
    })
        .slice(0, 5);
};
var renderLink = function (link, fallback) {
    return link ? "<a href=\"".concat(link.href, "\">").concat(link.label, "</a>") : fallback || "";
};
var buildTechnicalSpecs = function (facts, product) {
    var specs = [
        "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C: ".concat(product.title),
        "\u0627\u0644\u0628\u0631\u0627\u0646\u062F: ".concat(facts.brandName),
        "\u0627\u0644\u0641\u0626\u0629: ".concat(facts.categoryName),
        "\u0646\u0648\u0639 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645: ".concat(facts.inferredType === "device"
            ? "جهاز فيب"
            : facts.inferredType === "salt"
                ? "نكهة نيكوتين سولت"
                : facts.inferredType === "freebase"
                    ? "سائل فيب"
                    : facts.inferredType === "coil"
                        ? "كويل"
                        : facts.inferredType === "pod"
                            ? "بود أو خرطوشة بديلة"
                            : facts.inferredType === "disposable"
                                ? "سحبة جاهزة"
                                : "ملحق فيب"),
        "\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629: ".concat(facts.optionSummary.join(" | ") || "بحسب المخزون المتوفر"),
        "\u0642\u0648\u0629 \u0627\u0644\u0646\u064A\u0643\u0648\u062A\u064A\u0646: ".concat(facts.nicotineStrengths.join("، ") || "بحسب الإصدار المتوفر"),
        "\u0627\u0644\u0633\u0639\u0629 \u0623\u0648 \u0627\u0644\u062D\u062C\u0645: ".concat(facts.volumeValues.join("، ") || "راجع خيارات المنتج"),
        "\u0627\u0644\u0645\u0642\u0627\u0648\u0645\u0627\u062A \u0623\u0648 \u0627\u0644\u0623\u0648\u0645: ".concat(facts.resistanceValues.join("، ") || "حسب النسخة أو الملحق المتوافق"),
        "\u0633\u0639\u0629 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629: ".concat(facts.batteryValue || "تختلف حسب الإصدار"),
        "\u0627\u0644\u062A\u0648\u0627\u0641\u0642: ".concat(facts.compatibleKeywords.join("، ") || "راجع اسم الجهاز أو الموديل المناسب"),
    ];
    return toListHtml(specs);
};
var buildFaqs = function (facts, related) {
    var _a;
    var relatedTitle = ((_a = related[0]) === null || _a === void 0 ? void 0 : _a.title) || "منتجات مشابهة من نفس الفئة";
    var qa = [
        {
            q: "هل هذا المنتج مناسب للمبتدئين؟",
            a: "نعم، ويعتمد ذلك على نوع المنتج نفسه. إذا كنت تبحث عن خيار واضح وسهل الفهم فستجد هنا المعلومات الأساسية التي تساعدك على اختيار النسخة المناسبة بثقة أكبر.",
        },
        {
            q: "ما الفائدة الأساسية من هذا المنتج؟",
            a: "\u0627\u0644\u0641\u0627\u0626\u062F\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0645\u0646\u0647 \u0623\u0646\u0647 \u064A\u0642\u062F\u0645 \u0644\u0643 ".concat(facts.inferredType === "salt"
                ? "نكهة واضحة ومتوازنة"
                : facts.inferredType === "device"
                    ? "استخدامًا عمليًا وسهلًا"
                    : facts.inferredType === "pod"
                        ? "توافقًا واضحًا واستبدالًا مريحًا"
                        : facts.inferredType === "coil"
                            ? "أداءً ثابتًا عند اختيار المقاومة المناسبة"
                            : "خيارًا مناسبًا في فئته", " \u0645\u0639 \u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0645\u0631\u062A\u0628\u0629 \u0648\u062E\u064A\u0627\u0631\u0627\u062A \u062A\u0633\u0627\u0639\u062F\u0643 \u0639\u0644\u0649 \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0628\u0634\u0643\u0644 \u0623\u0633\u0631\u0639."),
        },
        {
            q: "هل أستطيع اختيار القوة أو المقاس المناسب؟",
            a: "\u063A\u0627\u0644\u0628\u064B\u0627 \u0646\u0639\u0645. \u062A\u0638\u0647\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C \u062E\u064A\u0627\u0631\u0627\u062A \u0645\u062B\u0644 ".concat(facts.optionSummary.join("، ") || "خيارات متعددة حسب المتاح", "\u060C \u0644\u0630\u0644\u0643 \u0645\u0646 \u0627\u0644\u0623\u0641\u0636\u0644 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0643 \u0642\u0628\u0644 \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629."),
        },
        {
            q: "هل يوجد منتجات مرتبطة يمكن شراؤها معه؟",
            a: "\u0646\u0639\u0645\u060C \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0645\u0646\u062A\u062C\u0627\u062A \u0642\u0631\u064A\u0628\u0629 \u0623\u0648 \u0645\u0643\u0645\u0644\u0629 \u0645\u062B\u0644 ".concat(relatedTitle, "\u060C \u0648\u0630\u0644\u0643 \u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0631\u064A\u062F \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0623\u0648 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u062D\u062A\u064A\u0627\u062C\u0643 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629."),
        },
        {
            q: "كيف أعرف التوافق الصحيح قبل الشراء؟",
            a: "راجع عنوان المنتج والمواصفات الفنية والخيارات المتاحة، وتأكد من اسم الجهاز أو الفئة أو المقاومة أو السعة قبل إتمام الطلب.",
        },
        {
            q: "هل هذا المنتج مناسب للاستخدام اليومي؟",
            a: "إذا كانت مواصفاته وخياراته تناسب أسلوب استخدامك اليومي، فهو يعد خيارًا مناسبًا ضمن فئته، خاصة عندما تختار النسخة المتوافقة مع احتياجك الفعلي.",
        },
    ];
    return qa.map(function (item) { return "<h3>".concat(item.q, "</h3><p>").concat(item.a, "</p>"); }).join("");
};
var buildDescription = function (product, allProducts) {
    var _a;
    var facts = buildFacts(product);
    var related = pickRelatedProducts(product, allProducts);
    var links = buildInternalLinks(product, facts, related);
    var categoryLink = links.find(function (link) { return link.href.includes("/categories/"); });
    var brandLink = links.find(function (link) { return link.href.includes("/brands/"); });
    var collectionLink = links.find(function (link) { return link.href.includes("/collections/"); });
    var relatedLink = links.find(function (link) { return link.href.includes("/products/"); });
    var accessoryLink = links.find(function (link) { return link.label === "مستلزمات الفيب"; }) ||
        links.find(function (link) { return link.label === "الكويلات"; }) ||
        links.find(function (link) { return link.label === "البودات"; });
    var intro = "<h2>Introduction</h2><p>".concat(product.title, " ").concat(facts.inferredType === "salt"
        ? "مناسب لمن يبحث عن نكهة واضحة وتوازن مريح في الاستخدام."
        : facts.inferredType === "device"
            ? "يأتي كخيار عملي لمن يريد جهازًا واضح المواصفات وسهل الاستخدام."
            : facts.inferredType === "pod"
                ? "يوفر خيارًا مناسبًا لمن يحتاج بودات بديلة أو خرطوشة متوافقة بوضوح."
                : facts.inferredType === "coil"
                    ? "يخدم من يبحث عن مقاومة مناسبة وتوافق صحيح مع جهازه."
                    : facts.inferredType === "disposable"
                        ? "يعد خيارًا مناسبًا لمن يفضل الاستخدام المباشر دون إعدادات معقدة."
                        : "يقدم فائدة عملية داخل فئته مع مواصفات واضحة وخيارات مرتبة.", "</p><p>\u0648\u0645\u0646 \u062E\u0644\u0627\u0644 \u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0633\u062A\u062C\u062F \u062A\u0641\u0627\u0635\u064A\u0644 \u062A\u0633\u0627\u0639\u062F\u0643 \u0639\u0644\u0649 \u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0641\u0626\u0629\u060C \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629\u060C \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0623\u0647\u0645\u060C \u0645\u0639 \u0625\u0645\u0643\u0627\u0646\u064A\u0629 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644 \u0625\u0644\u0649 ").concat(renderLink(categoryLink, facts.categoryName), " \u0623\u0648 ").concat(renderLink(brandLink, "\u0628\u0631\u0627\u0646\u062F ".concat(facts.brandName)), " \u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0631\u064A\u062F \u0645\u0642\u0627\u0631\u0646\u0629 \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u062E\u064A\u0627\u0631\u0627\u062A \u0623\u062E\u0631\u0649 \u0642\u0631\u064A\u0628\u0629.</p>");
    var overview = "<h2>Product Overview</h2><p>\u064A\u0646\u062A\u0645\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C \u0625\u0644\u0649 \u0641\u0626\u0629 ".concat(facts.categoryName, "\u060C \u0648\u064A\u062D\u0645\u0644 \u0627\u0633\u0645 ").concat(facts.brandName, "\u060C \u0648\u0647\u0630\u0627 \u064A\u0645\u0646\u062D\u0643 \u0635\u0648\u0631\u0629 \u0623\u0648\u0636\u062D \u0639\u0646 \u0646\u0648\u0639 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0630\u064A \u0635\u064F\u0645\u0645 \u0644\u0647 \u0648\u0637\u0628\u064A\u0639\u0629 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629 \u0645\u0646\u0647. \u0633\u0648\u0627\u0621 \u0643\u0646\u062A \u062A\u0628\u062D\u062B \u0639\u0646 \u0646\u0643\u0647\u0629\u060C \u0623\u0648 \u062C\u0647\u0627\u0632\u060C \u0623\u0648 \u0628\u0648\u062F\u0627\u062A \u0628\u062F\u064A\u0644\u0629\u060C \u0623\u0648 \u0643\u0648\u064A\u0644 \u0645\u062A\u0648\u0627\u0641\u0642\u060C \u0641\u0625\u0646 \u0627\u0644\u0635\u0641\u062D\u0629 \u062A\u0636\u0639 \u0623\u0645\u0627\u0645\u0643 \u0623\u0647\u0645 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0628\u0634\u0643\u0644 \u0645\u0628\u0627\u0634\u0631.</p><p>\u0648\u0636\u0648\u062D \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u064A\u062C\u0639\u0644 ").concat(product.title, " \u0623\u0633\u0647\u0644 \u0641\u064A \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0639 \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0634\u0627\u0628\u0647\u0629\u060C \u062E\u0635\u0648\u0635\u064B\u0627 \u0625\u0630\u0627 \u0643\u0646\u062A \u0645\u0627 \u0632\u0644\u062A \u062A\u062D\u0633\u0645 \u0627\u062E\u062A\u064A\u0627\u0631\u0643 \u0628\u064A\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0645\u0646\u062A\u062C \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629 \u0623\u0648 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u062E\u0637.</p>");
    var featureItems = [
        "\u064A\u0646\u062A\u0645\u064A \u0625\u0644\u0649 \u0641\u0626\u0629 ".concat(facts.categoryName),
        "\u0645\u0631\u062A\u0628\u0637 \u0628\u0628\u0631\u0627\u0646\u062F ".concat(facts.brandName),
        "\u064A\u0638\u0647\u0631 \u0628\u062E\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0636\u062D\u0629 \u0645\u062B\u0644: ".concat(facts.optionSummary.join("، ") || "نسخ متعددة حسب المتاح"),
        "\u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0639 \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0634\u0627\u0628\u0647\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629",
        "\u064A\u0639\u0631\u0636 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0628\u0637\u0631\u064A\u0642\u0629 \u0633\u0647\u0644\u0629 \u0627\u0644\u0641\u0647\u0645",
        "\u064A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0627\u062A\u062E\u0627\u0630 \u0642\u0631\u0627\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u0628\u0633\u0631\u0639\u0629 \u0623\u0643\u0628\u0631 \u0628\u0641\u0636\u0644 \u0648\u0636\u0648\u062D \u0627\u0644\u062A\u0631\u062A\u064A\u0628",
    ];
    var keyFeatures = "<h2>Key Features</h2>".concat(toListHtml(featureItems));
    var technicalSpecifications = "<h2>Technical Specifications</h2>".concat(buildTechnicalSpecs(facts, product));
    var designAndBuild = "<h2>Design and Build Quality</h2><p>\u0627\u0644\u0627\u0646\u0637\u0628\u0627\u0639 \u0627\u0644\u0623\u0648\u0644 \u0639\u0646 ".concat(product.title, " \u064A\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0645\u062F\u0649 \u0648\u0636\u0648\u062D \u0627\u0644\u0641\u0626\u0629 \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0648\u0637\u0631\u064A\u0642\u0629 \u0639\u0631\u0636 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A. \u0641\u064A \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0648\u0627\u0644\u0645\u0644\u062D\u0642\u0627\u062A \u064A\u0647\u0645\u0643 \u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0648\u0633\u0647\u0648\u0644\u0629 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u0648 \u0627\u0644\u0627\u0633\u062A\u0628\u062F\u0627\u0644\u060C \u0628\u064A\u0646\u0645\u0627 \u0641\u064A \u0627\u0644\u0633\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u0646\u0643\u0647\u0627\u062A \u062A\u0628\u0631\u0632 \u0623\u0647\u0645\u064A\u0629 \u0627\u0644\u0633\u0639\u0629 \u0648\u0627\u0644\u062A\u0631\u0643\u064A\u0632 \u0648\u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629. \u0644\u0647\u0630\u0627 \u0641\u0625\u0646 \u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0647\u0646\u0627 \u064A\u0633\u0627\u0639\u062F\u0643 \u0639\u0644\u0649 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0633\u0631\u0639\u0629 \u0648\u0628\u062F\u0648\u0646 \u062A\u0634\u0648\u064A\u0634.</p><p>\u0643\u0644\u0645\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0623\u0648\u0636\u062D\u060C \u0623\u0635\u0628\u062D \u0627\u0644\u0642\u0631\u0627\u0631 \u0623\u0633\u0647\u0644. \u0648\u0647\u0630\u0627 \u0645\u0627 \u064A\u062C\u0639\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 \u0645\u0641\u064A\u062F\u0629 \u0644\u0644\u0645\u0634\u062A\u0631\u064A \u0627\u0644\u0630\u064A \u064A\u0631\u064A\u062F \u0641\u0647\u0645\u064B\u0627 \u0645\u0628\u0627\u0634\u0631\u064B\u0627 \u0644\u0644\u0645\u0646\u062A\u062C \u0628\u062F\u0644 \u0648\u0635\u0641 \u0637\u0648\u064A\u0644 \u0644\u0627 \u064A\u0636\u064A\u0641 \u0642\u064A\u0645\u0629 \u0641\u0639\u0644\u064A\u0629.</p>");
    var performance = "<h2>Performance and Vapor Production</h2><p>\u0627\u0644\u0623\u062F\u0627\u0621 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 \u0645\u0646 ".concat(product.title, " \u064A\u062E\u062A\u0644\u0641 \u062D\u0633\u0628 \u0646\u0648\u0639\u0647\u060C \u0644\u0643\u0646 \u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u062A\u0628\u0642\u0649 \u0648\u0627\u062D\u062F\u0629: \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0646\u062A\u062C \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u064A\u0628\u062F\u0623 \u0645\u0646 \u0641\u0647\u0645 \u0627\u0644\u0641\u0626\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0635\u062D\u064A\u062D\u0629. \u0641\u064A \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0648\u0627\u0644\u0633\u062D\u0628\u0627\u062A \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u064A\u0643\u0648\u0646 \u0627\u0644\u0627\u0647\u062A\u0645\u0627\u0645 \u063A\u0627\u0644\u0628\u064B\u0627 \u0628\u0631\u0627\u062D\u0629 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0648\u062B\u0628\u0627\u062A \u0627\u0644\u0623\u062F\u0627\u0621\u060C \u0648\u0641\u064A \u0627\u0644\u0633\u0648\u0627\u0626\u0644 \u064A\u0628\u0631\u0632 \u0648\u0636\u0648\u062D \u0627\u0644\u0646\u0643\u0647\u0629 \u0648\u0627\u0644\u062A\u0648\u0627\u0632\u0646\u060C \u0648\u0641\u064A \u0627\u0644\u0628\u0648\u062F\u0627\u062A \u0648\u0627\u0644\u0643\u0648\u064A\u0644\u0627\u062A \u062A\u0638\u0647\u0631 \u0623\u0647\u0645\u064A\u0629 \u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0648\u0633\u0647\u0648\u0644\u0629 \u0627\u0644\u0627\u0633\u062A\u0628\u062F\u0627\u0644.</p><p>\u0648\u0644\u0647\u0630\u0627 \u0641\u0625\u0646 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0648\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u0642\u0628\u0644 \u0627\u0644\u0634\u0631\u0627\u0621 \u062A\u0645\u0646\u062D\u0643 \u0646\u062A\u064A\u062C\u0629 \u0623\u0641\u0636\u0644\u060C \u062E\u0627\u0635\u0629 \u0639\u0646\u062F\u0645\u0627 \u062A\u0646\u062A\u0642\u0644 \u0628\u0639\u062F\u0647\u0627 \u0625\u0644\u0649 \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0634\u0627\u0628\u0647\u0629 \u0623\u0648 \u0645\u0643\u0645\u0644\u0629 \u0645\u062A\u0648\u0641\u0631\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629.</p>");
    var ourReview = "<h2>Our Review</h2><p>".concat(product.title, " \u064A\u0638\u0647\u0631 \u0643\u062E\u064A\u0627\u0631 \u0648\u0627\u0636\u062D \u0644\u0645\u0646 \u064A\u0631\u064A\u062F \u0635\u0641\u062D\u0629 \u0645\u0646\u062A\u062C \u0645\u0631\u062A\u0628\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629. \u0627\u0644\u0641\u0626\u0629 \u0645\u0639\u0631\u0648\u0641\u0629\u060C \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0638\u0627\u0647\u0631\u0629\u060C \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u062A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0641\u0647\u0645 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u062F\u0648\u0646 \u062A\u0639\u0642\u064A\u062F. \u0648\u0647\u0630\u0647 \u0646\u0642\u0637\u0629 \u0645\u0647\u0645\u0629 \u0644\u0623\u064A \u0639\u0645\u064A\u0644 \u064A\u0631\u064A\u062F \u0627\u0644\u0634\u0631\u0627\u0621 \u0628\u0639\u062F \u0645\u0642\u0627\u0631\u0646\u0629 \u0633\u0631\u064A\u0639\u0629 \u0648\u0645\u0641\u0647\u0648\u0645\u0629.</p><p>\u0643\u0645\u0627 \u0623\u0646 \u0648\u062C\u0648\u062F \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0631\u062A\u0628\u0637\u0629 \u0645\u062A\u0648\u0641\u0631\u0629 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0633\u064A\u0627\u0642 \u064A\u062C\u0639\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0628\u062F\u0627\u0626\u0644 \u0623\u0648 \u0627\u0644\u0645\u0643\u0645\u0644\u0627\u062A \u0623\u0633\u0647\u0644\u060C \u0648\u064A\u0645\u0646\u062D\u0643 \u062A\u062C\u0631\u0628\u0629 \u062A\u0635\u0641\u062D \u0623\u0643\u062B\u0631 \u0631\u0627\u062D\u0629 \u0625\u0630\u0627 \u0643\u0646\u062A \u0644\u0627 \u062A\u0632\u0627\u0644 \u062A\u0642\u0627\u0631\u0646 \u0628\u064A\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u062E\u064A\u0627\u0631.</p>");
    var howToUseItems = facts.inferredType === "device" || facts.inferredType === "disposable"
        ? [
            "راجع مواصفات المنتج والخيارات المتاحة قبل إضافته إلى السلة.",
            "اختر النسخة المناسبة لك من حيث الطراز أو السعة أو الإصدار.",
            "إذا كان المنتج يحتاج ملحقًا إضافيًا فتأكد من التوافق قبل الشراء.",
            "استخدم المنتج وفق الفئة المخصصة له وتعليمات الشركة المصنعة.",
            "احرص على اختيار النسخ الأصلية والمتوافقة للحصول على أفضل نتيجة.",
        ]
        : [
            "تأكد من مطابقة الفئة أو المقاومة أو القوة قبل الشراء.",
            "راجع اسم الجهاز أو البود أو الكويل المرتبط بهذا المنتج.",
            "اختر التركيز أو المقاس المناسب من الخيارات المتاحة.",
            "أضف المنتجات المكملة إذا كنت تريد إكمال الطلب من نفس الفئة.",
            "استخدم المنتج ضمن التوافق الموصى به للحصول على أفضل أداء.",
        ];
    var howToUse = "<h2>How to Use</h2>".concat(toListHtml(howToUseItems));
    var comparison = "<h2>Comparison</h2><p>\u0639\u0646\u062F \u0645\u0642\u0627\u0631\u0646\u0629 ".concat(product.title, " \u0628\u0645\u0646\u062A\u062C \u0622\u062E\u0631 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629 \u0645\u062B\u0644 ").concat(((_a = related[0]) === null || _a === void 0 ? void 0 : _a.title) || "منتج مشابه", "\u060C \u0641\u0625\u0646 \u0623\u0641\u0636\u0644 \u0646\u0642\u0637\u0629 \u0628\u062F\u0627\u064A\u0629 \u062A\u0643\u0648\u0646 \u0641\u064A \u0641\u0647\u0645 \u0627\u0644\u0641\u0626\u0629\u060C \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A\u060C \u0648\u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629\u060C \u0648\u0645\u062F\u0649 \u0627\u0644\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 \u0627\u062D\u062A\u064A\u0627\u062C\u0643 \u0627\u0644\u062D\u0627\u0644\u064A. \u0628\u0639\u0636 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u062A\u0643\u0648\u0646 \u0623\u0642\u0631\u0628 \u0644\u0645\u0627 \u062A\u0631\u064A\u062F\u0647 \u0645\u0646 \u062D\u064A\u062B \u0627\u0644\u062D\u062C\u0645 \u0623\u0648 \u0627\u0644\u0646\u064A\u0643\u0648\u062A\u064A\u0646 \u0623\u0648 \u0627\u0644\u0645\u0642\u0627\u0648\u0645\u0629 \u0623\u0648 \u0633\u0647\u0648\u0644\u0629 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645\u060C \u0648\u0644\u0630\u0644\u0643 \u0641\u0625\u0646 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u062A\u0639\u0637\u064A \u0635\u0648\u0631\u0629 \u0623\u0648\u0636\u062D \u0642\u0628\u0644 \u0627\u0644\u062F\u0641\u0639.</p><p>\u0625\u0630\u0627 \u0643\u0646\u062A \u0645\u0627 \u0632\u0644\u062A \u0645\u062D\u062A\u0627\u0631\u064B\u0627\u060C \u0641\u063A\u0627\u0644\u0628\u064B\u0627 \u064A\u0641\u064A\u062F\u0643 \u0627\u0644\u0627\u0646\u062A\u0642\u0627\u0644 \u0625\u0644\u0649 \u0645\u0646\u062A\u062C \u0645\u0634\u0627\u0628\u0647 \u0645\u062A\u0648\u0641\u0631 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629 \u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0641\u0631\u0648\u0642\u0627\u062A \u0628\u0634\u0643\u0644 \u0623\u0633\u0631\u0639 \u0648\u0627\u062A\u062E\u0627\u0630 \u0642\u0631\u0627\u0631 \u0623\u062F\u0642.</p>");
    var whyChoose = "<h2>Why Vapers Choose This Device</h2>".concat(toListHtml([
        "لأن الفئة والخيارات معروضة بشكل واضح.",
        "لأن المواصفات الأساسية تسهل المقارنة قبل الشراء.",
        "لأنه يمنح فكرة مباشرة عن النسخة المناسبة للاستخدام.",
        "لأن المنتجات المرتبطة المتوفرة تظهر بطريقة تساعد على استكمال الطلب.",
        "لأن الصفحة منظمة بأسلوب يجعل القرار أسهل وأسرع.",
    ]));
    var whoShouldUse = "<h2>Who Should Use This Product</h2>".concat(toListHtml([
        "من يريد الوصول إلى منتج واضح المواصفات وسهل الفهم.",
        "من يفضل مقارنة أكثر من خيار قبل اتخاذ القرار.",
        "من يحتاج معرفة التوافق أو المقاس أو القوة قبل الشراء.",
        "من يريد رؤية بدائل أو منتجات مكملة متوفرة من نفس الفئة.",
        "من يفضل الشراء بعد قراءة معلومات مرتبة ومباشرة.",
    ]));
    var whyBuy = "<h2>Why Buy From Our Store</h2>".concat(toListHtml([
        "وصف واضح ومواصفات مرتبة تساعد على الاختيار بسرعة.",
        "تنظيم جيد للأقسام والبراندات لتسهيل الوصول إلى المنتجات.",
        "منتجات مرتبطة متوفرة تساعدك على المقارنة أو استكمال الطلب.",
        "محتوى عربي مباشر ومفهوم بدون حشو غير مفيد.",
        "تجربة تصفح مريحة تساعد على اتخاذ القرار بثقة أكبر.",
    ]));
    var relatedProductsSection = "<h2>Explore Related Products</h2><p>\u0625\u0630\u0627 \u0643\u0627\u0646 ".concat(product.title, " \u0645\u0646\u0627\u0633\u0628\u064B\u0627 \u0644\u0627\u062D\u062A\u064A\u0627\u062C\u0643 \u0627\u0644\u062D\u0627\u0644\u064A\u060C \u0641\u0642\u062F \u064A\u0641\u064A\u062F\u0643 \u0623\u064A\u0636\u064B\u0627 \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0645\u0646\u062A\u062C\u0627\u062A \u0623\u062E\u0631\u0649 \u0645\u062A\u0648\u0641\u0631\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629 \u0623\u0648 \u0627\u0644\u0628\u0631\u0627\u0646\u062F. \u0627\u062E\u062A\u0631\u0646\u0627 \u0644\u0643 \u0647\u0646\u0627 \u062E\u064A\u0627\u0631\u0627\u062A \u0642\u0631\u064A\u0628\u0629 \u064A\u0645\u0643\u0646 \u0623\u0646 \u062A\u0633\u0627\u0639\u062F\u0643 \u0639\u0644\u0649 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0623\u0648 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0628\u0634\u0643\u0644 \u0623\u0641\u0636\u0644.</p>").concat(toListHtml(related.length
        ? related.map(function (item) { return "<a href=\"".concat(productUrl(item.handle), "\">").concat(item.title, "</a>"); })
        : [
            "".concat(renderLink(categoryLink, facts.categoryName), " \u0644\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0641\u0631\u0629 \u0641\u064A \u0646\u0641\u0633 \u0627\u0644\u0641\u0626\u0629."),
            "".concat(renderLink(accessoryLink, "مستلزمات الفيب"), " \u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0631\u064A\u062F \u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0643\u0645\u0644\u0629 \u0623\u0648 \u0645\u0644\u062D\u0642\u0627\u062A \u0645\u062A\u0648\u0627\u0641\u0642\u0629."),
        ]));
    var faqs = "<h2>Frequently Asked Questions</h2>".concat(buildFaqs(facts, related));
    return [
        intro,
        overview,
        keyFeatures,
        technicalSpecifications,
        designAndBuild,
        performance,
        ourReview,
        howToUse,
        comparison,
        whyChoose,
        whoShouldUse,
        whyBuy,
        relatedProductsSection,
        faqs,
    ].join("");
};
function generateAllProductDescriptions(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var logger, query, data, allProducts, candidates, updated, skipped, failed, updates, _i, candidates_1, product, nextDescription, nextMetadata, index, batch;
        var container = _b.container;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
                    query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
                    logger.info("Starting local bulk product-description generation. dry_run=".concat(DRY_RUN, ", max_products=").concat(MAX_PRODUCTS, ", only_missing_description=").concat(ONLY_MISSING_DESCRIPTION));
                    return [4 /*yield*/, query.graph({
                            entity: "product",
                            fields: [
                                "id",
                                "title",
                                "handle",
                                "description",
                                "metadata",
                                "type.value",
                                "categories.id",
                                "categories.name",
                                "categories.handle",
                                "collection.title",
                                "collection.handle",
                                "tags.value",
                                "options.title",
                                "options.values.value",
                                "variants.title",
                                "variants.options.value",
                                "variants.inventory_quantity",
                                "variants.manage_inventory",
                                "variants.allow_backorder",
                            ],
                        })];
                case 1:
                    data = (_c.sent()).data;
                    allProducts = (data || []);
                    candidates = allProducts
                        .filter(function (product) { return normalizeText(product.title); })
                        .filter(function (product) {
                        return ONLY_MISSING_DESCRIPTION ? !normalizeText(stripHtml(product.description)) : true;
                    })
                        .slice(0, MAX_PRODUCTS);
                    logger.info("Local description candidates: ".concat(candidates.length));
                    updated = 0;
                    skipped = 0;
                    failed = 0;
                    updates = [];
                    for (_i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
                        product = candidates_1[_i];
                        try {
                            nextDescription = buildDescription(product, allProducts);
                            if (!normalizeText(stripHtml(nextDescription))) {
                                skipped += 1;
                                logger.warn("Skipping ".concat(product.id, ": generated description was empty."));
                                continue;
                            }
                            nextMetadata = __assign(__assign({}, (product.metadata || {})), { seo_last_optimized_at: new Date().toISOString(), seo_last_query: "local-template-generator", seo_last_country_code: "sa", seo_source: "local_template_v3_customer_facing", seo_generation_mode: "offline_no_serp_no_ai" });
                            updates.push({
                                id: product.id,
                                description: nextDescription,
                                metadata: nextMetadata,
                            });
                            updated += 1;
                            logger.info("".concat(DRY_RUN ? "[dry-run] " : "", "Description generated for ").concat(product.id, " (").concat(product.title, ")."));
                        }
                        catch (error) {
                            failed += 1;
                            logger.error("Description generation failed for ".concat(product.id, " (").concat(product.title, "): ").concat(error instanceof Error ? error.message : "Unknown error"));
                        }
                    }
                    if (!(!DRY_RUN && updates.length)) return [3 /*break*/, 5];
                    index = 0;
                    _c.label = 2;
                case 2:
                    if (!(index < updates.length)) return [3 /*break*/, 5];
                    batch = updates.slice(index, index + UPDATE_BATCH_SIZE);
                    return [4 /*yield*/, (0, core_flows_1.updateProductsWorkflow)(container).run({
                            input: {
                                products: batch.map(function (item) { return ({
                                    id: item.id,
                                    description: item.description,
                                    metadata: item.metadata,
                                }); }),
                            },
                        })];
                case 3:
                    _c.sent();
                    logger.info("Persisted batch ".concat(Math.floor(index / UPDATE_BATCH_SIZE) + 1, " containing ").concat(batch.length, " products."));
                    _c.label = 4;
                case 4:
                    index += UPDATE_BATCH_SIZE;
                    return [3 /*break*/, 2];
                case 5:
                    logger.info("Bulk description generation complete. Updated: ".concat(updated, ". Skipped: ").concat(skipped, ". Failed: ").concat(failed, "."));
                    return [2 /*return*/];
            }
        });
    });
}
