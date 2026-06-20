import React from 'react';

// コンポーネントとしてのレイアウトファイルです。
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-dark-bg text-neon-pink font-mono p-4 md:p-8">
      {/* ログ全体をラップするコンテナ。グロー効果で空間のデジタルなノイズ感を出す */} 
      <div className="max-w-6xl mx-auto relative pt-10 pb-20 border-t border-b border-[#FF3B8D]/50">
        {/* グローバルに見えるサブタイトルやシステムメッセージ用の要素 (例: ステータスバー) */}
        <header className="mb-10 text-xl tracking-widest opacity-70">
            CYBERDIARY // ACTIVE LOG STREAM <span className='text-neon-pink/50'>[SYSTEM_INIT]</span>
        </header>
        {/* ここに子コンポーネント（ログ一覧やエディタ）が配置されるエリア */}
        <main className="min-h-[60vh] relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
