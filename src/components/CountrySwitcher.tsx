import { useCountry } from "@/hooks/use-country";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const CountrySwitcher = () => {
  const { selectedCountry, setShowCountryPicker } = useCountry();

  if (!selectedCountry) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowCountryPicker(true)}
      className="text-primary-foreground hover:text-gold hover:bg-purple-rich gap-1.5"
    >
      <span className="text-base">{selectedCountry.flag_emoji}</span>
      <span className="hidden sm:inline text-xs">{selectedCountry.name}</span>
      <Globe className="w-3.5 h-3.5" />
    </Button>
  );
};

export default CountrySwitcher;
