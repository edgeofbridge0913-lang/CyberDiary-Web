'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import GlowCard from '../../../../components/ui/GlowCard';
import { normalizeCharacterLabels } from '../../../../data/characters';
import { DiaryLog } from '../../../../data/types';
import { useLocalStorage } from '../../../../utils/useLocalStorage';

export default function DiaryDetailPage({ params }: { params: { id: string } }) {
  const [logs] = useLocalStorage<DiaryLog[]>('cyber-diary-logs', []);

  const entry = useMemo(
    () => logs.find((item) => item.id === params.id),
    [logs, params.id],
  );

  const displayCharacters = useMemo(() => {
    if (!entry) return [];
    const normalized = normalizeCharacterLabels(entry.metadata.characters);
    return normalized.length ? normalized : entry.metadata.characters;
  }, [entry]);

  if (!entry) {
    return (
      <GlowCard className="rounded-3xl border border-neon-pink/30 bg-black/70 shadow-neon-glow">
        <p className="text-xs uppercase tracking-[0.35em] text-neon-pink/70">DIARY DETAIL</p>
        <h1 className="mt-3 text-2xl font-semibold text-[#ff7ab6]">Entry #{params.id}</h1>
        <p className="mt-4 text-sm text-pink-100/90">指定された日記は見つかりませんでした。</p>
      </GlowCard>
    );
  }

  return (
    <GlowCard className="rounded-3xl border border-neon-pink/30 bg-black/70 shadow-neon-glow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-neon-pink/70">DIARY DETAIL</p>
          <h1 className="mt-3 text-2xl font-semibold text-[#ff7ab6]">{entry.title}</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-neon-pink/70">{entry.recorded_at}</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-neon-pink/30 bg-black/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-pink-100/90 transition hover:border-neon-pink hover:text-[#ff7ab6]"
        >
          タイムラインへ戻る
        </Link>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-sm text-pink-100/90">{entry.content}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-neon-pink/20 bg-neon-pink/5 p-4 text-sm text-pink-100/90">
          <p className="text-xs uppercase tracking-[0.25em] text-neon-pink/70">AI ANALYSIS</p>
          <p className="mt-2">{entry.ai_analysis?.comment ?? 'AI分析はまだありません。'}</p>
        </div>
        <div className="rounded-2xl border border-neon-pink/20 bg-neon-pink/5 p-4 text-sm text-pink-100/90">
          <p className="text-xs uppercase tracking-[0.25em] text-neon-pink/70">METADATA</p>
          <p className="mt-2">タグ: {entry.metadata.tags.join(', ') || 'なし'}</p>
          <p className="mt-1">人物: {displayCharacters.join(', ') || 'なし'}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neon-pink/70">
            キーワード: {entry.metadata.keywords_extracted?.join(', ') || '未抽出'}
          </p>
        </div>
      </div>
    </GlowCard>
  );
}
