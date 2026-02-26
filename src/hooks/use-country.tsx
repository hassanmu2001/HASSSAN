import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  flag_emoji: string;
  dial_code?: string;
  sort_order: number;
  is_active: boolean;
}

export interface City {
  id: string;
  name: string;
  country_id: string;
}

interface CountryContextType {
  selectedCountry: Country | null;
  setSelectedCountry: (country: Country) => void;
  countries: Country[];
  cities: City[];
  isLoading: boolean;
  formatPrice: (price: number) => string;
  showCountryPicker: boolean;
  setShowCountryPicker: (show: boolean) => void;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const COUNTRY_KEY = "afrahi_country_code";

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(() => {
    return localStorage.getItem(COUNTRY_KEY);
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Country[];
    },
  });

  const selectedCountry = countries.find((c) => c.code === selectedCode) ?? null;

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", selectedCountry?.id],
    queryFn: async () => {
      if (!selectedCountry) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("country_id", selectedCountry.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as City[];
    },
    enabled: !!selectedCountry,
  });

  // Show picker if no country selected and countries loaded
  useEffect(() => {
    if (!countriesLoading && countries.length > 0 && !selectedCode) {
      setShowCountryPicker(true);
    }
  }, [countriesLoading, countries, selectedCode]);

  const setSelectedCountry = (country: Country) => {
    setSelectedCode(country.code);
    localStorage.setItem(COUNTRY_KEY, country.code);
    setShowCountryPicker(false);
  };

  const formatPrice = (price: number) => {
    if (!selectedCountry) return `${price.toLocaleString("ar")}`;
    return `${price.toLocaleString("ar")} ${selectedCountry.currency_symbol}`;
  };

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        countries,
        cities,
        isLoading: countriesLoading || citiesLoading,
        formatPrice,
        showCountryPicker,
        setShowCountryPicker,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) throw new Error("useCountry must be used within CountryProvider");
  return context;
}
