export const CAR_BRANDS = [
  "Toyota",
  "Honda",
  "Isuzu",
  "Ford",
  "Mazda",
  "Mitsubishi",
  "Nissan",
  "Chevrolet",
  "Suzuki",
  "Subaru",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "MG",
  "BYD",
  "Tesla",
  "Volvo",
  "Kia",
  "Hyundai",
]

export const PROVINCES = [
  "กรุงเทพมหานคร",
  "กระบี่",
  "กาญจนบุรี",
  "กาฬสินธุ์",
  "กำแพงเพชร",
  "ขอนแก่น",
  "จันทบุรี",
  "ฉะเชิงเทรา",
  "ชลบุรี",
  "ชัยนาท",
  "ชัยภูมิ",
  "ชุมพร",
  "เชียงราย",
  "เชียงใหม่",
  "ตรัง",
  "ตราด",
  "ตาก",
  "นครนายก",
  "นครปฐม",
  "นครพนม",
  "นครราชสีมา",
  "นครศรีธรรมราช",
  "นครสวรรค์",
  "นนทบุรี",
  "นราธิวาส",
  "น่าน",
  "บึงกาฬ",
  "บุรีรัมย์",
  "ปทุมธานี",
  "ประจวบคีรีขันธ์",
  "ปราจีนบุรี",
  "ปัตตานี",
  "พระนครศรีอยุธยา",
  "พะเยา",
  "พังงา",
  "พัทลุง",
  "พิจิตร",
  "พิษณุโลก",
  "เพชรบุรี",
  "เพชรบูรณ์",
  "แพร่",
  "ภูเก็ต",
  "มหาสารคาม",
  "มุกดาหาร",
  "แม่ฮ่องสอน",
  "ยโสธร",
  "ยะลา",
  "ร้อยเอ็ด",
  "ระนอง",
  "ระยอง",
  "ราชบุรี",
  "ลพบุรี",
  "ลำปาง",
  "ลำพูน",
  "เลย",
  "ศรีสะเกษ",
  "สกลนคร",
  "สงขลา",
  "สตูล",
  "สมุทรปราการ",
  "สมุทรสงคราม",
  "สมุทรสาคร",
  "สระแก้ว",
  "สระบุรี",
  "สิงห์บุรี",
  "สุโขทัย",
  "สุพรรณบุรี",
  "สุราษฎร์ธานี",
  "สุรินทร์",
  "หนองคาย",
  "หนองบัวลำภู",
  "อ่างทอง",
  "อำนาจเจริญ",
  "อุดรธานี",
  "อุตรดิตถ์",
  "อุทัยธานี",
  "อุบลราชธานี",
]

export const FUEL_TYPES = [
  { value: "petrol", label: "เบนซิน" },
  { value: "diesel", label: "ดีเซล" },
  { value: "hybrid", label: "ไฮบริด" },
  { value: "electric", label: "ไฟฟ้า" },
  { value: "ngv", label: "NGV" },
]

export const FUEL_LABELS: Record<string, string> = {
  petrol: "เบนซิน",
  diesel: "ดีเซล",
  hybrid: "ไฮบริด",
  electric: "ไฟฟ้า",
  ngv: "NGV",
}

export const TRANSMISSION_LABELS: Record<string, string> = {
  auto: "อัตโนมัติ",
  manual: "ธรรมดา",
}

export const BODY_TYPES = [
  { value: "sedan", label: "เก๋ง" },
  { value: "hatchback", label: "แฮทช์แบ็ก (5 ประตู)" },
  { value: "pickup", label: "กระบะ" },
  { value: "suv", label: "SUV / ครอสโอเวอร์" },
  { value: "ppv", label: "PPV (ฟอร์จูนเนอร์, MU-X)" },
  { value: "mpv", label: "MPV / รถครอบครัว" },
  { value: "van", label: "รถตู้" },
  { value: "coupe", label: "คูเป้" },
  { value: "convertible", label: "เปิดประทุน" },
  { value: "wagon", label: "วากอน" },
] as const

