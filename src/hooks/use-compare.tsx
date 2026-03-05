import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

interface CompareContextType {
  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const addToCompare = (id: string) => {
    if (compareIds.includes(id)) return;
    if (compareIds.length >= 3) {
      toast.warning("يمكنك مقارنة 3 خدمات كحد أقصى");
      return;
    }
    setCompareIds((prev) => [...prev, id]);
    toast.success("تمت الإضافة للمقارنة");
  };

  const removeFromCompare = (id: string) => {
    setCompareIds((prev) => prev.filter((x) => x !== id));
  };

  const clearCompare = () => setCompareIds([]);
  const isInCompare = (id: string) => compareIds.includes(id);

  return (
    <CompareContext.Provider value={{ compareIds, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within CompareProvider");
  return context;
}
