import { useCompare } from "@/hooks/use-compare";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CompareBar = () => {
  const { compareIds, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-purple-deep border-t border-gold/20 py-3 px-4 shadow-lg"
      >
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Scale className="w-5 h-5 text-gold" />
            <span className="text-sm font-medium">
              {compareIds.length} خدمة للمقارنة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={clearCompare}
              className="text-primary-foreground hover:text-gold"
            >
              <X className="w-4 h-4 ml-1" /> مسح
            </Button>
            <Button
              size="sm"
              disabled={compareIds.length < 2}
              onClick={() => navigate(`/compare?ids=${compareIds.join(",")}`)}
              className="bg-gold hover:bg-gold-dark text-primary-foreground font-bold"
            >
              مقارنة الآن
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareBar;
