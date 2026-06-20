export interface AIAnalysis {
  comment: string;
  type: 'feedback' | 'warning' | 'query';
  processed_at: number;
}

export interface DiarySummary {
  text: string;
  confidence_score: number;
}

export interface DiaryLog {
  id: string;
  timestamp_utc: number;
  recorded_at: string;
  title: string;
  content: string;
  ai_analysis?: AIAnalysis;
  summary?: DiarySummary;
  metadata: {
    characters: string[];
    tags: string[];
    keywords_extracted?: string[];
  };
}

export interface DiaryStore {
  diaryLogs: DiaryLog[];
  lastUpdated: number;
}
