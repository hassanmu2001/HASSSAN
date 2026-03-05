import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/hooks/use-country";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface ServiceData {
  id?: string;
  title?: string;
  description?: string;
  category_id?: string;
  city?: string;
  price_min?: number;
  price_max?: number;
  photos?: string[];
}

interface ServiceFormProps {
  service?: ServiceData;
  onClose: () => void;
  userId: string;
}

const ServiceForm = ({ service, onClose, userId }: ServiceFormProps) => {
  const queryClient = useQueryClient();
  const { selectedCountry, cities: countryCities } = useCountry();
  const curr = selectedCountry?.currency_symbol ?? "ر.س";
  const isEditing = !!service;

  const [title, setTitle] = useState(service?.title ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [categoryId, setCategoryId] = useState(service?.category_id ?? "");
  const [city, setCity] = useState(service?.city ?? "");
  const [priceMin, setPriceMin] = useState(service?.price_min?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(service?.price_max?.toString() ?? "");
  const [photos, setPhotos] = useState<string[]>(service?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const uploadPhoto = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("service-photos")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("service-photos").getPublicUrl(path);
      return data.publicUrl;
    },
    [userId]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadPhoto));
      setPhotos((prev) => [...prev, ...urls]);
      toast.success(`تم رفع ${files.length} صورة`);
    } catch {
      toast.error("حدث خطأ أثناء رفع الصور");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const generateDescription = async () => {
    if (!title.trim()) {
      toast.error("أدخل عنوان الخدمة أولاً");
      return;
    }
    setGeneratingDesc(true);
    try {
      const categoryName = categories?.find((c) => c.id === categoryId)?.name;
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: { title, category: categoryName, city },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.description) {
        setDescription(data.description);
        toast.success("تم توليد الوصف بنجاح!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء توليد الوصف");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        provider_id: userId,
        title,
        description,
        category_id: categoryId || null,
        city,
        country_code: selectedCountry?.code ?? 'JO',
        price_min: priceMin ? Number(priceMin) : 0,
        price_max: priceMax ? Number(priceMax) : 0,
        photos,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      toast.success(isEditing ? "تم تحديث الخدمة" : "تم إضافة الخدمة بنجاح");
      onClose();
    },
    onError: () => toast.error("حدث خطأ، حاول مرة أخرى"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("أدخل عنوان الخدمة");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Card className="border-border max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-amiri text-2xl">
            {isEditing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label>عنوان الخدمة *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: قاعة أفراح الياسمين"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>القسم</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>وصف الخدمة</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDescription}
                disabled={generatingDesc || !title.trim()}
                className="text-xs gap-1 border-gold/30 text-gold hover:bg-gold/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingDesc ? "جاري التوليد..." : "توليد بالذكاء الاصطناعي"}
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف تفصيلي للخدمة المقدمة... أو اضغط زر التوليد التلقائي"
              rows={4}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>المدينة</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent>
                {countryCities.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>السعر من ({curr})</Label>
              <Input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="0"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>السعر إلى ({curr})</Label>
              <Input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="0"
                dir="ltr"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>صور الخدمة</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 left-1 w-6 h-6 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload button */}
              <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-gold/50 cursor-pointer flex flex-col items-center justify-center text-muted-foreground hover:text-gold transition-colors">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">{uploading ? "جاري الرفع..." : "رفع صورة"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saveMutation.isPending || uploading}
              className="bg-gold hover:bg-gold-dark text-purple-deep font-bold flex-1"
            >
              {saveMutation.isPending
                ? "جاري الحفظ..."
                : isEditing
                ? "حفظ التعديلات"
                : "إضافة الخدمة"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceForm;
