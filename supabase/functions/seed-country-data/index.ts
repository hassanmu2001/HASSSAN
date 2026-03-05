import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Country-specific name pools (expanded to 16+ first/last names per country)
const COUNTRY_NAMES: Record<string, { firstNames: string[], lastNames: string[], cities: string[], phones: string[] }> = {
  JO: { firstNames: ["أيمن","ريم","طارق","ليلى","عمر","هناء","ماجد","سناء","أنس","نادية","زيد","رانيا","خالد","مها","يزن","دانية"], lastNames: ["العبادي","الزعبي","الخوالدة","النسور","البطاينة","الحوراني","الرواشدة","القاضي","المصري","الطراونة","العمري","الشمايلة","السعود","الحياري","الجراح","الفاعوري"], cities: ["عمّان","إربد","الزرقاء","العقبة","مادبا","جرش","الكرك","السلط"], phones: ["+962790","+962770","+962780"] },
  SA: { firstNames: ["فهد","نورة","سلطان","هيفاء","عبدالله","ريم","محمد","أميرة","خالد","سارة","تركي","لطيفة","بندر","منيرة","ناصر","وفاء"], lastNames: ["العتيبي","القحطاني","الدوسري","الشمري","المطيري","الحربي","الغامدي","الزهراني","السبيعي","العنزي","الرشيدي","البقمي","الشهري","المالكي","الجهني","السهلي"], cities: ["الرياض","جدة","الدمام","مكة","المدينة","الطائف","أبها","تبوك"], phones: ["+96650","+96655","+96653"] },
  AE: { firstNames: ["راشد","مريم","سلطان","شمّا","حمدان","علياء","سعيد","فاطمة","ماجد","موزة","أحمد","حصة","عبدالله","لطيفة","خالد","نورة"], lastNames: ["المنصوري","الكعبي","الهاشمي","النعيمي","المزروعي","الظاهري","الشامسي","المهيري","الفلاسي","الكتبي","الرميثي","السويدي","العامري","البلوشي","الحمادي","المرر"], cities: ["دبي","أبوظبي","الشارقة","عجمان","العين","رأس الخيمة"], phones: ["+97150","+97155","+97156"] },
  KW: { firstNames: ["فهد","نوره","بدر","دلال","مشاري","أسماء","حمد","هيا","عبدالعزيز","مريم","يوسف","شيخة","جاسم","لطيفة","سالم","منى"], lastNames: ["العنزي","المطيري","الشمري","الرشيدي","الحربي","الفضلي","العجمي","الدوسري","العتيبي","الهاجري","البذالي","الصباح","الخالدي","المري","الظفيري","السبيعي"], cities: ["الكويت","حولي","السالمية","الأحمدي","الجهراء","الفروانية"], phones: ["+96550","+96555","+96560"] },
  BH: { firstNames: ["جاسم","زهراء","عادل","فاطمة","حسين","مريم","علي","نورة","محمد","هدى","أحمد","زينب","حسن","ليلى","عبدالله","سمية"], lastNames: ["البنعلي","الدوسري","الشيراوي","المناعي","البوعينين","الخليفة","المؤيد","النعيمي","الزياني","الجودر","الأنصاري","الموسوي","رجب","بوحمد","العالي","الكوهجي"], cities: ["المنامة","المحرق","الرفاع","مدينة عيسى","مدينة حمد","سترة"], phones: ["+97333","+97336","+97339"] },
  QA: { firstNames: ["خالد","مها","عبدالعزيز","شيخة","حمد","آمنة","ناصر","مريم","جاسم","نورة","سعود","حصة","محمد","موزة","علي","فاطمة"], lastNames: ["الكواري","المري","آل ثاني","المعاضيد","الهاجري","النعيمي","الدوسري","الخاطر","المسلماني","البوعينين","السليطي","المهندي","الحمد","العمادي","الأنصاري","الكبيسي"], cities: ["الدوحة","الوكرة","الخور","أم صلال","الريان"], phones: ["+97433","+97455","+97466"] },
  OM: { firstNames: ["حمد","شيخة","سالم","ميثاء","سعيد","عائشة","خالد","مريم","يوسف","فاطمة","هلال","زينب","ناصر","نجوى","أحمد","سلمى"], lastNames: ["البلوشي","الحارثي","الريامي","الرواحي","البوسعيدي","الهنائي","العامري","المعمري","الكندي","الشكيلي","اليعقوبي","السعدي","الجابري","المقبالي","الشيباني","النبهاني"], cities: ["مسقط","صلالة","صحار","نزوى","السيب","عبري"], phones: ["+96891","+96892","+96899"] },
  IQ: { firstNames: ["علي","زينب","مصطفى","هدى","حسين","سارة","أحمد","مريم","محمد","فاطمة","عمار","نور","حيدر","ياسمين","كرار","سجى"], lastNames: ["الجبوري","السعدي","الربيعي","الدليمي","العبيدي","الشمري","التميمي","المالكي","الحسيني","الكاظمي","العزاوي","البياتي","الدوري","الراوي","الجنابي","السامرائي"], cities: ["بغداد","أربيل","البصرة","النجف","كربلاء","السليمانية"], phones: ["+96470","+96475","+96477"] },
  SY: { firstNames: ["باسل","رنا","فراس","لين","مازن","سلاف","أنس","ديمة","عمر","هبة","سامر","غادة","طارق","ميس","أيمن","رهف"], lastNames: ["الأحمد","الشامي","الحلبي","الخطيب","العلي","المصري","الدمشقي","القاسم","النجار","الحسن","إبراهيم","حمود","السالم","عبدالكريم","الشيخ","محمود"], cities: ["دمشق","حلب","اللاذقية","حمص","طرطوس","دير الزور"], phones: ["+96393","+96394","+96399"] },
  LB: { firstNames: ["وليد","نادين","سامي","كارلا","طوني","ريتا","مروان","نانسي","إيلي","مايا","خالد","جيسيكا","كريم","لارا","حسين","دانيا"], lastNames: ["حداد","خوري","عيتاني","جبران","نصرالله","الحريري","صفي الدين","بعلبكي","فرنجية","معلوف","سلام","الأمين","شمعون","ضاهر","راشد","طراد"], cities: ["بيروت","طرابلس","صيدا","جونيه","زحلة","بعلبك"], phones: ["+96170","+96171","+96176"] },
  PS: { firstNames: ["ماجد","دينا","وسيم","هبة","باسم","آلاء","محمد","سمر","أحمد","رولا","يوسف","نداء","إبراهيم","لمى","خالد","صفاء"], lastNames: ["عودة","نصار","الخطيب","أبو شمالة","مسعود","صالح","حمدان","شاهين","الطويل","عبدالله","دويكات","رجب","البرغوثي","الهندي","جرادات","أبو غزالة"], cities: ["رام الله","غزة","نابلس","الخليل","بيت لحم","جنين"], phones: ["+97059","+97056","+97052"] },
  YE: { firstNames: ["محمد","سارة","أحمد","إيمان","عبدالله","أماني","علي","سمية","خالد","هدى","حسين","رانيا","ياسر","فاطمة","عمر","نورا"], lastNames: ["الحميري","القحطاني","باعباد","الأهدل","الحوثي","المخلافي","الشرجبي","النهمي","السقاف","بامحرز","الزبيدي","الحداد","المتوكل","الوصابي","الجنيد","العولقي"], cities: ["صنعاء","عدن","تعز","الحديدة","إب","المكلا"], phones: ["+96771","+96773","+96777"] },
  EG: { firstNames: ["عمرو","نورهان","كريم","مروة","أحمد","ياسمين","محمد","شيماء","حسام","دينا","عمر","هاجر","مصطفى","سلمى","طارق","ريم"], lastNames: ["الشريف","فوزي","حسنين","عبدالحميد","رمضان","السيد","عبدالفتاح","الجندي","خليل","بدوي","شلبي","النجار","مرسي","هاشم","عثمان","سالم"], cities: ["القاهرة","الإسكندرية","الجيزة","المنصورة","طنطا","أسيوط","الزقازيق","بورسعيد"], phones: ["+20100","+20101","+20106"] },
  LY: { firstNames: ["عبدالسلام","أسماء","نبيل","خديجة","محمد","فاطمة","أحمد","سعاد","علي","منى","خالد","نجاة","عمر","حنان","يوسف","صفية"], lastNames: ["الطرابلسي","بوشناف","المصراتي","الورفلي","القذافي","الجهمي","الفيتوري","البرغثي","المقريف","الأخضر","الزليتني","بلحاج","السويحلي","الككلي","المجبري","التاجوري"], cities: ["طرابلس","بنغازي","مصراتة","سبها","الزاوية","البيضاء"], phones: ["+21891","+21892","+21894"] },
  TN: { firstNames: ["أمين","مروى","هيثم","آمال","ياسين","سلمى","محمد","نسرين","أنس","إيناس","علي","سندس","بلال","هاجر","سامي","ريم"], lastNames: ["بن سالم","الجلاصي","التونسي","بوزيد","العياري","الهمامي","المرزوقي","الخليفي","بن يوسف","الجبالي","السخيري","بن علي","الحبيب","القروي","الشابي","بوعزيزي"], cities: ["تونس","سوسة","صفاقس","القيروان","بنزرت","المنستير"], phones: ["+21620","+21625","+21690"] },
  DZ: { firstNames: ["كريم","أميرة","ياسين","فتيحة","محمد","سارة","عبدالرحمن","نسيمة","أنور","سليمة","إسلام","خيرة","رضا","حياة","نبيل","وسيلة"], lastNames: ["بن عمر","بوزيد","مسعودي","بلقاسم","بن شريف","حداد","مزيان","بلعباس","خليفي","عمراني","زروقي","بن يحيى","مهدي","سلامي","بركات","تواتي"], cities: ["الجزائر","وهران","قسنطينة","عنابة","سطيف","باتنة","بليدة","تلمسان"], phones: ["+21355","+21356","+21377"] },
  MA: { firstNames: ["يوسف","فاطمة الزهراء","أنس","كوثر","محمد","خديجة","عمر","مريم","أيوب","سمية","إلياس","هاجر","حمزة","زينب","عادل","نجاة"], lastNames: ["بنشقرون","العلوي","الإدريسي","بنعمر","أمزيان","الفاسي","المرابط","بوزيد","العراقي","الخطابي","البكاري","المنصوري","حجي","الشرقاوي","بنجلون","الوافي"], cities: ["الدار البيضاء","مراكش","الرباط","فاس","طنجة","أكادير","مكناس","وجدة"], phones: ["+21260","+21261","+21266"] },
  MR: { firstNames: ["محمدو","مريم","أحمدو","فاطمة","عبدالله","آمنة","سيدي","خديجة","الشيخ","سلمى","محمد","زينب","إبراهيم","عائشة","المختار","منت"], lastNames: ["ولد محمد","بنت أحمد","ولد عبدالله","ولد الشيخ","بنت محمد","ولد سيدي","بنت عبدالله","ولد أحمدو","ولد الطالب","بنت سيدي","ولد محمدن","بنت المختار","ولد حبيب","ولد الدده","بنت الشيخ","ولد إبراهيم"], cities: ["نواكشوط","نواذيبو","كيفة","ألاك","أطار","روصو"], phones: ["+22222","+22233","+22244"] },
  SD: { firstNames: ["عمر","سلمى","إبراهيم","مروة","أحمد","هاجر","محمد","سمية","خالد","إيمان","يوسف","نهى","حسن","رانيا","عادل","هبة"], lastNames: ["محمدين","عثمان","الفاضل","عبدالرحمن","الطيب","بابكر","أحمد","عبدالله","حسن","إبراهيم","آدم","موسى","محمد","عمر","الأمين","النور"], cities: ["الخرطوم","أم درمان","بحري","بورتسودان","كسلا","الأبيض"], phones: ["+24991","+24992","+24999"] },
  SO: { firstNames: ["عبدي","آمنة","حسن","خديجة","محمد","فاطمة","أحمد","زهرة","علي","مريم","عمر","عائشة","يوسف","سعدية","إبراهيم","هوادان"], lastNames: ["فارح","علي","عبدالله","محمد","حسن","عمر","إبراهيم","أحمد","يوسف","جامع","عيدروس","شريف","نور","قاسم","ديريه","عبدي"], cities: ["مقديشو","هرجيسا","كيسمايو","بربرة","بيدوا","غالكعيو"], phones: ["+25261","+25263","+25269"] },
  DJ: { firstNames: ["عبدالرحمن","فوزية","محمود","حليمة","أحمد","آمنة","حسن","خديجة","إبراهيم","مريم","علي","فاطمة","يوسف","زينب","عمر","سعاد"], lastNames: ["عمر","حسن","إبراهيم","أحمد","محمد","علي","يوسف","عبدالله","محمود","فارح","عبدي","جامع","داود","إسماعيل","عيسى","قاسم"], cities: ["جيبوتي","تاجورة","علي صبيح","أوبوك","دخيل","أرتا"], phones: ["+25377","+25378","+25321"] },
  KM: { firstNames: ["سعيد","حليمة","ناصر","فاطمة","محمد","مريم","أحمد","زينب","علي","عائشة","يوسف","آمنة","إبراهيم","خديجة","عمر","سلمى"], lastNames: ["أحمد","عبدالله","محمد","علي","حسن","إبراهيم","يوسف","عمر","سعيد","فارح","عبدالرحمن","ناصر","جمال","سليمان","مصطفى","بكري"], cities: ["موروني","موتسامودو","فومبوني","دوموني","ميتساميولي","إيتساندرا"], phones: ["+26932","+26933","+26934"] },
  TR: { firstNames: ["أمير","عائشة","يوسف","فاطمة","محمد","زينب","أحمد","مريم","علي","أسماء","حسن","سلمى","عمر","هدى","مصطفى","ليلى"], lastNames: ["يلدز","أوزتورك","شاهين","دمير","أيدن","كايا","تشيليك","يلماز","آرسلان","قورت","أكتاش","طوران","بايرام","قاراكاش","كوتش","أوزدمير"], cities: ["إسطنبول","أنقرة","أنطاليا","بورصة","إزمير","قونية","غازي عنتاب","طرابزون"], phones: ["+90530","+90532","+90535"] },
};

