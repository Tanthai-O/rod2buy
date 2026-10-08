import { z } from "zod"

const CURRENT_YEAR = new Date().getFullYear()

export const listingSchema = z.object({
  brand: z.string().min(1, "กรุณาเลือกยี่ห้อรถ"),
  model: z.string().min(1, "กรุณาระบุรุ่นรถ").max(100, "ชื่อรุ่นยาวเกินไป"),
  year: z
    .number()
    .int()
    .min(1990, "ปีต้องไม่ต่ำกว่า 1990")
    .max(CURRENT_YEAR, `ปีต้องไม่เกิน ${CURRENT_YEAR}`),
  color: z.string().max(50).optional(),
  mileage: z
    .number()
    .int()
    .min(0, "เลขไมล์ต้องไม่ติดลบ")
    .max(1_000_000, "เลขไมล์เกินขอบเขต"),
  fuel_type: z.enum(["petrol", "diesel", "hybrid", "electric", "ngv"]),
  transmission: z.enum(["auto", "manual"]),
  price: z
    .number()
    .int()
    .min(10_000, "ราคาต้องไม่ต่ำกว่า 10,000 บาท")
    .max(50_000_000, "ราคาสูงเกินขอบเขต"),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  description: z.string().max(5_000, "รายละเอียดยาวเกินไป").optional(),

  // Structured specs (migration 005)
  variant: z.string().max(100, "ชื่อรุ่นย่อยยาวเกินไป").optional(),
  body_type: z.enum(
    ["sedan", "hatchback", "pickup", "suv", "ppv", "mpv", "van", "coupe", "convertible", "wagon"],
    { message: "กรุณาเลือกประเภทรถ" }
  ),
  cab_type: z.enum(["single", "extended", "double"]).optional(),
  engine_cc: z.number().int().min(50, "ขนาดเครื่องยนต์ไม่ถูกต้อง").max(10_000, "ขนาดเครื่องยนต์ไม่ถูกต้อง").optional(),
  drivetrain: z.enum(["2wd", "4wd", "awd"]).optional(),
  seats: z.number().int().min(1).max(16).optional(),
  seller_type: z.enum(["private", "dealer"]).default("private"),
  district: z.string().max(100).optional(),

  // Document & history
  num_owners: z.number().int().min(1).max(10).default(1),
  finance_status: z.enum(["clear", "financing", "paid_off"]).default("clear"),
  accident_history: z.enum(["none", "minor", "major"]).default("none"),
  flood_damage: z.boolean().default(false),
  chassis_number: z.string().max(50).optional(),
  registration_province: z.string().max(100).optional(),
  tax_expiry: z.string().optional(),
}).refine((d) => d.body_type === "pickup" || !d.cab_type, {
  message: "ประเภทแคปใช้ได้กับรถกระบะเท่านั้น",
  path: ["cab_type"],
})

export type ListingInput = z.infer<typeof listingSchema>

export const profileSchema = z.object({
  display_name: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^[0-9\-\s+]*$/, "หมายเลขโทรศัพท์ไม่ถูกต้อง")
    .max(20)
    .optional(),
  line_id: z.string().max(50).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
