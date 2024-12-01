import Image from "next/image";

export default function Home() {
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 140px)" }}>
      <Image
        src="/bg.png"
        alt="Background"
        fill
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