const CATEGORY_SLUGS = [
  "wedding-attire","entertainment","photography","cakes","sound","stage-decor",
  "makeup","gifts","flowers","invitations","event-planning","zaffa","catering","printing","transport","halls"
];

// Business name templates per category
const CATEGORY_BIZ: Record<string, string[]> = {
  "wedding-attire": ["أناقة العروس","دار الأزياء","بيت الموضة","إلهام للأزياء"],
  "entertainment": ["مرح بارك","عالم الترفيه","فرحة للترفيه","نجوم الفرح"],
  "photography": ["استوديو الذكريات","عدسة الفرح","لحظات للتصوير","فوكس ستوديو"],
  "cakes": ["حلويات السعادة","كيك الأحلام","سكر ولوز","حلاوة الفرح"],
  "sound": ["صوت الفرح","DJ الليل","نغمات الحفل","إيقاع ساوند"],
  "stage-decor": ["ديكور الأحلام","لمسة إبداع","تنسيقات المسرح","رونق الكوش"],
  "makeup": ["جمالك صالون","صالون الأناقة","بيوتي لاونج","لمسة جمال"],
  "gifts": ["هدايا الفرح","توزيعات مميزة","بوكيه للهدايا","تذكار الفرح"],
  "flowers": ["ورد الجوري","زهور الربيع","باقات الحب","نسمة ورد"],
  "invitations": ["بطاقات الفرح","تصميم الدعوات","كارت الزفاف","إبداع الدعوات"],
  "event-planning": ["تنظيم الأفراح","مناسبات VIP","إيفنت بلانر","إدارة المناسبات"],
  "zaffa": ["زفة الأمراء","فرقة الطرب","حادي العيس","نغم الزفة"],
  "catering": ["مطبخ الضيافة","بوفيه الملوك","ذوق ونكهة","سفرة الأفراح"],
  "printing": ["مطبعة الفرح","طباعة إبداعية","برينت هاوس","إبداع المطابع"],
  "transport": ["ليموزين VIP","سيارات الأحلام","رويال ترانسفير","نقل الأفراح"],
  "halls": ["قاعة الملكية","صالة النخبة","دار المناسبات","قاعة الفخامة"],
};

