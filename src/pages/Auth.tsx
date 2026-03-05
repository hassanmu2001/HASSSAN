import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useCountry } from "@/hooks/use-country";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuthMode = "login" | "register";
type UserType = "client" | "provider";

const Auth = () => {
  const { selectedCountry, setSelectedCountry, countries, cities: countryCities } = useCountry();
  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [regCountry, setRegCountry] = useState(selectedCountry?.code ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [nationalId, setNationalId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [commercialRegister, setCommercialRegister] = useState<File | null>(null);
  const [commercialRegisterPreview, setCommercialRegisterPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
        return;
      }
      setIdPhoto(file);
      setIdPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removeIdPhoto = () => {
    setIdPhoto(null);
    if (idPhotoPreview) URL.revokeObjectURL(idPhotoPreview);
    setIdPhotoPreview(null);
  };

  const handleCommercialRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميغابايت");
        return;
      }
      setCommercialRegister(file);
      setCommercialRegisterPreview(URL.createObjectURL(file));
    }
  };

  const removeCommercialRegister = () => {
    setCommercialRegister(null);
    if (commercialRegisterPreview) URL.revokeObjectURL(commercialRegisterPreview);
    setCommercialRegisterPreview(null);
  };

  const regCountryObj = countries.find((c) => c.code === regCountry) ?? selectedCountry;

  const validateStep1 = () => {
    if (!fullName.trim()) { toast.error("الاسم الكامل مطلوب"); return false; }
    if (!email.trim()) { toast.error("البريد الإلكتروني مطلوب"); return false; }
    if (password.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return false; }
    if (!phone.trim()) { toast.error("رقم الجوال مطلوب"); return false; }
    if (!regCountry) { toast.error("اختيار الدولة مطلوب"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!city) { toast.error("المدينة مطلوبة"); return false; }
    if (!dateOfBirth) { toast.error("تاريخ الميلاد مطلوب"); return false; }
    if (userType === "provider") {
      if (!nationalId.trim()) { toast.error("رقم الهوية الوطنية مطلوب لمزودي الخدمة"); return false; }
      if (nationalId.length !== 10) { toast.error("رقم الهوية يجب أن يكون 10 أرقام"); return false; }
      if (!idPhoto) { toast.error("صورة الهوية مطلوبة لمزودي الخدمة"); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "register" && step === 1) {
      if (validateStep1()) {
        // Update global country to match registration selection
        if (regCountryObj && regCountryObj.code !== selectedCountry?.code) {
          setSelectedCountry(regCountryObj);
        }
        setStep(2);
      }
      return;
    }

    if (mode === "register" && !validateStep2()) return;

    setLoading(true);

    try {
      if (mode === "register") {
        // Upload ID photo if provider
        let idPhotoUrl: string | null = null;
        if (userType === "provider" && idPhoto) {
          const fileExt = idPhoto.name.split(".").pop();
          const fileName = `${Date.now()}.${fileExt}`;
          // We'll use a temp path, then update after user is created
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("id-photos")
            .upload(`temp/${fileName}`, idPhoto);
          if (uploadError) throw uploadError;
          idPhotoUrl = uploadData.path;
        }

        // Upload commercial register if provider
        let commercialRegisterUrl: string | null = null;
        if (userType === "provider" && commercialRegister) {
          const fileExt = commercialRegister.name.split(".").pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("commercial-registers")
            .upload(`temp/${fileName}`, commercialRegister);
          if (uploadError) throw uploadError;
          commercialRegisterUrl = uploadData.path;
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              user_type: userType,
              phone,
              city,
              country_code: regCountry || selectedCountry?.code || 'JO',
              date_of_birth: dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : null,
              national_id: userType === "provider" ? nationalId : null,
              business_name: userType === "provider" ? businessName : null,
              business_address: userType === "provider" ? businessAddress : null,
              id_photo_url: idPhotoUrl,
              commercial_register_url: commercialRegisterUrl,
            },
          },
        });
        if (error) throw error;

        // Move ID photo to user folder if uploaded
        if (idPhotoUrl && signUpData.user) {
          const newPath = `${signUpData.user.id}/${idPhotoUrl.split("/").pop()}`;
          await supabase.storage.from("id-photos").move(idPhotoUrl, newPath);
        }

        // Move commercial register to user folder if uploaded
        if (commercialRegisterUrl && signUpData.user) {
          const newPath = `${signUpData.user.id}/${commercialRegisterUrl.split("/").pop()}`;
          await supabase.storage.from("commercial-registers").move(commercialRegisterUrl, newPath);
        }

        toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("تم تسجيل الدخول بنجاح!");
        navigate("/");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = mode === "register" ? 2 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep flex items-center justify-center p-4">
      {/* Decorative */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-gold blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full bg-gold-light blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="block text-center mb-8">
          <h1 className="font-amiri text-4xl font-bold text-gold">أفراحي</h1>
        </Link>

        <Card className="border-gold/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-amiri text-2xl">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </CardTitle>
            {mode === "register" && (
              <div className="flex items-center justify-center gap-2 mt-3">
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      s <= step ? "bg-gold w-8" : "bg-muted w-4"
                    )}
                  />
                ))}
                <span className="text-xs text-muted-foreground mr-2">
                  {step}/{totalSteps}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {mode === "register" && step === 1 && (
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={userType === "client" ? "default" : "outline"}
                  className={`flex-1 ${userType === "client" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setUserType("client")}
                >
                  عميل
                </Button>
                <Button
                  type="button"
                  variant={userType === "provider" ? "default" : "outline"}
                  className={`flex-1 ${userType === "provider" ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setUserType("provider")}
                >
                  مزود خدمة
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "login" && (
                <>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      required
                    />
                  </div>
                </>
              )}

              {mode === "register" && step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الدولة</Label>
                    <Select value={regCountry} onValueChange={(val) => { setRegCountry(val); setCity(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر دولتك" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-2">
                              <span>{c.flag_emoji}</span>
                              <span>{c.name}</span>
                              <span className="text-muted-foreground text-xs">{c.dial_code}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الجوال</Label>
                    <div className="flex gap-2" dir="ltr">
                      <div className="flex items-center gap-1.5 px-3 rounded-md border border-input bg-muted text-sm shrink-0 min-w-[80px] justify-center">
                        <span>{regCountryObj?.flag_emoji ?? '🌍'}</span>
                        <span className="text-muted-foreground">{regCountryObj?.dial_code || '+966'}</span>
                      </div>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="XXXXXXXXX"
                        dir="ltr"
                        className="flex-1"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "register" && step === 2 && (
                <>
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

                  <div className="space-y-2">
                    <Label>تاريخ الميلاد</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {dateOfBirth
                            ? format(dateOfBirth, "dd/MM/yyyy")
                            : "اختر تاريخ الميلاد"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={setDateOfBirth}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1940-01-01")
                          }
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear() - 15}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {userType === "provider" && (
                    <>
                      <div className="space-y-2">
                        <Label>رقم الهوية الوطنية / الإقامة <span className="text-destructive">*</span></Label>
                        <Input
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="أدخل رقم الهوية (10 أرقام)"
                          dir="ltr"
                          maxLength={10}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>صورة الهوية <span className="text-destructive">*</span></Label>
                        {idPhotoPreview ? (
                          <div className="relative rounded-lg overflow-hidden border border-border">
                            <img src={idPhotoPreview} alt="صورة الهوية" className="w-full h-32 object-cover" />
                            <button
                              type="button"
                              onClick={removeIdPhoto}
                              className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-sm text-muted-foreground">اضغط لرفع صورة الهوية</span>
                            <span className="text-xs text-muted-foreground">أقصى حجم: 5 ميغابايت</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIdPhotoChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>صورة السجل التجاري / الترخيص <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
                        {commercialRegisterPreview ? (
                          <div className="relative rounded-lg overflow-hidden border border-border">
                            <img src={commercialRegisterPreview} alt="صورة السجل التجاري" className="w-full h-32 object-cover" />
                            <button
                              type="button"
                              onClick={removeCommercialRegister}
                              className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors">
                            <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-sm text-muted-foreground">اضغط لرفع صورة السجل التجاري</span>
                            <span className="text-xs text-muted-foreground">أقصى حجم: 5 ميغابايت</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCommercialRegisterChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>اسم النشاط التجاري <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
                        <Input
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="اسم المحل أو الشركة"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>عنوان العمل <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
                        <Input
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="عنوان مقر العمل"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="flex gap-2">
                {mode === "register" && step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    رجوع
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "bg-gold hover:bg-gold-dark text-purple-deep font-bold h-12",
                    mode === "register" && step === 2 ? "flex-1" : "w-full"
                  )}
                >
                  {loading
                    ? "جاري التحميل..."
                    : mode === "login"
                    ? "دخول"
                    : step === 1
                    ? "التالي"
                    : "إنشاء حساب"}
                </Button>
              </div>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setStep(1);
                }}
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                {mode === "login" ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب؟ سجّل دخولك"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
