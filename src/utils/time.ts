/**
 * 有効期限の文字列を解析してミリ秒に変換する
 * @param expiry 有効期限の文字列
 */
export function parseExpiry(expiry: string): number | null {
  if (expiry === 'once') {
    return 0; // 即時失効
  }

  if (expiry === 'session') {
    return 24 * 60 * 60 * 1000; // 24時間
  }

  // パターンマッチング（例: "30m", "2h", "7d"）
  const match = expiry.match(/^(\d+)([mhd])$/);
  if (match) {
    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 'm': // 分
        return numValue * 60 * 1000;
      case 'h': // 時間
        return numValue * 60 * 60 * 1000;
      case 'd': // 日
        return numValue * 24 * 60 * 60 * 1000;
    }
  }

  return null;
}

/**
 * ミリ秒を人間が読みやすい形式に変換する
 * @param ms ミリ秒
 */
export function formatDuration(ms: number): string {
  if (ms === 0) {
    return 'once';
  }

  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));

  if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'less than 1m';
  }
}

/**
 * 有効期限が切れているかどうかを確認する
 * @param expiresAt 有効期限のタイムスタンプ
 */
export function isExpired(expiresAt: number | undefined): boolean {
  if (expiresAt === undefined) {
    return false;
  }
  return expiresAt < Date.now();
}

/**
 * 相対的な時間を計算する
 * @param timestamp タイムスタンプ
 */
export function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else {
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  }
}