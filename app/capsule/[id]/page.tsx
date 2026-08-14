import { CapsuleDetail } from "@/components/CapsuleDetail";

export default async function CapsulePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
      <main className="w-full max-w-md rounded-3xl border border-amber-100/80 bg-white/90 p-12 text-center shadow-[0_20px_50px_-20px_rgba(120,80,40,0.25)]">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
          캡슐 상세
        </h1>
        <CapsuleDetail id={id} />
      </main>
    </div>
  );
}
