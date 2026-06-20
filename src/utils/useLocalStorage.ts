import { useCallback, useEffect, useState } from 'react';

/**
 * ローカルストレージと連動するカスタムステートフック。
 * データを安全に初期化・更新し、ページ再読み込み後も状態を保持します。
 * ハイドレーションミスマッチを防ぐため、初回描画は常に initialValue を使用し、
 * マウント後に LocalStorage の実値を同期します。
 * @param key - ローカルストレージのキー
 * @param initialValue - 初期値（ローカルストレージに値が存在しない場合に使用）
 * @returns 現在の状態とステートセッター関数
 */
export const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
  // 初回描画は常に initialValue (ハイドレーションミスマッチ防止)
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // マウント後に LocalStorage の実値で上書き
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);


  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      }

      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
};
