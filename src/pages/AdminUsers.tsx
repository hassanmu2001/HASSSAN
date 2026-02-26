import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const roleMap = new Map<string, string>();
  (userRoles ?? []).forEach((r) => roleMap.set(r.user_id, r.role));

  const filtered = (profiles ?? []).filter((p) => {
    const role = roleMap.get(p.user_id) ?? "client";
    if (roleFilter !== "all" && role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").includes(q)
      );
    }
    return true;
  });

  const getRoleBadge = (userId: string) => {
    const role = roleMap.get(userId) ?? "client";
    const labels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      admin: { label: "مشرف", variant: "destructive" },
      provider: { label: "مزود خدمة", variant: "default" },
      client: { label: "عميل", variant: "secondary" },
    };
    const info = labels[role] ?? labels.client;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  if (authLoading || roleLoading || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <h1 className="font-amiri text-3xl font-bold text-foreground mb-8">إدارة المستخدمين</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو المدينة أو الهاتف..."
              className="pr-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              <SelectItem value="client">عميل</SelectItem>
              <SelectItem value="provider">مزود خدمة</SelectItem>
              <SelectItem value="admin">مشرف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-muted-foreground text-sm mb-4">{filtered.length} مستخدم</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((profile) => {
              const initials = profile.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);

              return (
                <Card key={profile.id} className="border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-purple-light text-primary text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{profile.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {profile.city && <span>{profile.city}</span>}
                        {profile.phone && <span dir="ltr">{profile.phone}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRoleBadge(profile.user_id)}
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        {new Date(profile.created_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
