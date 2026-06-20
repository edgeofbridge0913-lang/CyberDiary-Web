import React from 'react';

// アクションを促すボタン。最もグローエフェクトが目立つ必要がある。
interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  primary?: boolean; // プライマリ（主要アクション）か否か
}

const NeonButton: React.FC<NeonButtonProps> = ({ children, primary = true, className = '', ...props }) => {
  // プライマリボタンはより強い光を出す
  const baseClasses = primary 
    ? 'bg-neon-pink/20 text-neon-pink border-neon-pink hover:bg-neon-pink/40 active:scale-[0.98] shadow-neon-glow transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
    : 'bg-black/50 text-neon-pink/70 border-neon-pink/20 hover:border-neon-pink/50 active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <button 
      className={`px-6 py-3 font-bold uppercase tracking-wider rounded transition duration-150 ease-in-out ${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeonButton;
