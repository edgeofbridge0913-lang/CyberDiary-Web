'use client';

import Link from 'next/link';
import { useMemo, useState, useCallback } from 'react';
import GlowCard from '../../components/ui/GlowCard';
import NeonButton from '../../components/ui/NeonButton';
import { DiaryLog } from '../../data/types';
import { useLocalStorage } from '../../utils/useLocalStorage';

const starterLogs: DiaryLog[] = [
  {
    id: 'seed-1',
    timestamp_utc: 1749826200000,
    recorded_at: '06-13 18:30',
    title: '夜のシグナル受信',
    content: '街のネオンが反応し、思考のログが少しだけ整理された。AIオペレーターは静かな警告を返した。',
    ai_analysis: {
      comment: '思考負荷は安定。次のサイクルへ移行せよ。',
      type: 'feedback',
      processed_at: 1749826200000,
    },
    summary: {
      text: 'ネオンの反応に合わせて、記録の整理が進んだ夜。',
      confidence_score: 0.92,
    },
    metadata: {
      characters: ['AIオペレーター'],
      tags: ['夜', '分析'],
      keywords_extracted: ['ネオン', 'シグナル', '整理'],
    },
  },
];

export default function MainPage() {
  const [logs, setLogs] = useLocalStorage<DiaryLog[]>('cyber-diary-logs', starterLogs);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [characterInput, setCharacterInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const aiReply = useMemo(() => {
    if (!draftContent.trim()) {
      return '記録を入力すると、AIオペレーターが解析結果を返す。';
    }

    if (draftContent.length > 120) {
      return '感情変動が観測された。重要キーワードを抽出して記録を最適化する。';
    }

    return '記録内容は安定。次のログ更新に進める。';
  }, [draftContent]);

  const generateKeywords = (text: string) =>
    text
      .split(/\s+/)
      .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter(Boolean)
      .slice(0, 5);

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const fallbackAiAnalysis = (text: string) => {
    if (/不安|疲|悲|怒|警告|危険|痛/i.test(text)) {
      return { comment: '[WARN] 感情変動値が閾値超過。自己診断を推奨する。', type: 'warning' as const };
    }
    if (/誰|いつ|どこ|どんな|検索|会話/i.test(text)) {
      return { comment: 'クエリ補完モード。メタデータ拡張で検索精度を上げられる。', type: 'query' as const };
    }
    return { comment: 'ログ同期完了。分析結果は安定領域にある。', type: 'feedback' as const };
  };

  const fetchAiAnalysis = useCallback(async (title: string, content: string) => {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.comment === 'string' ? data.comment : null;
    } catch {
      return null;
    }
  }, []);

  const handleSave = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;

    const now = Date.now();
    const keywords = generateKeywords(draftContent.trim());
    const tags = parseList(tagInput);
    const characters = parseList(characterInput);

    setAiLoading(true);
    const llmComment = await fetchAiAnalysis(draftTitle.trim(), draftContent.trim());
    setAiLoading(false);

    const ai = llmComment
      ? { comment: llmComment, type: 'feedback' as const }
      : fallbackAiAnalysis(draftContent.trim());

    if (editingId) {
      setLogs(
        logs.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                title: draftTitle.trim(),
                content: draftContent.trim(),
                recorded_at: new Date(now).toLocaleString('ja-JP', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                timestamp_utc: now,
                ai_analysis: {
                  comment: ai.comment,
                  type: ai.type,
                  processed_at: now,
                },
                summary: {
                  text: `${draftTitle.trim()} — ${ai.type === 'warning' ? '警告' : '分析'}を反映した更新ログ。`,
                  confidence_score: ai.type === 'warning' ? 0.82 : 0.91,
                },
                metadata: {
                  characters: characters.length ? characters : entry.metadata.characters.length ? entry.metadata.characters : ['ユーザー'],
                  tags: tags.length ? tags : entry.metadata.tags.length ? entry.metadata.tags : ['更新'],
                  keywords_extracted: keywords,
                },
              }
            : entry,
        ),
      );
    } else {
      const entry: DiaryLog = {
        id: `entry-${now}`,
        timestamp_utc: now,
        recorded_at: new Date(now).toLocaleString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        title: draftTitle.trim(),
        content: draftContent.trim(),
        ai_analysis: {
          comment: ai.comment,
          type: ai.type,
          processed_at: now,
        },
        summary: {
          text: `${draftTitle.trim()} — ${ai.type === 'warning' ? '警告' : '分析'}を反映した新規ログ。`,
          confidence_score: ai.type === 'warning' ? 0.82 : 0.91,
        },
        metadata: {
          characters: characters.length ? characters : ['ユーザー'],
          tags: tags.length ? tags : ['新規', '日記'],
          keywords_extracted: keywords,
        },
      };

      setLogs([entry, ...logs]);
    }

    setDraftTitle('');
    setDraftContent('');
    setTagInput('');
    setCharacterInput('');
    setEditingId(null);
  };

  const startEdit = (entry: DiaryLog) => {
    setDraftTitle(entry.title);
    setDraftContent(entry.content);
    setTagInput(entry.metadata.tags.join(', '));
    setCharacterInput(entry.metadata.characters.join(', '));
    setEditingId(entry.id);
  };

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraftTitle('');
      setDraftContent('');
      setTagInput('');
      setCharacterInput('');
    }
  };

  const filteredLogs = logs.filter((entry) => {
    const search = query.toLowerCase();
    return [entry.title, entry.content, entry.metadata.tags.join(' '), entry.metadata.characters.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  const cancelEdit = () => {
    setEditingId(null);
    setDraftTitle('');
    setDraftContent('');
    setTagInput('');
    setCharacterInput('');
  };

  return (
    <section className="space-y-8">
      <GlowCard className="rounded-3xl border border-neon-pink/40 bg-black/70 shadow-neon-pink">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-neon-pink/70">CYBERDIARY / ACTIVE LOG STREAM</p>
            <h1 className="text-3xl font-black tracking-[0.25em] text-[#ff7ab6] md:text-4xl">AI日記アプリの起動画面</h1>
            <p className="max-w-2xl text-sm text-pink-100/80 md:text-base">
              LocalStorage に保存されるサイバーパンク風の日記を、ネオン色のUIで管理します。
            </p>
          </div>
          <div className="rounded-2xl border border-neon-pink/30 bg-neon-pink/10 p-4 text-sm text-pink-100/90 shadow-neon-glow">
            <p className="uppercase tracking-[0.25em] text-neon-pink/70">AI OPERATOR</p>
            <p className="mt-2">{aiReply}</p>
          </div>
        </div>
      </GlowCard>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <GlowCard className="rounded-3xl border border-neon-pink/30 bg-black/70">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neon-pink/70">NEW ENTRY</p>
              <h2 className="mt-2 text-xl font-semibold text-[#ff7ab6]">記録を追加</h2>
            </div>
            <span className="rounded-full border border-neon-pink/30 bg-neon-pink/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pink-100/90">LocalStorage</span>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm text-pink-100/90">
              <span>タイトル</span>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full rounded-2xl border border-neon-pink/30 bg-black/80 px-4 py-3 text-pink-100 outline-none transition focus:border-neon-pink focus:shadow-neon-pink"
                placeholder="例: 夕方のログ"
              />
            </label>

            <label className="block space-y-2 text-sm text-pink-100/90">
              <span>内容</span>
              <textarea
                rows={6}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full rounded-2xl border border-neon-pink/30 bg-black/80 px-4 py-3 text-pink-100 outline-none transition focus:border-neon-pink focus:shadow-neon-pink"
                placeholder="今日の気分や出来事を書き込む…"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm text-pink-100/90">
                <span>タグ（カンマ区切り）</span>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full rounded-2xl border border-neon-pink/30 bg-black/80 px-4 py-3 text-pink-100 outline-none transition focus:border-neon-pink focus:shadow-neon-pink"
                  placeholder="例: 仕事, 夕焼け"
                />
              </label>

              <label className="block space-y-2 text-sm text-pink-100/90">
                <span>登場人物</span>
                <input
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  className="w-full rounded-2xl border border-neon-pink/30 bg-black/80 px-4 py-3 text-pink-100 outline-none transition focus:border-neon-pink focus:shadow-neon-pink"
                  placeholder="例: AIオペレーター, 友人"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NeonButton type="button" onClick={handleSave} disabled={aiLoading}>
                {aiLoading ? 'AI解析中…' : editingId ? 'ログを更新' : 'ログを保存'}
              </NeonButton>
              {editingId && !aiLoading ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full border border-neon-pink/30 bg-black/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-pink-100/90 transition hover:border-neon-pink hover:text-[#ff7ab6]"
                >
                  編集をやめる
                </button>
              ) : null}
              {aiLoading ? (
                <span className="animate-pulse text-xs uppercase tracking-[0.25em] text-neon-pink/70">
                  [OLLAMA] 記録を解析中...
                </span>
              ) : (
                <span className="text-xs uppercase tracking-[0.25em] text-neon-pink/70">Stored: {logs.length} entries</span>
              )}
            </div>
          </div>
        </GlowCard>

        <GlowCard className="rounded-3xl border border-neon-pink/30 bg-black/70">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-pink/70">SYSTEM STATUS</p>
          <h2 className="mt-2 text-xl font-semibold text-[#ff7ab6]">AI分析サマリー</h2>
          <ul className="mt-6 space-y-4 text-sm text-pink-100/90">
            <li className="rounded-2xl border border-neon-pink/20 bg-neon-pink/5 p-4">記録は LocalStorage に自動保存され、ページ更新後も保持されます。</li>
            <li className="rounded-2xl border border-neon-pink/20 bg-neon-pink/5 p-4">今後は AI による自然言語検索とタグ補完を拡張できます。</li>
            <li className="rounded-2xl border border-neon-pink/20 bg-neon-pink/5 p-4">メタデータを増やすことで、登場人物やキーワード検索に対応できます。</li>
          </ul>
        </GlowCard>
      </div>

      <GlowCard className="rounded-3xl border border-neon-pink/30 bg-black/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neon-pink/70">TIMELINE</p>
            <h2 className="mt-2 text-xl font-semibold text-[#ff7ab6]">ログ一覧</h2>
          </div>
          <label className="w-full max-w-md space-y-2 text-xs uppercase tracking-[0.25em] text-pink-100/80 md:text-sm">
            <span>SEARCH</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトル・タグ・人物で検索"
              className="w-full rounded-2xl border border-neon-pink/30 bg-black/80 px-4 py-3 text-pink-100 outline-none transition focus:border-neon-pink focus:shadow-neon-pink"
            />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="rounded-3xl border border-neon-pink/20 bg-black/70 p-5 text-sm text-pink-100/80">
              検索条件に一致するログはありません。別のキーワードで試してください。
            </div>
          ) : null}

          {filteredLogs.map((entry) => (
            <article key={entry.id} className="rounded-3xl border border-neon-pink/30 bg-black/80 p-5 shadow-neon-glow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neon-pink/70">{entry.recorded_at}</p>
                  <Link
                    href={`/diary/${entry.id}`}
                    className="mt-1 inline-block text-lg font-semibold text-[#ff7ab6] transition hover:text-pink-100"
                  >
                    {entry.title}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/diary/${entry.id}`}
                    className="rounded-full border border-neon-pink/30 bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-pink-100/90 transition hover:border-neon-pink hover:text-[#ff7ab6]"
                  >
                    詳細
                  </Link>
                  <span className="rounded-full border border-neon-pink/30 bg-neon-pink/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-pink-100/90">{entry.metadata.tags[0] || 'GENERAL'}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    className="rounded-full border border-neon-pink/30 bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-pink-100/90 transition hover:border-neon-pink hover:text-[#ff7ab6]"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20"
                  >
                    削除
                  </button>
                </div>
              </div>
              <p className="mt-4 text-sm text-pink-100/90">{entry.content}</p>
              {entry.ai_analysis ? (
                <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/5 p-3 text-xs uppercase tracking-[0.2em] text-pink-100/80">
                  {entry.ai_analysis.comment}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </GlowCard>
    </section>
  );
}
