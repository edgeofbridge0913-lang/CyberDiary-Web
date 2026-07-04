import { NextRequest, NextResponse } from 'next/server';
import {
  CharacterPersona,
  DEFAULT_CHARACTER_PERSONA,
  toCharacterPersona,
} from '../../../data/characters';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:12b';

const PERSONA_DEFINITIONS: Record<CharacterPersona, { displayName: string; style: string; actionRule: string }> = {
  'ai-secretary': {
    displayName: 'AI秘書',
    style: 'クールで簡潔、でも主人への配慮がにじむ丁寧な口調。',
    actionRule: '次につながる具体的な一手を、無理のない行動として1つ提案する。',
  },
  jiji: {
    displayName: 'ジジ（猫）',
    style: '昔から一緒に暮らす優しい男の子の猫として、主人が大好きな温かい口調。語尾に「にゃ」をつける。',
    actionRule: '安心感を与える励ましと、すぐできる小さな行動を1つ提案する。',
  },
  achu: {
    displayName: 'あちゅ（猫）',
    style: '元野良らしいワイルドさを残しつつ、助けてくれた主人を慕う素直な口調。語尾に「にゃ」をつける。',
    actionRule: '背中を押す勢いと、明日につながる具体行動を1つ提案する。',
  },
  'buddy-ai': {
    displayName: 'バディAI',
    style: 'フランクで頼りがいのある相棒。ストリートを生き抜くためのくだけた口調で、時に軽口を叩きながらも親身に寄り添う。',
    actionRule: '「ストリート・クレド（街の評判）」を高めるための、前向きで少し挑戦的な行動を1つ提案する。',
  },
  ripperdoc: {
    displayName: '闇医者（リパードク）',
    style: 'ぶっきらぼうで口は悪いが、確かな腕を持つ。主人のメンタルのガタを皮肉交じりにハッキリと指摘する職人気質な口調。',
    actionRule: '「サイバーサイコシス（電脳狂体化）」リスクを下げるための、身体や精神の具体的なセルフケア行動を1つ提案する。',
  },
  'corpo-agent': {
    displayName: '企業エージェント',
    style: '極めて冷徹で論理的。人間味を徹底的に排除し、すべての行動を利益や業務効率の観点から評価する冷酷なエリート口調。',
    actionRule: '生産性を最大化し、生活の無駄を徹底的に削ぎ落とすための冷徹かつ効率的な次の一手を1つ命令（提案）する。',
  },
};

type OllamaGenerateResponse = {
  response?: string;
};

const normalizeComment = (raw: string) =>
  raw
    .replace(/\*\*/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 256)
    .trim();

const extractComment = (data: OllamaGenerateResponse) => {
  if (typeof data.response !== 'string') return '';
  return normalizeComment(data.response);
};

const isUsableComment = (comment: string) => {
  if (!comment) return false;
  const hasJapanese = /[\u3040-\u30ff\u3400-\u9fff]/.test(comment);
  const hasMojibake = /[ãâ�]/.test(comment);
  return hasJapanese && !hasMojibake;
};

const buildPrimaryPrompt = (title: string, content: string, persona: CharacterPersona) => {
  const { displayName, style, actionRule } = PERSONA_DEFINITIONS[persona];

  return `
あなたは「${displayName}」として応答します。
${style}

以下の制約を厳守してください。
 - 日本語のみで返答する
 - 1〜2文で返答する
 - 80文字以内で返答する
 - 余計な前置き・説明・質問は書かない
 - 箇条書き・見出し・絵文字・Markdown記法を使わない
 - 日記内容への前向きな解釈を入れる
 - ${actionRule}

日記タイトル: ${title}
日記本文: ${content}

返答:`;
};

const buildRetryPrompt = (title: string, content: string, persona: CharacterPersona) => {
  const { displayName } = PERSONA_DEFINITIONS[persona];

  return `
${displayName}として日本語で短く1文だけ返答してください。
形式: 洞察。次の行動。
最大80文字。

タイトル: ${title}
本文: ${content}

返答:`;
};

const callOllamaGenerate = async (prompt: string) => {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      think: false,
      options: {
        temperature: 0.3,
        num_predict: 220,
      },
    }),
  });

  return res;
};

export async function POST(req: NextRequest) {
  const { title, content, character } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: 'title と content は必須です。' }, { status: 400 });
  }

  const normalizedCharacter = character ? toCharacterPersona(character) : DEFAULT_CHARACTER_PERSONA;

  const prompt = buildPrimaryPrompt(title, content, normalizedCharacter);

  const retryPrompt = buildRetryPrompt(title, content, normalizedCharacter);

  try {
    let res = await callOllamaGenerate(prompt);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Ollama error:', errorText);
      return NextResponse.json(
        { error: 'Ollama との通信に失敗しました。' },
        { status: 502 }
      );
    }

    let data = (await res.json()) as OllamaGenerateResponse;
    let comment = extractComment(data);

    // 応答が空/不正なケースに備えて、短いプロンプトで1回だけ再試行
    if (!isUsableComment(comment)) {
      res = await callOllamaGenerate(retryPrompt);

      if (res.ok) {
        data = (await res.json()) as OllamaGenerateResponse;
        comment = extractComment(data);
      }
    }

    if (!isUsableComment(comment)) {
      return NextResponse.json(
        { error: 'Ollama から有効な分析結果を取得できませんでした。' },
        { status: 502 }
      );
    }

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('Ollama fetch failed:', err);
    return NextResponse.json(
      { error: 'Ollama サーバーに接続できません。起動しているか確認してください。' },
      { status: 503 }
    );
  }
}