const CAT_LABEL: Record<string, string> = {
  "wedding-attire": "أزياء العروس والعريس",
  "entertainment": "الترفيه والألعاب",
  "photography": "التصوير والفيديو",
  "cakes": "الحلويات والكيك",
  "sound": "الصوتيات والإضاءة",
  "stage-decor": "الكوش والمسرح",
  "makeup": "المكياج والتجميل",
  "gifts": "الهدايا والتوزيعات",
  "flowers": "الورود والتنسيق",
  "invitations": "بطاقات الدعوة",
  "event-planning": "تنظيم الحفلات",
  "zaffa": "الزفة",
  "catering": "الضيافة والطعام",
  "printing": "الطباعة",
  "transport": "النقل والليموزين",
  "halls": "صالات الأفراح",
};

const CAT_OPTIONS: Record<string, { name: string, desc: string, tiers: { min: number, max: number | null, price: number }[] }[]> = {
  "wedding-attire": [
    { name: "فستان زفاف كلاسيكي", desc: "فساتين بتصاميم كلاسيكية أنيقة", tiers: [{ min: 1, max: 1, price: 500 }, { min: 2, max: 3, price: 450 }] },
    { name: "فستان زفاف فاخر", desc: "فساتين بأقمشة فاخرة وتطريز يدوي", tiers: [{ min: 1, max: 1, price: 1500 }] },
    { name: "بدلة عريس", desc: "بدلات رسمية بأحدث الموديلات", tiers: [{ min: 1, max: 1, price: 400 }] },
    { name: "إكسسوارات العروس", desc: "تاج، طرحة، حذاء، وحقيبة", tiers: [{ min: 1, max: 1, price: 200 }] },
  ],
  "entertainment": [
    { name: "ألعاب أطفال أساسية", desc: "نطيطة، رسم وجوه، بالونات", tiers: [{ min: 1, max: 50, price: 15 }, { min: 51, max: null, price: 10 }] },
    { name: "عروض سحرية", desc: "ساحر محترف مع عرض تفاعلي", tiers: [{ min: 1, max: 1, price: 800 }] },
    { name: "فقرة مهرج", desc: "مهرج مع ألعاب وهدايا", tiers: [{ min: 1, max: 1, price: 500 }] },
  ],
  "photography": [
    { name: "تصوير فوتوغرافي (4 ساعات)", desc: "مصور محترف مع تعديل احترافي", tiers: [{ min: 1, max: 1, price: 1200 }] },
    { name: "تصوير فيديو كامل", desc: "تصوير الحفل مع مونتاج احترافي", tiers: [{ min: 1, max: 1, price: 2500 }] },
    { name: "باقة شاملة (فوتو+فيديو+درون)", desc: "تغطية كاملة مع ألبوم مطبوع", tiers: [{ min: 1, max: 1, price: 4000 }] },
  ],
  "cakes": [
    { name: "كيكة زفاف صغيرة (3 طبقات)", desc: "لـ 30-50 شخص بتصميم أنيق", tiers: [{ min: 30, max: 50, price: 25 }, { min: 51, max: 100, price: 22 }] },
    { name: "كيكة زفاف كبيرة (5 طبقات)", desc: "تصميم مخصص بالنكهة المفضلة", tiers: [{ min: 50, max: 100, price: 30 }, { min: 101, max: null, price: 25 }] },
    { name: "حلويات متنوعة", desc: "بقلاوة، معمول، كنافة، حلويات عربية", tiers: [{ min: 50, max: 100, price: 8 }, { min: 101, max: 300, price: 6 }] },
  ],
  "sound": [
    { name: "نظام صوت أساسي", desc: "سماعات + ميكسر حتى 200 شخص", tiers: [{ min: 1, max: 1, price: 800 }] },
    { name: "نظام صوت احترافي + DJ", desc: "نظام متكامل حتى 500 شخص مع DJ", tiers: [{ min: 1, max: 1, price: 2000 }] },
    { name: "إضاءة وليزر شو", desc: "نظام إضاءة ليزر متحرك للمسرح", tiers: [{ min: 1, max: 1, price: 1200 }] },
  ],
  "stage-decor": [
    { name: "كوشة بسيطة", desc: "كوشة أنيقة مزينة بالورود الطبيعية", tiers: [{ min: 1, max: 1, price: 1500 }] },
    { name: "كوشة فاخرة", desc: "تصميم مخصص مع إضاءة وكريستال", tiers: [{ min: 1, max: 1, price: 4000 }] },
    { name: "ممر العروس المزين", desc: "تزيين ممر بالورود والشموع والإضاءة", tiers: [{ min: 1, max: 1, price: 800 }] },
  ],
  "makeup": [
    { name: "مكياج عروس كامل", desc: "مكياج + تسريحة مع جلسة تجربة مسبقة", tiers: [{ min: 1, max: 1, price: 1500 }] },
    { name: "مكياج سهرة", desc: "للأمهات والمدعوات الخاصات", tiers: [{ min: 1, max: 3, price: 400 }, { min: 4, max: null, price: 350 }] },
    { name: "عناية بالبشرة قبل الزفاف", desc: "تنظيف عميق وترطيب وتجهيز البشرة", tiers: [{ min: 1, max: 1, price: 300 }] },
  ],
  "gifts": [
    { name: "توزيعات بسيطة", desc: "علب هدايا صغيرة أنيقة مع شوكولاتة", tiers: [{ min: 50, max: 100, price: 8 }, { min: 101, max: 300, price: 6 }] },
    { name: "توزيعات فاخرة", desc: "علب مخملية مع شوكولاتة بلجيكية", tiers: [{ min: 50, max: 100, price: 20 }, { min: 101, max: 300, price: 16 }] },
  ],
  "flowers": [
    { name: "باقة عروس", desc: "باقة ورد طبيعي أنيقة بتنسيق مميز", tiers: [{ min: 1, max: 1, price: 300 }] },
    { name: "تنسيق طاولات", desc: "فازات ورد طبيعي لكل طاولة ضيوف", tiers: [{ min: 10, max: 20, price: 80 }, { min: 21, max: null, price: 65 }] },
    { name: "بوابة ورد", desc: "بوابة استقبال مزينة بالورد الطبيعي", tiers: [{ min: 1, max: 1, price: 1200 }] },
  ],
  "invitations": [
    { name: "بطاقة رقمية", desc: "تصميم إلكتروني أنيق للإرسال عبر واتساب", tiers: [{ min: 1, max: 1, price: 150 }] },
    { name: "بطاقة مطبوعة عادية", desc: "طباعة على ورق فاخر مع تغليف", tiers: [{ min: 50, max: 100, price: 5 }, { min: 101, max: 300, price: 3.5 }] },
    { name: "بطاقة مطبوعة فاخرة", desc: "طباعة بالذهب على ورق مخمل مع ختم", tiers: [{ min: 50, max: 100, price: 12 }, { min: 101, max: 300, price: 9 }] },
  ],
  "event-planning": [
    { name: "تنظيم حفل صغير (حتى 100 ضيف)", desc: "تنسيق كامل مع إدارة الحفل", tiers: [{ min: 1, max: 1, price: 3000 }] },
    { name: "تنظيم حفل كبير (100-500 ضيف)", desc: "إدارة شاملة مع فريق تنسيق", tiers: [{ min: 1, max: 1, price: 8000 }] },
    { name: "تنظيم حفل VIP", desc: "خدمة فاخرة مع تنسيق شامل لكل التفاصيل", tiers: [{ min: 1, max: 1, price: 15000 }] },
  ],
  "zaffa": [
    { name: "زفة شعبية", desc: "فرقة شعبية مع طبول ودبكة", tiers: [{ min: 1, max: 1, price: 1500 }] },
    { name: "زفة فنية مع فرقة موسيقية", desc: "فرقة فنية مع عود وكمان", tiers: [{ min: 1, max: 1, price: 3000 }] },
    { name: "زفة مع خيول", desc: "موكب زفاف بالخيول العربية المزينة", tiers: [{ min: 1, max: 2, price: 2000 }] },
  ],
  "catering": [
    { name: "بوفيه أساسي", desc: "سلطات + طبق رئيسي + حلويات + مشروبات", tiers: [{ min: 50, max: 100, price: 45 }, { min: 101, max: 300, price: 38 }, { min: 301, max: null, price: 32 }] },
    { name: "بوفيه فاخر", desc: "مقبلات + 3 أطباق رئيسية + حلويات فاخرة", tiers: [{ min: 50, max: 100, price: 85 }, { min: 101, max: 300, price: 70 }] },
    { name: "ضيافة قهوة وشاي", desc: "قهوة عربية + شاي + تمر + حلويات", tiers: [{ min: 50, max: 100, price: 15 }, { min: 101, max: null, price: 12 }] },
    { name: "عشاء رسمي (خدمة طاولات)", desc: "قائمة مخصصة مع خدمة ويتر", tiers: [{ min: 50, max: 100, price: 120 }, { min: 101, max: null, price: 100 }] },
  ],
  "printing": [
    { name: "بنرات ترحيبية", desc: "بنرات ترحيبية وتوجيهية بتصميم مميز", tiers: [{ min: 1, max: 5, price: 80 }, { min: 6, max: null, price: 60 }] },
    { name: "ألبوم صور فاخر", desc: "ألبوم بغلاف جلدي مع طباعة عالية الجودة", tiers: [{ min: 1, max: 1, price: 500 }] },
  ],
  "transport": [
    { name: "ليموزين كلاسيكي", desc: "سيارة فاخرة مع سائق لمدة 4 ساعات", tiers: [{ min: 1, max: 1, price: 1500 }] },
    { name: "رولز رويس مع تزيين", desc: "سيارة فارهة مع تزيين كامل وسائق", tiers: [{ min: 1, max: 1, price: 3000 }] },
    { name: "نقل ضيوف (باصات)", desc: "باصات مكيفة فاخرة لنقل الضيوف", tiers: [{ min: 1, max: 2, price: 800 }, { min: 3, max: null, price: 650 }] },
  ],
  "halls": [
    { name: "قاعة صغيرة (حتى 100 ضيف)", desc: "قاعة مجهزة بالكامل مع تكييف", tiers: [{ min: 1, max: 1, price: 3000 }] },
    { name: "قاعة متوسطة (100-300 ضيف)", desc: "قاعة واسعة مع تجهيز كامل ومسرح", tiers: [{ min: 1, max: 1, price: 8000 }] },
    { name: "قاعة كبيرة فاخرة (300-800 ضيف)", desc: "قاعة ملكية مع ديكور فاخر ومسرح كبير", tiers: [{ min: 1, max: 1, price: 18000 }] },
  ],
};

