// 標準的な公立学校の時程を仮の初期値として使用。学校ごとの実際の時刻とは
// 異なる場合があるが、時間割を時間軸つきで表示するための目安として使う。
export const BELL_SCHEDULE: { period: number; start: string; end: string }[] = [
  { period: 1, start: "08:45", end: "09:35" },
  { period: 2, start: "09:45", end: "10:35" },
  { period: 3, start: "10:45", end: "11:35" },
  { period: 4, start: "11:45", end: "12:35" },
  { period: 5, start: "13:20", end: "14:10" },
  { period: 6, start: "14:20", end: "15:10" },
];
