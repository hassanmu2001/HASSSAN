import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CityPickerGridProps {
  cities: string[];
  selected: string;
  onSelect: (city: string) => void;
}

const CITIES_PER_PAGE = 12;

const CityPickerGrid = ({ cities, selected, onSelect }: CityPickerGridProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);

  const allOptions = useMemo(() => ["all", ...cities], [cities]);
  const totalPages = Math.ceil(allOptions.length / CITIES_PER_PAGE);
  const pageItems = allOptions.slice(
    currentPage * CITIES_PER_PAGE,
    (currentPage + 1) * CITIES_PER_PAGE
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="w-4 h-4 text-gold" />
        <span>{t("category_page.city_filter_title", "المحافظة")}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"
        >
          {pageItems.map((city) => (
            <button
              key={city}
              onClick={() => onSelect(city)}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 text-center truncate
                ${selected === city
                  ? "border-gold bg-gold/15 text-gold shadow-sm shadow-gold/10"
                  : "border-border bg-card hover:border-gold/40 hover:bg-gold/5 text-foreground"
                }`}
            >
              {city === "all" ? t("category_page.city_all") : city}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-full text-gold disabled:opacity-30 hover:bg-gold/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-6 h-6 rounded-full text-xs font-bold transition-all
                ${i === currentPage
                  ? "bg-gold text-primary-foreground"
                  : "text-muted-foreground hover:bg-gold/10"
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1.5 rounded-full text-gold disabled:opacity-30 hover:bg-gold/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CityPickerGrid;
