import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const DashboardSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCity(profile.city ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, city, phone })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("تم تحديث الملف الشخصي");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <h1 className="font-amiri text-3xl font-bold text-foreground mb-8">الإعدادات</h1>

        <Card className="border-border max-w-lg">
          <CardHeader>
            <CardTitle className="font-amiri text-xl">الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
              </div>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-gold hover:bg-gold-dark text-purple-deep font-bold w-full"
              >
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;
