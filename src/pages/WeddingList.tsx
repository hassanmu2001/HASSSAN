import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus, Trash2, Search, CheckCircle, Clock, CalendarHeart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  searching: { label: "قيد البحث", icon: Search, color: "bg-accent/20 text-accent-foreground" },
  shortlisted: { label: "مختارة", icon: Sparkles, color: "bg-gold/20 text-gold-dark" },
  booked: { label: "تم الحجز", icon: CheckCircle, color: "bg-green-100 text-green-700" },
};

const WeddingList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("قائمة عرسي");
  const [weddingDate, setWeddingDate] = useState("");
  const [partnerName, setPartnerName] = useState("");

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["wedding-lists", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_lists")
        .select("*, wedding_list_items(*, services(title, photos, price_min))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      const { error } = await supabase.from("wedding_lists").insert({
        user_id: user.id,
        title,
        wedding_date: weddingDate || null,
        partner_name: partnerName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-lists"] });
      setCreateOpen(false);
      setTitle("قائمة عرسي");
      setWeddingDate("");
      setPartnerName("");
      toast.success("تم إنشاء القائمة");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wedding_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-lists"] });
      toast.success("تم الحذف");
    },
  });

  const updateItemStatus = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { error } = await supabase
        .from("wedding_list_items")
        .update({ status })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wedding-lists"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("wedding_list_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-lists"] });
      toast.success("تم إزالة العنصر");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <CalendarHeart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-amiri text-2xl text-foreground mb-2">سجّل دخولك لإنشاء قائمة عرسك</h2>
        </div>
      </div>
    );
  }

  const daysUntilWedding = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep py-12">
        <div className="container text-center">
          <CalendarHeart className="w-10 h-10 mx-auto text-gold mb-3" />
          <h1 className="font-amiri text-3xl md:text-4xl font-bold text-primary-foreground mb-2">قائمة عرسي</h1>
          <p className="text-gold-light">خطط لعرسك وتابع التقدم</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container max-w-3xl">
          <div className="flex justify-end mb-6">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold-dark text-primary-foreground">
                  <Plus className="w-4 h-4 ml-2" /> قائمة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إنشاء قائمة عرس</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="اسم القائمة" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Input placeholder="اسم الشريك/ة (اختياري)" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
                  <Input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} />
                  <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full bg-gold hover:bg-gold-dark text-primary-foreground">
                    إنشاء
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
          ) : lists.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <CalendarHeart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لم تنشئ أي قائمة بعد</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-6">
              {lists.map((list) => {
                const items = list.wedding_list_items ?? [];
                const booked = items.filter((i) => i.status === "booked").length;
                const progress = items.length > 0 ? Math.round((booked / items.length) * 100) : 0;

                return (
                  <motion.div key={list.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-border">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-foreground">{list.title}</h3>
                            {list.partner_name && <p className="text-sm text-muted-foreground">مع {list.partner_name}</p>}
                            {list.wedding_date && (
                              <p className="text-sm text-gold mt-1">
                                <Clock className="w-3 h-3 inline ml-1" />
                                {daysUntilWedding(list.wedding_date)} يوم متبقي
                              </p>
                            )}
                          </div>
                          <button onClick={() => deleteMutation.mutate(list.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>التقدم</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {/* Items */}
                        {items.length > 0 ? (
                          <div className="space-y-2">
                            {items.map((item) => {
                              const sc = statusConfig[item.status] ?? statusConfig.searching;
                              const StatusIcon = sc.icon;
                              return (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {item.services?.title ?? item.category_name}
                                    </p>
                                  </div>
                                  <select
                                    value={item.status}
                                    onChange={(e) => updateItemStatus.mutate({ itemId: item.id, status: e.target.value })}
                                    className="text-xs bg-transparent border border-border rounded-lg px-2 py-1 text-foreground"
                                  >
                                    <option value="searching">قيد البحث</option>
                                    <option value="shortlisted">مختارة</option>
                                    <option value="booked">تم الحجز</option>
                                  </select>
                                  <Badge className={`text-xs ${sc.color}`}>
                                    <StatusIcon className="w-3 h-3 ml-1" />{sc.label}
                                  </Badge>
                                  <button onClick={() => removeItem.mutate(item.id)} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            أضف خدمات من صفحات التصنيفات لتظهر هنا
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default WeddingList;
