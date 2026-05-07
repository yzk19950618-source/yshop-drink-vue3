import { floatToFixed2 } from '@/utils'

/** 订单行规格展示：去掉单规格占位「默认|」「default|」前缀 */
export function formatProductSpecDisplay(spec?: string | null): string {
  const s = (spec ?? '').toString().trim()
  if (!s) return ''
  return s.replace(/^(默认|default)\s*\|\s*/i, '').trim()
}

// 格式化金额【分转元】
// @ts-ignore
export const fenToYuanFormat = (_, __, cellValue: any, ___) => {
  return `￥${floatToFixed2(cellValue)}`
}