// Service descriptions per category (unique per provider index)
const CAT_DESCRIPTIONS: Record<string, string[]> = {
  "wedding-attire": [
    "نتميز بتقديم أرقى فساتين الزفاف العالمية والمحلية مع خدمة تفصيل حسب الطلب. نوفر تشكيلة واسعة من البدلات الرجالية الفاخرة وإكسسوارات العروس الكاملة.",
  ],
  "entertainment": [
    "نقدم حزم ترفيهية متكاملة للحفلات تشمل ألعاب الأطفال التفاعلية، عروض السحر والمهرج، والأنشطة الجماعية التي تضفي البهجة على مناسبتك.",
  ],
  "photography": [
    "فريق تصوير محترف بأحدث الكاميرات والمعدات. نوثق أجمل لحظاتك بعدسة إبداعية مع مونتاج احترافي وتصوير جوي بالدرون وألبومات فاخرة.",
  ],
  "cakes": [
    "نصنع كيكات الزفاف الفاخرة بتصاميم فنية فريدة وبأجود المكونات. نقدم أيضاً تشكيلة واسعة من الحلويات العربية والغربية لإضافة لمسة حلوة لمناسبتك.",
  ],
  "sound": [
    "نوفر أنظمة صوت احترافية من أفضل الماركات العالمية مع DJ محترف. نقدم أيضاً أنظمة إضاءة وليزر شو لخلق أجواء ساحرة في حفلك.",
  ],
  "stage-decor": [
    "نصمم كوشات وديكورات زفاف فريدة تعكس ذوقك الخاص. من الكوش البسيطة الأنيقة إلى التصاميم الفاخرة مع الكريستال والإضاءة المبتكرة.",
  ],
  "makeup": [
    "خبيرات تجميل محترفات يقدمن مكياج عروس مميز مع تسريحات شعر أنيقة. نوفر جلسات تجربة مسبقة وخدمة مكياج للأمهات والمدعوات.",
  ],
  "gifts": [
    "نصمم توزيعات وهدايا أفراح أنيقة تترك انطباعاً مميزاً لدى ضيوفك. من التوزيعات البسيطة الأنيقة إلى العلب المخملية الفاخرة بشوكولاتة بلجيكية.",
  ],
  "flowers": [
    "نتخصص في تنسيق الورود الطبيعية للأفراح بأسلوب عصري ومبتكر. نقدم باقات العروس، تنسيق الطاولات، بوابات الورد، وتزيين القاعات بالورود الطازجة.",
  ],
  "invitations": [
    "نصمم بطاقات دعوة أفراح مميزة تعكس ذوقك. نقدم بطاقات رقمية للإرسال الفوري وبطاقات مطبوعة فاخرة بطباعة الذهب والفضة على أرقى أنواع الورق.",
  ],
  "event-planning": [
    "نقدم خدمات تنظيم حفلات زفاف متكاملة من الألف إلى الياء. فريق محترف يتولى إدارة كل التفاصيل لضمان حفل لا يُنسى يليق بأحلامك.",
  ],
  "zaffa": [
    "نقدم زفات مميزة بفرق فنية محترفة. من الزفات الشعبية بالطبول والدبكة إلى الزفات الفنية مع فرقة موسيقية كاملة وموكب بالخيول العربية المزينة.",
  ],
  "catering": [
    "نقدم خدمات ضيافة متميزة تشمل بوفيهات متنوعة بأشهى المأكولات العربية والعالمية. قائمة طعام مخصصة حسب ذوقك مع خدمة تقديم احترافية.",
  ],
  "printing": [
    "نقدم خدمات طباعة متميزة للأفراح تشمل بنرات ترحيبية بتصاميم مبتكرة، ألبومات صور فاخرة بغلاف جلدي، وجميع المطبوعات التي تحتاجها لمناسبتك.",
  ],
  "transport": [
    "نوفر أفخم السيارات لحفلات الزفاف من ليموزين كلاسيكي إلى رولز رويس مع تزيين كامل. نقدم أيضاً خدمة نقل الضيوف بباصات فاخرة مكيفة.",
  ],
  "halls": [
    "نقدم قاعات أفراح فاخرة بمساحات متنوعة تناسب جميع الأحجام. قاعاتنا مجهزة بأحدث أنظمة الصوت والإضاءة مع ديكور فاخر وخدمة ضيافة متميزة.",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, country_code } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "seed_country" && country_code) {
      const names = COUNTRY_NAMES[country_code];
      if (!names) return new Response(JSON.stringify({ error: "Unknown country" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const categories = await supabase.from("categories").select("id, slug").then(r => r.data ?? []);
      const country = await supabase.from("countries").select("id, code, name, currency_symbol, dial_code").eq("code", country_code).single().then(r => r.data);
      if (!country) return new Response(JSON.stringify({ error: "Country not found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Pick a city for this country
      const citiesData = await supabase.from("cities").select("name").eq("country_id", country.id).eq("is_active", true).order("sort_order").limit(3).then(r => r.data ?? []);
      const mainCity = citiesData[0]?.name ?? names.cities[0];

      // Delete existing services (and their options/tiers) for this country
      const existingSvcs = await supabase.from("services").select("id").eq("country_code", country_code).then(r => r.data ?? []);
      if (existingSvcs.length > 0) {
        for (let i = 0; i < existingSvcs.length; i += 50) {
          const batch = existingSvcs.slice(i, i + 50).map(s => s.id);
          const opts = await supabase.from("service_options").select("id").in("service_id", batch).then(r => r.data ?? []);
          if (opts.length > 0) {
            await supabase.from("service_price_tiers").delete().in("option_id", opts.map(o => o.id));
            await supabase.from("service_options").delete().in("service_id", batch);
          }
          await supabase.from("services").delete().in("id", batch);
        }
      }

      // Delete old demo providers for this country
      const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const oldProviders = existingUsers?.users?.filter(u => u.email?.startsWith(`provider_${country_code.toLowerCase()}_`)) ?? [];
      for (const u of oldProviders) {
        await supabase.from("user_roles").delete().eq("user_id", u.id);
        await supabase.from("profiles").delete().eq("user_id", u.id);
        await supabase.auth.admin.deleteUser(u.id);
      }

      // Create 16 unique providers (one per category)
      const providerMap: Record<string, string> = {}; // slug -> provider_id
      let providerIndex = 0;

      for (const catSlug of CATEGORY_SLUGS) {
        const cat = categories.find(c => c.slug === catSlug);
        if (!cat) continue;

        const fName = names.firstNames[providerIndex % names.firstNames.length];
        const lName = names.lastNames[providerIndex % names.lastNames.length];
        const fullName = `${fName} ${lName}`;
        const bizNames = CATEGORY_BIZ[catSlug] ?? ["خدمات"];
        const cityName = names.cities[providerIndex % names.cities.length];
        const phonePrefix = names.phones[providerIndex % names.phones.length];
        const phone = `${phonePrefix}${String(1000000 + providerIndex).slice(1)}`;
        const bizName = `${bizNames[providerIndex % bizNames.length]} - ${cityName}`;

        const email = `provider_${country_code.toLowerCase()}_${catSlug}@demo.afrahi.com`;

        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
          email,
          password: "Demo@12345!",
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            user_type: "provider",
            phone,
            city: cityName,
            country_code,
          },
        });

        if (authErr || !authData?.user) {
          console.error(`Failed to create provider ${email}:`, authErr?.message);
          continue;
        }

        const userId = authData.user.id;
        providerMap[catSlug] = userId;

        // Update profile with business details
        await supabase.from("profiles").update({
          business_name: bizName,
          phone,
          city: cityName,
          country_code,
          business_address: `شارع الرئيسي، ${cityName}`,
        }).eq("user_id", userId);

        providerIndex++;
      }

      // Create one service per category per provider
      let created = 0;
      for (const catSlug of CATEGORY_SLUGS) {
        const cat = categories.find(c => c.slug === catSlug);
        if (!cat) continue;
        const providerId = providerMap[catSlug];
        if (!providerId) continue;

        const bizNames = CATEGORY_BIZ[catSlug] ?? ["خدمات"];
        const catLabel = CAT_LABEL[catSlug] ?? "الأفراح";
        const catIndex = CATEGORY_SLUGS.indexOf(catSlug);
        const cityName = names.cities[catIndex % names.cities.length];
        const title = `${bizNames[0]} - ${cityName}`;
        const description = (CAT_DESCRIPTIONS[catSlug]?.[0] ?? `نقدم أفضل خدمات ${catLabel}`) + ` نحن في ${cityName}، ${country.name} ونسعد بخدمتكم.`;

        const baseOpts = CAT_OPTIONS[catSlug] ?? [];
        const minPrice = baseOpts.length > 0 ? Math.min(...baseOpts.flatMap(o => o.tiers.map(t => t.price))) : 300;
        const maxPrice = baseOpts.length > 0 ? Math.max(...baseOpts.flatMap(o => o.tiers.map(t => t.price))) : 3000;

        const { data: svcRow } = await supabase.from("services").insert({
          provider_id: providerId,
          category_id: cat.id,
          title,
          description,
          city: cityName,
          country_code,
          price_min: minPrice,
          price_max: maxPrice,
          is_active: true,
          is_approved: true,
          deposit_percent: [10, 15, 20, 25][catIndex % 4],
          discount_percent: catIndex % 5 === 0 ? 10 : 0,
        }).select("id").single();

        if (svcRow && baseOpts.length > 0) {
          for (let oi = 0; oi < baseOpts.length; oi++) {
            const opt = baseOpts[oi];
            const { data: optRow } = await supabase.from("service_options").insert({
              service_id: svcRow.id,
              name: opt.name,
              description: opt.desc,
              sort_order: oi,
            }).select("id").single();
            if (optRow) {
              for (const t of opt.tiers) {
                await supabase.from("service_price_tiers").insert({
                  option_id: optRow.id,
                  min_quantity: t.min,
                  max_quantity: t.max,
                  price_per_unit: t.price,
                });
              }
            }
          }
        }
        created++;
      }

      return new Response(JSON.stringify({
        success: true,
        country: country_code,
        providers_created: Object.keys(providerMap).length,
        services_created: created,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: seed_all - seed all countries except SA
    if (action === "seed_all") {
      const results: Record<string, unknown> = {};
      const countryCodes = Object.keys(COUNTRY_NAMES);
      for (const code of countryCodes) {
        if (code === "SA") continue; // skip SA
        try {
          const innerReq = new Request("http://localhost", {
            method: "POST",
            body: JSON.stringify({ action: "seed_country", country_code: code }),
          });
          // Call self inline
          const names = COUNTRY_NAMES[code];
          if (!names) { results[code] = { error: "Unknown" }; continue; }
          
          const categories = await supabase.from("categories").select("id, slug").then(r => r.data ?? []);
          const countryData = await supabase.from("countries").select("id, code, name, currency_symbol, dial_code").eq("code", code).single().then(r => r.data);
          if (!countryData) { results[code] = { error: "Not found" }; continue; }

          // Just record that we need to call individually
          results[code] = { status: "needs_individual_call" };
        } catch (e) {
          results[code] = { error: e.message };
        }
      }
      return new Response(JSON.stringify({ message: "Use seed_country for each country individually", countries: Object.keys(COUNTRY_NAMES).filter(c => c !== "SA") }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'seed_country' with country_code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
