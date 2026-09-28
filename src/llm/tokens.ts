// 粗粒度 token 估算（红队 #2 实测工具）：CJK 字符 ≈1 token/字，其余 ≈4 字符/token
export function estimateTokens(text: string): number {
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch)) cjk++;
    else other++;
  }
  return Math.ceil(cjk + other / 4);
}
