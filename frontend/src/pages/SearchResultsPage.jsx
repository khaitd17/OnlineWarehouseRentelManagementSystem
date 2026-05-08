import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { searchWarehouses } from "../services/warehouseService";
import WarehouseCard from "../components/WarehouseCard";
import PrimaryFilterBar from "../components/search/PrimaryFilterBar";
import SelectedFilters from "../components/search/SelectedFilters";
import AdvancedFilterDrawer from "../components/search/AdvancedFilterDrawer";
import SearchMapPanel from "../components/search/SearchMapPanel";
import { readSearchDraft, writeSearchDraft } from "../utils/searchDraft";

const PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận",
  "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam",
  "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình",
  "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi",
  "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình",
  "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh",
  "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

const WAREHOUSE_TYPES = [
  { value: "", label: "Tất cả loại kho" },
  { value: "lạnh", label: "Kho lạnh / mát" },
  { value: "chung", label: "Kho chung" },
  { value: "tự quản", label: "Kho tự quản" },
  { value: "xưởng", label: "Kho xưởng" },
  { value: "ngoại quan", label: "Kho ngoại quan" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "available", label: "Còn trống" },
  { value: "full", label: "Đã thuê kín" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Phù hợp nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "area_asc", label: "Diện tích nhỏ → lớn" },
  { value: "area_desc", label: "Diện tích lớn → nhỏ" },
  { value: "newest", label: "Mới đăng gần đây" },
  { value: "distance", label: "Gần vị trí của tôi nhất" },
];

const AREA_MIN = 0;
const AREA_MAX = 100000;
const PRICE_MIN = 0;
const PRICE_MAX = 30000000;
const PAGE_SIZE = 12;

const normalizeText = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const includesAny = (text, keywords) => keywords.some((k) => text.includes(k));

const FACILITY_KEYWORDS = {
  container: ["container", "xe cont", "xe container"],
  camera: ["camera", "cctv"],
  fire: ["pccc", "phong chay", "fire"],
  dock: ["loading dock", "boc do", "boc xep"],
  forklift: ["xe nang", "forklift"],
  power: ["dien 3 pha", "3 pha"],
  security: ["bao ve", "an ninh", "security"],
  office: ["van phong", "office"],
};

const LOCATION_KEYWORDS = {
  port: ["cang", "port"],
  airport: ["san bay", "airport"],
  highway: ["cao toc", "highway"],
  industrial: ["kcn", "khu cong nghiep", "industrial"],
};

const RENTAL_KEYWORDS = {
  short: ["ngan han"],
  long: ["dai han"],
  monthly: ["theo thang", "hang thang"],
  yearly: ["theo nam", "hang nam"],
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatPrice = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}tr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
};

