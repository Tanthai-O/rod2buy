import type { Metadata } from "next"
import SellForm from "./_components/SellForm"

export const metadata: Metadata = {
  title: "ลงประกาศขายรถ | rod2buy",
  description: "ลงประกาศขายรถมือสองง่ายๆ ฟรี ไม่มีค่าใช้จ่าย",
}

export default function SellPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">ลงประกาศขายรถ</h1>
          <p className="text-sm text-zinc-500 mt-1">
            กรอกรายละเอียดให้ครบเพื่อเพิ่มโอกาสในการขาย
          </p>
        </header>
        <SellForm />
      </div>
    </main>
  )
}
