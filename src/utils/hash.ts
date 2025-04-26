/**
 * オブジェクトをハッシュ化する
 * @param obj ハッシュ化するオブジェクト
 */
export function hashObject(obj: Record<string, any>): string {
  // オブジェクトのキーをソートして一貫性を保つ
  const sortedObj = Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as Record<string, any>);

  // JSON文字列化
  const jsonString = JSON.stringify(sortedObj);

  // シンプルなハッシュ生成
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * 文字列をハッシュ化する
 * @param str ハッシュ化する文字列
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * セキュアなランダム文字列を生成する
 * @param length 文字列の長さ
 */
export function generateSecureRandom(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}