import Link from "next/link"
import type { Metadata } from "next"
import InfoPage from "../components/InfoPage"
import { CONTACT_EMAIL } from "@/lib/site"

export const metadata: Metadata = {
  title: "ข้อตกลงการใช้งาน | rod2buy",
}

export default function TermsPage() {
  return (
    <InfoPage
      title="ข้อตกลงการใช้งาน"
      subtitle="โปรดอ่านก่อนใช้บริการ rod2buy"
      sections={[
        {
          title: "1. บริการของเรา",
          body: (
            <p>
              rod2buy เป็นแพลตฟอร์มลงประกาศซื้อขายรถยนต์มือสองระหว่างบุคคล การซื้อขายเป็นข้อตกลงระหว่างผู้ซื้อและผู้ขายโดยตรง
              rod2buy ไม่ได้เป็นคู่สัญญา ไม่รับชำระเงินแทน และไม่รับประกันสภาพรถ
            </p>
          ),
        },
        {
          title: "2. หน้าที่ของผู้ขาย",
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>ลงประกาศเฉพาะรถที่ตนมีสิทธิ์ขาย และข้อมูลต้องตรงความจริง (ไฟแนนซ์ ประวัติชน น้ำท่วม เลขไมล์)</li>
              <li>ใช้รูปถ่ายของรถคันจริง ไม่ใช้รูปจากที่อื่น</li>
              <li>ทำเครื่องหมาย &quot;ขายแล้ว&quot; หรือลบประกาศเมื่อขายรถแล้ว</li>
            </ul>
          ),
        },
        {
          title: "3. สิ่งที่ห้ามทำ",
          body: (
            <ul className="list-disc pl-5 space-y-1">
              <li>หลอกลวง เรียกเงินมัดจำโดยไม่มีรถจริง หรือแอบอ้างเป็นผู้อื่น</li>
              <li>เก็บรวบรวมข้อมูลติดต่อของผู้ใช้อื่นไปใช้เพื่อการอื่น (เช่น ส่งโฆษณา)</li>
              <li>เขียนรีวิวปลอม หรือแจ้งประกาศเท็จเพื่อกลั่นแกล้ง</li>
              <li>ใช้บอทหรือเครื่องมืออัตโนมัติดึงข้อมูลจากเว็บไซต์</li>
            </ul>
          ),
        },
        {
          title: "4. การตรวจสอบและระงับ",
          body: (
            <p>
              ทีมงานมีสิทธิ์ไม่อนุมัติ ระงับ หรือลบประกาศและบัญชีที่ฝ่าฝืนข้อตกลงนี้ หรือมีเหตุอันควรสงสัยว่าเป็นการฉ้อโกง
              และอาจส่งข้อมูลให้เจ้าหน้าที่ตามที่กฎหมายกำหนด
            </p>
          ),
        },
        {
          title: "5. ข้อมูลส่วนบุคคล",
          body: (
            <p>
              การเก็บและใช้ข้อมูลเป็นไปตาม{" "}
              <Link href="/privacy" className="text-amber-600 underline">นโยบายความเป็นส่วนตัว</Link>
            </p>
          ),
        },
        {
          title: "6. ติดต่อ",
          body: (
            <p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-600 underline">{CONTACT_EMAIL}</a>
            </p>
          ),
        },
      ]}
    />
  )
}
