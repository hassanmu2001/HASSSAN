import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/hooks/use-country";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const COUNTRIES_PER_PAGE = 8;

const CountryPickerOverlay = () => {
  const { countries, showCountryPicker, setSelectedCountry, selectedCountry } = useCountry();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.trim().toLowerCase();
    return countries.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [countries, search]);

  const totalPages = Math.ceil(filtered.length / COUNTRIES_PER_PAGE);
  const pageCountries = filtered.slice(
    currentPage * COUNTRIES_PER_PAGE,
    (currentPage + 1) * COUNTRIES_PER_PAGE
  );

  if (!showCountryPicker) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-purple-deep flex flex-col">
      {/* Header */}
      <div className="text-center pt-12 pb-6 shrink-0">
        <h1 className="font-amiri text-5xl font-bold text-gold mb-3">أفراحي</h1>
        <div className="w-20 h-1 bg-gold mx-auto mb-4 rounded-full" />
        <p className="text-gold-light text-lg mb-4">{t("country.select_subtitle")}</p>
        <div className="relative max-w-xs mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-light/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
            placeholder="ابحث عن دولة..."
            className="w-full bg-card/10 border border-gold/20 rounded-lg py-2 pr-9 pl-3 text-primary-foreground text-sm placeholder:text-gold-light/40 focus:outline-none focus:border-gold/50"
          />
        </div>
      </div>

      {/* Countries grid */}
      <div className="flex-1 flex flex-col justify-center px-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-3"
          >
            {pageCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-right
                  ${selectedCountry?.code === country.code
                    ? "border-gold bg-gold/10 shadow-lg shadow-gold/20"
                    : "border-gold/20 bg-card/10 hover:border-gold/50 hover:bg-card/20"
                  }`}
              >
                <span className="text-3xl leading-none">{country.flag_emoji}</span>
                <div className="min-w-0">
                  <p className="font-bold text-primary-foreground text-sm truncate">{country.name}</p>
                  <p className="text-[11px] text-gold-light">{country.dial_code}</p>
                </div>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <div className="pb-10 pt-4 flex items-center justify-center gap-3 shrink-0">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="p-2 rounded-full text-gold disabled:opacity-30 hover:bg-gold/10 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-8 h-8 rounded-full text-sm font-bold transition-all
                ${i === currentPage
                  ? "bg-gold text-purple-deep"
                  : "text-gold-light hover:bg-gold/10"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage === totalPages - 1}
          className="p-2 rounded-full text-gold disabled:opacity-30 hover:bg-gold/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CountryPickerOverlay;
