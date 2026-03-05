import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/hooks/use-country";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Props {
  serviceId: string;
}

interface PriceTierForm {
  id?: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
}

interface PriceTier {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
}

interface ServiceOption {
  id: string;
  name: string;
  description?: string | null;
  service_price_tiers?: PriceTier[];
}

const OptionsTab = ({ serviceId }: Props) => {
  const queryClient = useQueryClient();
  const { selectedCountry } = useCountry();
  const curr = selectedCountry?.currency_symbol ?? "ر.س";
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionDesc, setNewOptionDesc] = useState("");
  const [openOptionId, setOpenOptionId] = useState<string | null>(null);

  const { data: options = [] } = useQuery({
    queryKey: ["service-options-manage", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_options")
        .select("*, service_price_tiers(*)")
        .eq("service_id", serviceId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addOptionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_options").insert({
        service_id: serviceId,
        name: newOptionName,
        description: newOptionDesc || null,
        sort_order: options.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-options-manage", serviceId] });
      setNewOptionName("");
      setNewOptionDesc("");
      toast.success("تم إضافة الصنف");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (optionId: string) => {
      // Delete tiers first then option
      await supabase.from("service_price_tiers").delete().eq("option_id", optionId);
      const { error } = await supabase.from("service_options").delete().eq("id", optionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-options-manage", serviceId] });
      toast.success("تم حذف الصنف");
    },
  });

  const addTierMutation = useMutation({
    mutationFn: async ({ optionId, tier }: { optionId: string; tier: PriceTierForm }) => {
      const { error } = await supabase.from("service_price_tiers").insert({
        option_id: optionId,
        min_quantity: tier.min_quantity,
        max_quantity: tier.max_quantity,
        price_per_unit: tier.price_per_unit,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-options-manage", serviceId] });
      toast.success("تم إضافة شريحة السعر");
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase.from("service_price_tiers").delete().eq("id", tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-options-manage", serviceId] });
      toast.success("تم حذف الشريحة");
    },
  });

  return (
    <div className="space-y-6">
      {/* Add new option */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">إضافة صنف جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label>اسم الصنف *</Label>
              <Input
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="مثال: بوفيه مفتوح، باقة تصوير فيديو..."
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>وصف (اختياري)</Label>
              <Input
                value={newOptionDesc}
                onChange={(e) => setNewOptionDesc(e.target.value)}
                placeholder="وصف مختصر للصنف"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => addOptionMutation.mutate()}
                disabled={!newOptionName.trim() || addOptionMutation.isPending}
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options list */}
      {options.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          لا توجد أصناف بعد. أضف أصنافاً لتحديد شرائح الأسعار.
        </p>
      ) : (
        options.map((option: ServiceOption) => (
          <OptionCard
            key={option.id}
            option={option}
            isOpen={openOptionId === option.id}
            onToggle={() => setOpenOptionId(openOptionId === option.id ? null : option.id)}
            onDelete={() => deleteOptionMutation.mutate(option.id)}
            onAddTier={(tier) => addTierMutation.mutate({ optionId: option.id, tier })}
            onDeleteTier={(tierId) => deleteTierMutation.mutate(tierId)}
          />
        ))
      )}
    </div>
  );
};

interface OptionCardProps {
  option: ServiceOption;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAddTier: (tier: PriceTierForm) => void;
  onDeleteTier: (tierId: string) => void;
}

const OptionCard = ({ option, isOpen, onToggle, onDelete, onAddTier, onDeleteTier }: OptionCardProps) => {
  const { selectedCountry } = useCountry();
  const curr = selectedCountry?.currency_symbol ?? "ر.س";
  const [minQty, setMinQty] = useState("1");
  const [maxQty, setMaxQty] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");

  const tiers = option.service_price_tiers ?? [];

  const handleAddTier = () => {
    if (!pricePerUnit) {
      toast.error("أدخل السعر لكل وحدة");
      return;
    }
    onAddTier({
      min_quantity: Number(minQty) || 1,
      max_quantity: maxQty ? Number(maxQty) : null,
      price_per_unit: Number(pricePerUnit),
    });
    setMinQty("1");
    setMaxQty("");
    setPricePerUnit("");
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary transition-colors">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <CardTitle className="text-base">{option.name}</CardTitle>
              {option.description && (
                <span className="text-sm text-muted-foreground font-normal">
                  — {option.description}
                </span>
              )}
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {tiers.length} شرائح
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Existing tiers */}
            {tiers.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right p-2.5 font-medium">من</th>
                      <th className="text-right p-2.5 font-medium">إلى</th>
                      <th className="text-right p-2.5 font-medium">السعر/وحدة</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers
                      .sort((a: PriceTier, b: PriceTier) => a.min_quantity - b.min_quantity)
                      .map((tier: PriceTier) => (
                        <tr key={tier.id} className="border-t border-border">
                          <td className="p-2.5">{tier.min_quantity}</td>
                          <td className="p-2.5">{tier.max_quantity ?? "∞"}</td>
                          <td className="p-2.5 font-medium">{tier.price_per_unit} {curr}</td>
                          <td className="p-2.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive"
                              onClick={() => onDeleteTier(tier.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add tier */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">الحد الأدنى</Label>
                <Input
                  type="number"
                  value={minQty}
                  onChange={(e) => setMinQty(e.target.value)}
                  placeholder="1"
                  dir="ltr"
                  className="h-9"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">الحد الأقصى (فارغ = لا حد)</Label>
                <Input
                  type="number"
                  value={maxQty}
                  onChange={(e) => setMaxQty(e.target.value)}
                  placeholder="∞"
                  dir="ltr"
                  className="h-9"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">السعر/وحدة ({curr}) *</Label>
                <Input
                  type="number"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  placeholder="0"
                  dir="ltr"
                  className="h-9"
                />
              </div>
              <Button onClick={handleAddTier} size="sm" className="bg-primary text-primary-foreground h-9">
                <Plus className="w-3.5 h-3.5 ml-1" />
                إضافة شريحة
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default OptionsTab;
