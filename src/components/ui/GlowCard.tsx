import React, { ReactNode } from 'react';

// 情報やログのブロック全体を囲むコンポーネント。光が漏れるような立体感を持たせる。
interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

const GlowCard: React.FC<GlowCardProps> = ({ children, className = '' }) => {
  return (
    // 背景の深みと、光で浮かんでいるような視覚効果を狙う
    <div 
      className={`p-6 bg-black/5 backdrop-blur-sm border border-neon-pink/30 shadow-2xl shadow-neon-glow ${className}`}
    >
      {children}
    </div>
  );
};

export default GlowCard;
