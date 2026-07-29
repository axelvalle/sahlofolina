import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ chapter: string }>;
};

export default async function ChapterPage({ params }: PageProps) {
  const { chapter } = await params;
  const safeChapter = /^[a-z0-9-]+$/.test(chapter) ? chapter : "cap1";
  redirect(`/index.html#/leer/${safeChapter}`);
}