export const BODY_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(BODY_TYPES.map((b) => [b.value, b.label])),
  hatchback: "แฮทช์แบ็ก",
  ppv: "PPV",
  suv: "SUV",
}

export const CAB_TYPES = [
  { value: "single", label: "ตอนเดียว" },
  { value: "extended", label: "แคป" },
  { value: "double", label: "4 ประตู" },
] as const

export const CAB_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  CAB_TYPES.map((c) => [c.value, c.label])
)

export const DRIVETRAINS = [
  { value: "2wd", label: "2WD (ขับ 2 ล้อ)" },
  { value: "4wd", label: "4WD (ขับ 4 ล้อ)" },
  { value: "awd", label: "AWD (4 ล้อตลอดเวลา)" },
] as const

export const DRIVETRAIN_LABELS: Record<string, string> = {
  "2wd": "2WD",
  "4wd": "4WD",
  awd: "AWD",
}

export const SELLER_TYPE_LABELS: Record<string, string> = {
  private: "รถบ้าน (เจ้าของขายเอง)",
  dealer: "เต็นท์ / ดีลเลอร์",
}

export const SEAT_OPTIONS = [2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

// Filter buckets (value = max cc)
export const ENGINE_CC_OPTIONS = [
  { min: "", max: "1300", label: "ไม่เกิน 1.3L" },
  { min: "1301", max: "1600", label: "1.3 – 1.6L" },
  { min: "1601", max: "2000", label: "1.6 – 2.0L" },
  { min: "2001", max: "3000", label: "2.0 – 3.0L" },
  { min: "3001", max: "", label: "มากกว่า 3.0L" },
]

// Trust filters — rod2buy collects these but competitors don't let you filter by them
export const TRUST_FILTERS = [
  { key: "one_owner", label: "มือเดียว" },
  { key: "no_accident", label: "ไม่เคยชน" },
  { key: "no_flood", label: "ไม่เคยจมน้ำ" },
  { key: "clear_finance", label: "ปลอดภาระ" },
  { key: "has_reg_book", label: "มีเล่มทะเบียน" },
] as const

const THIS_YEAR = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => THIS_YEAR - i)

export const SORT_OPTIONS = [
  { value: "", label: "ใหม่ล่าสุด" },
  { value: "price_asc", label: "ราคาต่ำ → สูง" },
  { value: "price_desc", label: "ราคาสูง → ต่ำ" },
  { value: "mileage_asc", label: "ไมล์น้อยสุด" },
  { value: "year_desc", label: "ปีใหม่สุด" },
]

export const PAGE_SIZE = 24

export const REPORT_REASONS = [
  { value: "scam", label: "น่าจะเป็นมิจฉาชีพ / หลอกโอนเงิน" },
  { value: "wrong_info", label: "ข้อมูลรถไม่ตรงความจริง" },
  { value: "sold", label: "รถขายไปแล้ว แต่ยังลงประกาศ" },
  { value: "duplicate", label: "ประกาศซ้ำ" },
  { value: "other", label: "อื่น ๆ" },
]

export const REPORT_REASON_LABELS: Record<string, string> = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label])
)

export const CAR_EVENT_TYPES = ["ซ่อม", "เปลี่ยนอะไหล่", "ตรวจสภาพ", "อุบัติเหตุ", "อื่น ๆ"]

export const PRICE_OPTIONS = [
  { value: "100000", label: "100,000" },
  { value: "200000", label: "200,000" },
  { value: "300000", label: "300,000" },
  { value: "500000", label: "500,000" },
  { value: "800000", label: "800,000" },
  { value: "1000000", label: "1,000,000" },
  { value: "1500000", label: "1,500,000" },
  { value: "2000000", label: "2,000,000" },
  { value: "3000000", label: "3,000,000" },
]
