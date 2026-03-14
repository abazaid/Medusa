module.exports = {

"[project]/src/modules/common/components/filter-radio-group/index.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$icons$2f$dist$2f$esm$2f$ellipse$2d$mini$2d$solid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EllipseMiniSolid$3e$__ = __turbopack_context__.i("[project]/node_modules/@medusajs/icons/dist/esm/ellipse-mini-solid.js [app-ssr] (ecmascript) <export default as EllipseMiniSolid>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$label$2f$label$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@medusajs/ui/dist/esm/components/label/label.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$radio$2d$group$2f$radio$2d$group$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@medusajs/ui/dist/esm/components/radio-group/radio-group.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$text$2f$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@medusajs/ui/dist/esm/components/text/text.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$utils$2f$clx$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@medusajs/ui/dist/esm/utils/clx.js [app-ssr] (ecmascript)");
;
;
;
const FilterRadioGroup = ({ title, items, value, handleChange, "data-testid": dataTestId })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex gap-x-3 flex-col gap-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$text$2f$text$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Text"], {
                className: "txt-compact-small-plus text-ui-fg-muted",
                children: title
            }, void 0, false, {
                fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$radio$2d$group$2f$radio$2d$group$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioGroup"], {
                "data-testid": dataTestId,
                onValueChange: handleChange,
                children: items?.map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$utils$2f$clx$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clx"])("flex gap-x-2 items-center", {
                            "ml-[-23px]": i.value === value
                        }),
                        children: [
                            i.value === value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$icons$2f$dist$2f$esm$2f$ellipse$2d$mini$2d$solid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__EllipseMiniSolid$3e$__["EllipseMiniSolid"], {}, void 0, false, {
                                fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
                                lineNumber: 33,
                                columnNumber: 35
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$radio$2d$group$2f$radio$2d$group$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RadioGroup"].Item, {
                                checked: i.value === value,
                                className: "hidden peer",
                                id: i.value,
                                value: i.value
                            }, void 0, false, {
                                fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
                                lineNumber: 34,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$components$2f$label$2f$label$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Label"], {
                                htmlFor: i.value,
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$utils$2f$clx$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clx"])("!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer", {
                                    "text-ui-fg-base": i.value === value
                                }),
                                "data-testid": "radio-label",
                                "data-active": i.value === value,
                                children: i.label
                            }, void 0, false, {
                                fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this)
                        ]
                    }, i.value, true, {
                        fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
                        lineNumber: 27,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/modules/common/components/filter-radio-group/index.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = FilterRadioGroup;
}}),
"[project]/src/modules/store/components/refinement-list/sort-products/index.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$modules$2f$common$2f$components$2f$filter$2d$radio$2d$group$2f$index$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/modules/common/components/filter-radio-group/index.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const sortOptions = [
    {
        value: "best_selling",
        label: "Best selling"
    },
    {
        value: "created_at",
        label: "Latest Arrivals"
    },
    {
        value: "price_asc",
        label: "Price: Low -> High"
    },
    {
        value: "price_desc",
        label: "Price: High -> Low"
    }
];
const SortProducts = ({ "data-testid": dataTestId, sortBy, setQueryParams })=>{
    const handleChange = (value)=>{
        setQueryParams("sortBy", value);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$modules$2f$common$2f$components$2f$filter$2d$radio$2d$group$2f$index$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
        title: "Sort by",
        items: sortOptions,
        value: sortBy,
        handleChange: handleChange,
        "data-testid": dataTestId
    }, void 0, false, {
        fileName: "[project]/src/modules/store/components/refinement-list/sort-products/index.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = SortProducts;
}}),
"[project]/src/modules/store/components/refinement-list/index.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$modules$2f$store$2f$components$2f$refinement$2d$list$2f$sort$2d$products$2f$index$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/modules/store/components/refinement-list/sort-products/index.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const toolbarOptions = [
    {
        value: "best_selling",
        labelAr: "الأكثر مبيعًا",
        labelEn: "Best selling"
    },
    {
        value: "created_at",
        labelAr: "الأحدث",
        labelEn: "Newest"
    },
    {
        value: "price_asc",
        labelAr: "السعر: الأقل أولًا",
        labelEn: "Price low to high"
    },
    {
        value: "price_desc",
        labelAr: "السعر: الأعلى أولًا",
        labelEn: "Price high to low"
    }
];
const splitCsv = (value)=>(value || "").split(",").map((part)=>part.trim()).filter(Boolean);
const unique = (values)=>Array.from(new Set(values));
const toggleFromCsv = (current, value)=>{
    const set = new Set(current);
    if (set.has(value)) {
        set.delete(value);
    } else {
        set.add(value);
    }
    return Array.from(set);
};
const priceLabel = (value, isArabic)=>{
    if (!isArabic) {
        if (value === "lt50") return "Under 50";
        if (value === "50_100") return "50 - 100";
        if (value === "100_200") return "100 - 200";
        if (value === "200_plus") return "200+";
        return value;
    }
    if (value === "lt50") return "أقل من 50";
    if (value === "50_100") return "50 - 100";
    if (value === "100_200") return "100 - 200";
    if (value === "200_plus") return "200+";
    return value;
};
const stockLabel = (value, isArabic)=>{
    if (value === "in") return isArabic ? "متوفر بالمخزون" : "In stock";
    if (value === "out") return isArabic ? "غير متوفر بالمخزون" : "Out of stock";
    return value;
};
const RefinementList = ({ sortBy, variant = "default", facets, selected, "data-testid": dataTestId })=>{
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const isArabic = pathname?.startsWith("/ar");
    const createQueryString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((name, value)=>{
        const params = new URLSearchParams(searchParams);
        params.set(name, value);
        return params.toString();
    }, [
        searchParams
    ]);
    const setQueryParams = (name, value)=>{
        const query = createQueryString(name, value);
        router.push(`${pathname}?${query}`);
    };
    const updateMultiFilter = (key, value)=>{
        const params = new URLSearchParams(searchParams);
        const current = splitCsv(params.get(key));
        const nextValues = toggleFromCsv(current, value);
        if (nextValues.length) {
            params.set(key, unique(nextValues).join(","));
        } else {
            params.delete(key);
        }
        // Reset pagination after changing filters
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };
    const selectedValues = {
        brand: selected?.brand || splitCsv(searchParams.get("brand")),
        nicotine: selected?.nicotine || splitCsv(searchParams.get("nicotine")),
        resistance: selected?.resistance || splitCsv(searchParams.get("resistance")),
        flavor: selected?.flavor || splitCsv(searchParams.get("flavor")),
        stock: selected?.stock || splitCsv(searchParams.get("stock")),
        price: selected?.price || splitCsv(searchParams.get("price"))
    };
    if (variant === "toolbar") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-5 flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white p-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs font-bold uppercase tracking-[0.14em] text-slate-600",
                    children: isArabic ? "ترتيب حسب" : "Sort by"
                }, void 0, false, {
                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                    lineNumber: 119,
                    columnNumber: 9
                }, this),
                toolbarOptions.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setQueryParams("sortBy", item.value),
                        className: `rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors ${sortBy === item.value ? "border-[#1f2b44] bg-[#1f2b44] text-white" : "border-slate-300 bg-white text-slate-700 hover:border-[#1f2b44] hover:text-[#1f2b44]"}`,
                        children: isArabic ? item.labelAr : item.labelEn
                    }, item.value, false, {
                        fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this))
            ]
        }, void 0, true, {
            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
            lineNumber: 118,
            columnNumber: 7
        }, this);
    }
    if (variant === "sidebar") {
        const groups = [
            {
                key: "brand",
                title: isArabic ? "الماركة" : "Brand",
                options: facets?.brands || [],
                format: (value)=>value
            },
            {
                key: "nicotine",
                title: isArabic ? "قوة النيكوتين" : "Nicotine Strength",
                options: facets?.nicotine || [],
                format: (value)=>value
            },
            {
                key: "resistance",
                title: isArabic ? "المقاومة" : "Resistance",
                options: facets?.resistance || [],
                format: (value)=>value
            },
            {
                key: "flavor",
                title: isArabic ? "النكهة" : "Flavor",
                options: facets?.flavor || [],
                format: (value)=>value
            },
            {
                key: "price",
                title: isArabic ? "السعر" : "Price",
                options: facets?.price || [],
                format: (value)=>priceLabel(value, !!isArabic)
            },
            {
                key: "stock",
                title: isArabic ? "التوفر" : "Availability",
                options: facets?.stock || [],
                format: (value)=>stockLabel(value, !!isArabic)
            }
        ];
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: "w-full rounded-md border border-slate-300 bg-white p-4 lg:sticky lg:top-24",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-700",
                    children: isArabic ? "تصفية المنتجات" : "Filter Products"
                }, void 0, false, {
                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                    lineNumber: 181,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-5",
                    children: groups.filter((group)=>group.options.length > 0).map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border-t border-slate-200 pt-4 first:border-t-0 first:pt-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    className: "mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500",
                                    children: group.title
                                }, void 0, false, {
                                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                    lineNumber: 189,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "space-y-2",
                                    children: group.options.map((option)=>{
                                        const checked = selectedValues[group.key].includes(option.value);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex cursor-pointer items-center justify-between gap-2 text-sm text-slate-700",
                                            onClick: ()=>updateMultiFilter(group.key, option.value),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            readOnly: true,
                                                            checked: checked,
                                                            className: "h-3.5 w-3.5 rounded border-slate-300"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                                            lineNumber: 202,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: group.format(option.value)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                                            lineNumber: 208,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                                    lineNumber: 201,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-slate-400",
                                                    children: [
                                                        "(",
                                                        option.count,
                                                        ")"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                                    lineNumber: 210,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, `${group.key}-${option.value}`, true, {
                                            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                            lineNumber: 196,
                                            columnNumber: 23
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                                    lineNumber: 192,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, group.key, true, {
                            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                            lineNumber: 188,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
                    lineNumber: 184,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
            lineNumber: 180,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-8 flex gap-12 py-4 pl-6 small:ml-[1.675rem] small:min-w-[250px] small:flex-col small:px-0",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$modules$2f$store$2f$components$2f$refinement$2d$list$2f$sort$2d$products$2f$index$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
            sortBy: sortBy,
            setQueryParams: setQueryParams,
            "data-testid": dataTestId
        }, void 0, false, {
            fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
            lineNumber: 224,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/modules/store/components/refinement-list/index.tsx",
        lineNumber: 223,
        columnNumber: 5
    }, this);
};
const __TURBOPACK__default__export__ = RefinementList;
}}),
"[project]/src/modules/store/components/pagination/index.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Pagination": (()=>Pagination)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$utils$2f$clx$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@medusajs/ui/dist/esm/utils/clx.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function Pagination({ page, totalPages, 'data-testid': dataTestid }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    // Helper function to generate an array of numbers within a range
    const arrayRange = (start, stop)=>Array.from({
            length: stop - start + 1
        }, (_, index)=>start + index);
    // Function to handle page changes
    const handlePageChange = (newPage)=>{
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };
    // Function to render a page button
    const renderPageButton = (p, label, isCurrent)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$medusajs$2f$ui$2f$dist$2f$esm$2f$utils$2f$clx$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clx"])("txt-xlarge-plus text-ui-fg-muted", {
                "text-ui-fg-base hover:text-ui-fg-subtle": isCurrent
            }),
            disabled: isCurrent,
            onClick: ()=>handlePageChange(p),
            children: label
        }, p, false, {
            fileName: "[project]/src/modules/store/components/pagination/index.tsx",
            lineNumber: 36,
            columnNumber: 5
        }, this);
    // Function to render ellipsis
    const renderEllipsis = (key)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "txt-xlarge-plus text-ui-fg-muted items-center cursor-default",
            children: "..."
        }, key, false, {
            fileName: "[project]/src/modules/store/components/pagination/index.tsx",
            lineNumber: 50,
            columnNumber: 5
        }, this);
    // Function to render page buttons based on the current page and total pages
    const renderPageButtons = ()=>{
        const buttons = [];
        if (totalPages <= 7) {
            // Show all pages
            buttons.push(...arrayRange(1, totalPages).map((p)=>renderPageButton(p, p, p === page)));
        } else {
            // Handle different cases for displaying pages and ellipses
            if (page <= 4) {
                // Show 1, 2, 3, 4, 5, ..., lastpage
                buttons.push(...arrayRange(1, 5).map((p)=>renderPageButton(p, p, p === page)));
                buttons.push(renderEllipsis("ellipsis1"));
                buttons.push(renderPageButton(totalPages, totalPages, totalPages === page));
            } else if (page >= totalPages - 3) {
                // Show 1, ..., lastpage - 4, lastpage - 3, lastpage - 2, lastpage - 1, lastpage
                buttons.push(renderPageButton(1, 1, 1 === page));
                buttons.push(renderEllipsis("ellipsis2"));
                buttons.push(...arrayRange(totalPages - 4, totalPages).map((p)=>renderPageButton(p, p, p === page)));
            } else {
                // Show 1, ..., page - 1, page, page + 1, ..., lastpage
                buttons.push(renderPageButton(1, 1, 1 === page));
                buttons.push(renderEllipsis("ellipsis3"));
                buttons.push(...arrayRange(page - 1, page + 1).map((p)=>renderPageButton(p, p, p === page)));
                buttons.push(renderEllipsis("ellipsis4"));
                buttons.push(renderPageButton(totalPages, totalPages, totalPages === page));
            }
        }
        return buttons;
    };
    // Render the component
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex justify-center w-full mt-12",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-3 items-end",
            "data-testid": dataTestid,
            children: renderPageButtons()
        }, void 0, false, {
            fileName: "[project]/src/modules/store/components/pagination/index.tsx",
            lineNumber: 111,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/modules/store/components/pagination/index.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=src_modules_3b2572d7._.js.map