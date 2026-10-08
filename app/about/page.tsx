import Link from "next/link"
import type { Metadata } from "next"
import InfoPage from "../components/InfoPage"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา | rod2buy",
  description: "rod2buy marketplace รถมือสองไทย — ข้อมูลครบ ตรวจสอบได้ ติดต่อง่าย",
}

export default function AboutPage() {
  return (
    <InfoPage
      title="เกี่ยวกับ rod2buy"
      subtitle="ซื้อรถเหมือนเล่นเกม — แต่เรื่องความปลอดภัยเราจริงจัง"
      sections={[
        {
          title: "เราคือใคร",
          body: (
            <p>
              rod2buy (รถ + to buy / &quot;บาย&quot; ที่แปลว่าจับในภาษาอีสาน) คือตลาดซื้อขายรถมือสองระหว่างบุคคล
              ที่ออกแบบให้ใช้ง่ายบนมือถือ ข้อมูลครบ และช่วยให้ผู้ซื้อตัดสินใจได้อย่างมั่นใจ
            </p>
          ),
        },
        {
          title: "เราตรวจสอบอะไรบ้าง",
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>ทุกประกาศผ่านการตรวจโดยทีมงานก่อนแสดง รวมถึงรูปสมุดทะเบียนรถ</li>
              <li>ผู้ขายยืนยันตัวตนด้วยบัตรประชาชนได้ (ได้รับ badge ยืนยันตัวตน)</li>
              <li>รีวิวผู้ขายเขียนได้เฉพาะผู้ที่ติดต่อผู้ขายจริงเท่านั้น</li>
              <li>ผู้ใช้แจ้งประกาศน่าสงสัยได้ ทีมงานระงับประกาศได้ทันที</li>
            </ul>
          ),
        },
        {
          title: "สิ่งที่เราไม่ได้ทำ",
          body: (
            <p>
              rod2buy เป็นพื้นที่ให้ผู้ซื้อและผู้ขายพบกัน เราไม่ได้เป็นเจ้าของรถ ไม่รับชำระเงินแทน และไม่ได้ตรวจสภาพรถด้วยตนเอง
              ผู้ซื้อควรตรวจรถและเอกสารก่อนชำระเงินทุกครั้ง — อ่าน{" "}
              <Link href="/safety" className="text-amber-600 underline">วิธีซื้อรถมือสองอย่างปลอดภัย</Link>
            </p>
          ),
        },
        {
          title: "ติดต่อเรา",
          body: (
            <p>
              อีเมล{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-600 underline">{CONTACT_EMAIL}</a>
              <br />
              พบประกาศน่าสงสัย กดปุ่ม &quot;แจ้งประกาศน่าสงสัย&quot; ในหน้าประกาศได้เลย
            </p>
          ),
        },
      ]}
    />
  )
}
