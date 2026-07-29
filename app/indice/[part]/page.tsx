import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ part: string }>;
};

export default async function IndicePartPage({ params }: PageProps) {
  const { part } = await params;
  // Acepta "parte-1".."parte-4" o "1".."4"; cualquier otra cosa cae a parte-1
  const match = /^parte-(\d+)$/.exec(part) || /^(\d+)$/.exec(part);
  const num = match ? Number(match[1]) : 1;
  const finalPart = num >= 1 && num <= 4 ? `parte-${num}` : "parte-1";
  redirect(`/index.html#/indice/${finalPart}`);
}