const haversine = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export default function SearchResultsPage() {
  const location = useLocation();
  const draft = readSearchDraft();

  const [heroQuery, setHeroQuery] = useState(draft.heroQuery || "");
  const [provinceInput, setProvinceInput] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("province") || draft.province || "";
  });
  const [districtInput, setDistrictInput] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("district") || draft.district || "";
  });
  const [warehouseType, setWarehouseType] = useState(() => {
    const p = new URLSearchParams(location.search);
    const cat = p.get("warehouseType") || draft.warehouseType;
    if (!cat) return "";
    const normText = cat.toLowerCase();
    if (normText.includes("mát") || normText.includes("lạnh")) return "lạnh";
    if (normText.includes("chung")) return "chung";
    if (normText.includes("tự quản")) return "tự quản";
    if (normText.includes("xưởng")) return "xưởng";
    if (normText.includes("ngoại quan")) return "ngoại quan";
    return "";
  });

  const [areaRange, setAreaRange] = useState(() => {
    const p = new URLSearchParams(location.search);
    const maxA = p.get("maxArea");
    const minA = p.get("minArea");
    const parsedMax = parseNumber(maxA) ?? parseNumber(draft.maxArea);
    const parsedMin = parseNumber(minA) ?? parseNumber(draft.minArea);
    return [
      parsedMin ?? AREA_MIN,
      parsedMax ?? AREA_MAX,
    ];
  });

  const [priceRange, setPriceRange] = useState(() => {
    const p = new URLSearchParams(location.search);
    const minP = p.get("minPrice");
    const maxP = p.get("maxPrice");
    const parsedMin = parseNumber(minP) ?? parseNumber(draft.minPrice);
    const parsedMax = parseNumber(maxP) ?? parseNumber(draft.maxPrice);
    return [
      parsedMin ?? PRICE_MIN,
      parsedMax ?? PRICE_MAX,
    ];
  });

  const [statusFilter, setStatusFilter] = useState(draft.statusFilter || "all");
  const [sortBy, setSortBy] = useState(() => {
    const p = new URLSearchParams(location.search);
    return p.get("sortBy") || draft.sortBy || "relevance";
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const [showDrawer, setShowDrawer] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState(() => ({
    operatingHours: draft.operatingHours || "all",
    facilities: draft.facilities || [],
    locationTags: draft.locationTags || [],
    rentalTerms: draft.rentalTerms || [],
    availableFrom: draft.availableFrom || "",
    minRating: draft.minRating ?? null,
  }));

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [geoError, setGeoError] = useState("");

  const apiSortBy = sortBy === "relevance" || sortBy === "distance" ? "newest" : sortBy;
  const is24Hours = advancedFilters.operatingHours === "24_7" ? true : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchWarehouses({
        province: provinceInput,
        district: districtInput,
        warehouseType,
        minArea: areaRange[0] > AREA_MIN ? areaRange[0] : undefined,
        maxArea: undefined,
        minPrice: priceRange[0] > PRICE_MIN ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
        is24Hours,
        minRating: advancedFilters.minRating ?? undefined,
        sortBy: apiSortBy,
        page,
        pageSize: PAGE_SIZE,
      });
      setResults(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    provinceInput,
    districtInput,
    warehouseType,
    areaRange,
    priceRange,
    is24Hours,
    advancedFilters.minRating,
    apiSortBy,
    page,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (sortBy !== "distance") return;
    if (userLocation || geoError) return;
    if (!navigator.geolocation) {
      setGeoError("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setGeoError("denied"),
      { timeout: 8000 }
    );
  }, [sortBy, userLocation, geoError]);

  useEffect(() => {
    writeSearchDraft({
      heroQuery: heroQuery || undefined,
      province: provinceInput || undefined,
      district: districtInput || undefined,
      warehouseType: warehouseType || undefined,
      minArea: areaRange[0] !== AREA_MIN ? areaRange[0] : undefined,
      maxArea: areaRange[1] !== AREA_MAX ? areaRange[1] : undefined,
      minPrice: priceRange[0] !== PRICE_MIN ? priceRange[0] : undefined,
      maxPrice: priceRange[1] !== PRICE_MAX ? priceRange[1] : undefined,
      statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      operatingHours: advancedFilters.operatingHours !== "all" ? advancedFilters.operatingHours : undefined,
      facilities: advancedFilters.facilities.length ? advancedFilters.facilities : undefined,
      locationTags: advancedFilters.locationTags.length ? advancedFilters.locationTags : undefined,
      rentalTerms: advancedFilters.rentalTerms.length ? advancedFilters.rentalTerms : undefined,
      availableFrom: advancedFilters.availableFrom || undefined,
      minRating: advancedFilters.minRating ?? undefined,
      sortBy: sortBy || undefined,
    });
  }, [
    heroQuery,
    provinceInput,
    districtInput,
    warehouseType,
    areaRange,
    priceRange,
    statusFilter,
    advancedFilters,
    sortBy,
  ]);

  const applyHeroSearch = () => {
    const query = heroQuery.trim();
    if (!query) return;
    const parts = query.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      setDistrictInput(parts[0]);
      setProvinceInput(parts.slice(1).join(", "));
    } else {
      setProvinceInput(query);
      setDistrictInput("");
    }
    setPage(1);
  };

  const quickChips = [
    {
      label: "TP.HCM",
      onClick: () => {
        setHeroQuery("TP. Hồ Chí Minh");
        setProvinceInput("TP. Hồ Chí Minh");
        setDistrictInput("");
        setPage(1);
      },
    },
    {
      label: "Bình Dương",
      onClick: () => {
        setHeroQuery("Bình Dương");
        setProvinceInput("Bình Dương");
        setDistrictInput("");
        setPage(1);
      },
    },
    {
      label: "Kho lạnh",
      onClick: () => {
        setWarehouseType("lạnh");
        setPage(1);
      },
    },
    {
      label: "Gần cảng",
      onClick: () => {
        setAdvancedFilters((prev) => ({
          ...prev,
          locationTags: prev.locationTags.includes("port")
            ? prev.locationTags
            : [...prev.locationTags, "port"],
        }));
        setPage(1);
      },
    },
    {
      label: "Dưới 30 triệu",
      onClick: () => {
        setPriceRange([PRICE_MIN, PRICE_MAX]);
        setPage(1);
      },
    },
  ];

  const handleReset = () => {
    setHeroQuery("");
    setProvinceInput("");
    setDistrictInput("");
    setWarehouseType("");
    setAreaRange([AREA_MIN, AREA_MAX]);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setStatusFilter("all");
    setSortBy("relevance");
    setAdvancedFilters({
      operatingHours: "all",
      facilities: [],
      locationTags: [],
      rentalTerms: [],
      availableFrom: "",
      minRating: null,
    });
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    const areaActive = areaRange[0] !== AREA_MIN || areaRange[1] !== AREA_MAX;
    const priceActive = priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX;
    return (
      (provinceInput ? 1 : 0) +
      (districtInput ? 1 : 0) +
      (warehouseType ? 1 : 0) +
      (statusFilter !== "all" ? 1 : 0) +
      (areaActive ? 1 : 0) +
      (priceActive ? 1 : 0) +
      (advancedFilters.operatingHours !== "all" ? 1 : 0) +
      (advancedFilters.minRating != null ? 1 : 0) +
      advancedFilters.facilities.length +
      advancedFilters.locationTags.length +
      advancedFilters.rentalTerms.length +
      (advancedFilters.availableFrom ? 1 : 0)
    );
  }, [provinceInput, districtInput, warehouseType, statusFilter, areaRange, priceRange, advancedFilters]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (provinceInput) chips.push({ id: "province", label: provinceInput, onRemove: () => setProvinceInput("") });
    if (districtInput) chips.push({ id: "district", label: districtInput, onRemove: () => setDistrictInput("") });
    if (warehouseType) {
      const label = WAREHOUSE_TYPES.find((t) => t.value === warehouseType)?.label || warehouseType;
      chips.push({ id: "type", label, onRemove: () => setWarehouseType("") });
    }
    if (statusFilter !== "all") {
      const label = STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || statusFilter;
      chips.push({ id: "status", label, onRemove: () => setStatusFilter("all") });
    }
    if (areaRange[0] !== AREA_MIN || areaRange[1] !== AREA_MAX) {
      chips.push({
        id: "area",
        label: `${areaRange[0].toLocaleString("vi-VN")}–${areaRange[1] >= AREA_MAX ? `${AREA_MAX.toLocaleString("vi-VN")}+` : areaRange[1].toLocaleString("vi-VN")} m²`,
        onRemove: () => setAreaRange([AREA_MIN, AREA_MAX]),
      });
    }
    if (priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX) {
      chips.push({
        id: "price",
        label: `${formatPrice(priceRange[0])}–${priceRange[1] >= PRICE_MAX ? `${formatPrice(PRICE_MAX)}+` : formatPrice(priceRange[1])} đ/m²`,
        onRemove: () => setPriceRange([PRICE_MIN, PRICE_MAX]),
      });
    }
    if (advancedFilters.operatingHours !== "all") {
      const labelMap = {
        "24_7": "24/7",
        business: "Giờ hành chính",
        shift: "Theo ca",
      };
      chips.push({
        id: "hours",
        label: labelMap[advancedFilters.operatingHours] || "Giờ hoạt động",
        onRemove: () => setAdvancedFilters((prev) => ({ ...prev, operatingHours: "all" })),
      });
    }
    if (advancedFilters.minRating != null) {
      chips.push({
        id: "rating",
        label: `≥ ${advancedFilters.minRating} sao`,
        onRemove: () => setAdvancedFilters((prev) => ({ ...prev, minRating: null })),
      });
    }
    advancedFilters.facilities.forEach((f) => {
      const labelMap = {
        container: "Xe container",
        camera: "Camera",
        fire: "PCCC",
        dock: "Loading dock",
        forklift: "Xe nâng",
        power: "Điện 3 pha",
        security: "Bảo vệ",
        office: "Văn phòng",
      };
      chips.push({
        id: `facility-${f}`,
        label: labelMap[f] || f,
        onRemove: () =>
          setAdvancedFilters((prev) => ({
            ...prev,
            facilities: prev.facilities.filter((item) => item !== f),
          })),
      });
    });
    advancedFilters.locationTags.forEach((t) => {
      const labelMap = {
        port: "Gần cảng",
        airport: "Gần sân bay",
        highway: "Gần cao tốc",
        industrial: "Gần KCN",
      };
      chips.push({
        id: `location-${t}`,
        label: labelMap[t] || t,
        onRemove: () =>
          setAdvancedFilters((prev) => ({
            ...prev,
            locationTags: prev.locationTags.filter((item) => item !== t),
          })),
      });
    });
    advancedFilters.rentalTerms.forEach((t) => {
      const labelMap = {
        short: "Ngắn hạn",
        long: "Dài hạn",
        monthly: "Theo tháng",
        yearly: "Theo năm",
      };
      chips.push({
        id: `term-${t}`,
        label: labelMap[t] || t,
        onRemove: () =>
          setAdvancedFilters((prev) => ({
            ...prev,
            rentalTerms: prev.rentalTerms.filter((item) => item !== t),
          })),
      });
    });
    if (advancedFilters.availableFrom) {
      chips.push({
        id: "available-from",
        label: `Từ ${advancedFilters.availableFrom}`,
        onRemove: () => setAdvancedFilters((prev) => ({ ...prev, availableFrom: "" })),
      });
    }
    return chips;
  }, [provinceInput, districtInput, warehouseType, statusFilter, areaRange, priceRange, advancedFilters]);

  const clientFiltersActive = useMemo(() => {
    return (
      (advancedFilters.operatingHours === "business" || advancedFilters.operatingHours === "shift") ||
      advancedFilters.facilities.length > 0 ||
      advancedFilters.locationTags.length > 0 ||
      advancedFilters.rentalTerms.length > 0 ||
      !!advancedFilters.availableFrom
    );
  }, [advancedFilters]);

  const matchesAdvancedFilters = useCallback(
    (warehouse) => {
      const haystack = normalizeText(
        `${warehouse.name || ""} ${warehouse.address || ""} ${warehouse.description || ""} ${warehouse.warehouseType || ""} ${warehouse.operatingHours || ""}`
      );

      if (advancedFilters.operatingHours === "business") {
        const businessKeywords = ["hanh chinh", "gio hanh chinh", "8h", "17h", "8:00", "17:00"];
        if (warehouse.is24HoursAccess) return false;
        if (!includesAny(haystack, businessKeywords)) return false;
      }
      if (advancedFilters.operatingHours === "shift") {
        const shiftKeywords = ["theo ca", "ca sang", "ca dem", "shift"];
        if (!includesAny(haystack, shiftKeywords)) return false;
      }

      if (advancedFilters.facilities.length) {
        const allMatch = advancedFilters.facilities.every((f) => includesAny(haystack, FACILITY_KEYWORDS[f] || []));
        if (!allMatch) return false;
      }

      if (advancedFilters.locationTags.length) {
        const allMatch = advancedFilters.locationTags.every((t) => includesAny(haystack, LOCATION_KEYWORDS[t] || []));
        if (!allMatch) return false;
      }

      if (advancedFilters.rentalTerms.length) {
        const allMatch = advancedFilters.rentalTerms.every((t) => includesAny(haystack, RENTAL_KEYWORDS[t] || []));
        if (!allMatch) return false;
      }

      if (advancedFilters.availableFrom) {
        const since = new Date(advancedFilters.availableFrom);
        if (warehouse.createdAt) {
          const createdAt = new Date(warehouse.createdAt);
          if (createdAt < since) return false;
        }
      }

      return true;
    },
    [advancedFilters]
  );

  const statusMatches = useCallback(
    (warehouse) => {
      if (statusFilter === "available") return warehouse.availableArea > 0;
      if (statusFilter === "full") return warehouse.availableArea <= 0;
      return true;
    },
    [statusFilter]
  );

  const displayResults = useMemo(() => {
    let list = [...results];
    if (sortBy === "distance" && userLocation) {
      list = list
        .map((item) => ({
          item,
          distance: item.lat != null && item.lng != null
            ? haversine(userLocation, { lat: item.lat, lng: item.lng })
            : Number.POSITIVE_INFINITY,
        }))
        .sort((a, b) => a.distance - b.distance)
        .map((entry) => entry.item);
    }
    if (statusFilter !== "all") {
      list = list.filter(statusMatches);
    }
    if (clientFiltersActive) {
      list = list.filter(matchesAdvancedFilters);
    }
    return list;
  }, [results, sortBy, userLocation, statusFilter, statusMatches, clientFiltersActive, matchesAdvancedFilters]);

  const displayTotal = clientFiltersActive || statusFilter !== "all" ? displayResults.length : total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="sticky top-16 z-30">
        <PrimaryFilterBar
          provinces={PROVINCES}
          province={provinceInput}
          district={districtInput}
          onProvinceChange={(value) => {
            setProvinceInput(value);
            setPage(1);
          }}
          onDistrictChange={(value) => {
            setDistrictInput(value);
            setPage(1);
          }}
          areaRange={areaRange}
          areaMax={AREA_MAX}
          onAreaRangeChange={(value) => {
            setAreaRange(value);
            setPage(1);
          }}
          priceRange={priceRange}
          priceMax={PRICE_MAX}
          onPriceRangeChange={(value) => {
            setPriceRange(value);
            setPage(1);
          }}
          warehouseType={warehouseType}
          warehouseTypes={WAREHOUSE_TYPES}
          onWarehouseTypeChange={(value) => {
            setWarehouseType(value);
            setPage(1);
          }}
          status={statusFilter}
          statusOptions={STATUS_OPTIONS}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onOpenAdvanced={() => setShowDrawer(true)}
          onReset={handleReset}
          activeCount={activeFilterCount}
        />
        <div className="bg-white/95 px-4 pb-4">
          <div className="mx-auto max-w-7xl">
            <SelectedFilters filters={activeFilterChips} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">
              {loading ? "Đang tìm..." : `${displayTotal.toLocaleString("vi-VN")} kho phù hợp`}
            </div>
            {geoError && sortBy === "distance" && (
              <div className="text-xs text-rose-500">Không thể lấy vị trí để sắp xếp theo khoảng cách.</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-500">Sắp xếp</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="hidden items-center rounded-lg bg-slate-100 p-1 lg:flex">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === "list" ? "bg-white text-cyan-700 shadow" : "text-slate-500"
                }`}
              >
                Danh sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === "map" ? "bg-white text-cyan-700 shadow" : "text-slate-500"
                }`}
              >
                Bản đồ
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className={`${viewMode === "map" ? "hidden" : "block"} lg:block`}>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-sm text-rose-600">
                {error}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={fetchData}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : displayResults.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                <div className="text-3xl">🔎</div>
                <h3 className="mt-3 text-lg font-semibold text-slate-800">Không tìm thấy kho phù hợp</h3>
                <p className="mt-2 text-sm text-slate-500">Thử điều chỉnh bộ lọc để xem thêm kết quả.</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {displayResults.map((w) => (
                  <WarehouseCard key={w.warehouseId} w={w} />
                ))}
              </div>
            )}

            {!clientFiltersActive && statusFilter === "all" && !loading && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Trước
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                        page === p ? "bg-cyan-600 text-white" : "border border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            )}
          </div>

          <div className={`lg:block ${viewMode === "map" ? "block" : "hidden"}`}>
            <div className="sticky top-24">
              <SearchMapPanel warehouses={displayResults} />
            </div>
          </div>
        </div>
      </div>

      <AdvancedFilterDrawer
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        filters={advancedFilters}
        areaRange={areaRange}
        areaMax={AREA_MAX}
        onAreaRangeChange={(value) => {
          setAreaRange(value);
          setPage(1);
        }}
        priceRange={priceRange}
        priceMax={PRICE_MAX}
        onPriceRangeChange={(value) => {
          setPriceRange(value);
          setPage(1);
        }}
        onFiltersChange={(partial) => {
          setAdvancedFilters((prev) => ({ ...prev, ...partial }));
          setPage(1);
        }}
        onReset={handleReset}
        onApply={() => setShowDrawer(false)}
      />

      <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setShowDrawer(true)}
          className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          Bộ lọc
        </button>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
          className="flex-1 rounded-lg bg-cyan-600 py-2 text-sm font-semibold text-white shadow-soft"
        >
          {viewMode === "list" ? "Xem bản đồ" : "Xem danh sách"}
        </button>
      </div>
      <div className="h-16 lg:hidden" />
    </div>
  );
}
