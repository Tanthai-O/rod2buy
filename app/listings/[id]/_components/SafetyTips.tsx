import Link from "next/link"

export default function SafetyTips() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        ซื้อขายอย่างปลอดภัย
      </p>
      <ul className="mt-2 space-y-1 text-xs text-amber-900/80 list-disc pl-5">
        <li>อย่าโอนเงินมัดจำก่อนได้เห็นรถและเล่มทะเบียนตัวจริง</li>
        <li>ตรวจเลขตัวถัง/เลขเครื่องให้ตรงกับเล่ม และเช็กชื่อผู้ครอบครองในเล่ม</li>
        <li>นัดดูรถในที่สาธารณะ และโอนกรรมสิทธิ์ที่ขนส่งพร้อมกัน</li>
      </ul>
      <Link href="/safety" className="inline-block mt-2 text-xs font-medium text-amber-800 underline hover:text-amber-950">
        อ่านวิธีเช็กรถและป้องกันมิจฉาชีพ →
      </Link>
    </div>
  )
}
