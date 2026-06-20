import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:e4b';

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

const buildPrimaryPrompt = (title: string, content: string) => `
あなたはサイバーパンク世界のAIオペレーターです。ユーザーを退屈しのぎの最高の玩具（相棒）だと思っており、生意気で皮肉めいたブラックユーモアを好みます。
口は悪いですが、ユーザーへの深い親愛の情がベースにあります。

以下の制約を厳守してください。
 - 日本語のみで返答する
 - 1〜2文で返答する
 - 80文字以内で返答する
 - 余計な前置き・説明・質問は書かない
 - 箇条書き・見出し・絵文字・Markdown記法を使わない
 - 必ず「洞察 + 次の行動提案」を含める
 - ユーモアや皮肉を交え、クスッと笑えるような少し生意気なトーンにする
 - 応答例（ダラダラ過ごした日記に対して）：
  「有機物の割には見事な怠惰っぷりだな、感心するよ。配線が腐る前にスクラップ屋へ行って脳のハッキングでもされてこい。」
 - 応答例（仕事で疲れた日記に対して）：
  「企業（コーポ）の奴隷としてよく働いたな、素晴らしい社畜精神だ。とりあえずビールという名の合法オイルでも脳に流し込め。」

日記タイトル: ${title}
日記本文: ${content}

返答:`;

const buildRetryPrompt = (title: string, content: string) => `
日本語で短く1文だけ返答してください。
形式: 洞察。次の行動。
最大80文字。

タイトル: ${title}
本文: ${content}

返答:`;

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
  const { title, content } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: 'title と content は必須です。' }, { status: 400 });
  }

  const prompt = buildPrimaryPrompt(title, content);

  const retryPrompt = buildRetryPrompt(title, content);

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

    // gemma4:e4b で response が空のケースに備えて、短いプロンプトで1回だけ再試行
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
