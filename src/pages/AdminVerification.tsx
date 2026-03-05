import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Eye, ShieldCheck, Clock, User } from "lucide-react";

const AdminVerification = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const [selectedProfile, setSelectedProfile] = useState<Tables<"profiles"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [idPhotoSignedUrl, setIdPhotoSignedUrl] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!roleLoading && isAdmin === false) navigate("/");
  }, [authLoading, user, roleLoading, isAdmin, navigate]);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["admin-verification", filter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "provider")
        .order("created_at", { ascending: false });

      if (filter === "pending") query = query.eq("is_verified", false);
      else if (filter === "verified") query = query.eq("is_verified", true);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const approveMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: true, verification_notes: null })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم توثيق مزود الخدمة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-verification"] });
      setShowDetailDialog(false);
    },
    onError: () => toast.error("حدث خطأ أثناء التوثيق"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, reason }: { profileId: string; reason: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: false, verification_notes: reason })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم رفض طلب التوثيق");
      queryClient.invalidateQueries({ queryKey: ["admin-verification"] });
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setRejectReason("");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const loadIdPhoto = async (path: string) => {
    const { data, error } = await supabase.storage.from("id-photos").createSignedUrl(path, 300);
    if (!error && data) setIdPhotoSignedUrl(data.signedUrl);
    else setIdPhotoSignedUrl(null);
  };

  const filtered = (providers ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      (p.national_id ?? "").includes(q) ||
      (p.city ?? "").toLowerCase().includes(q) ||
      (p.phone ?? "").includes(q)
    );
  });

  const pendingCount = (providers ?? []).filter((p) => !p.is_verified).length;

  if (authLoading || roleLoading || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-amiri text-3xl font-bold text-foreground">مراجعة التوثيق</h1>
            <p className="text-muted-foreground text-sm mt-1">مراجعة طلبات توثيق مزودي الخدمة</p>
          </div>
          {filter === "pending" && pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingCount} طلب معلّق
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهوية أو المدينة..."
              className="pr-10"
            />
          </div>
          <div className="flex gap-2">
            {(["pending", "verified", "all"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "pending" ? "معلّق" : f === "verified" ? "موثّق" : "الكل"}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4">{filtered.length} مزود خدمة</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد طلبات {filter === "pending" ? "معلّقة" : ""}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((profile) => {
              const initials = profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

              return (
                <Card key={profile.id} className="border-border hover:border-gold/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-purple-light text-primary">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{profile.full_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {profile.city && <span>{profile.city}</span>}
                        {profile.national_id && <span dir="ltr">هوية: {profile.national_id}</span>}
                        {profile.phone && <span dir="ltr">{profile.phone}</span>}
                      </div>
                      {profile.business_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">🏢 {profile.business_name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {profile.is_verified ? (
                        <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                          <CheckCircle className="w-3 h-3 ml-1" /> موثّق
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-500/30 text-orange-500">
                          <Clock className="w-3 h-3 ml-1" /> معلّق
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setIdPhotoSignedUrl(null);
                          if (profile.id_photo_url) loadIdPhoto(profile.id_photo_url);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {!profile.is_verified && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveMutation.mutate(profile.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedProfile(profile);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-amiri text-xl">تفاصيل مزود الخدمة</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedProfile.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-purple-light text-primary text-lg">
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{selectedProfile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProfile.city}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">رقم الجوال</p>
                  <p dir="ltr" className="font-mono">{selectedProfile.phone || "—"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">تاريخ الميلاد</p>
                  <p>{selectedProfile.date_of_birth ? new Date(selectedProfile.date_of_birth).toLocaleDateString("ar-SA") : "—"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">رقم الهوية</p>
                  <p dir="ltr" className="font-mono">{selectedProfile.national_id || "—"}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">النشاط التجاري</p>
                  <p>{selectedProfile.business_name || "—"}</p>
                </div>
                {selectedProfile.business_address && (
                  <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                    <p className="text-muted-foreground text-xs mb-1">عنوان العمل</p>
                    <p>{selectedProfile.business_address}</p>
                  </div>
                )}
              </div>

              {selectedProfile.id_photo_url && idPhotoSignedUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">صورة الهوية</p>
                  <img
                    src={idPhotoSignedUrl}
                    alt="صورة الهوية"
                    className="w-full max-h-48 object-contain rounded-lg border border-border bg-muted/30"
                  />
                </div>
              )}

              {selectedProfile.verification_notes && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive font-bold mb-1">ملاحظات الرفض السابقة</p>
                  <p className="text-sm text-destructive/80">{selectedProfile.verification_notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {!selectedProfile.is_verified ? (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(selectedProfile.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" /> موافقة وتوثيق
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="w-4 h-4 ml-2" /> رفض
                    </Button>
                  </>
                ) : (
                  <Badge className="bg-green-500/15 text-green-600 border-green-500/30 w-full justify-center py-2">
                    <CheckCircle className="w-4 h-4 ml-2" /> تم التوثيق
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-amiri text-xl">رفض طلب التوثيق</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              أدخل سبب الرفض ليتمكن مزود الخدمة من تصحيح بياناته:
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error("يرجى إدخال سبب الرفض");
                    return;
                  }
                  rejectMutation.mutate({
                    profileId: selectedProfile?.id,
                    reason: rejectReason,
                  });
                }}
                disabled={rejectMutation.isPending}
              >
                تأكيد الرفض
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectDialog(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVerification;
