/**
 * 字典 label 在库或 JDBC 编码异常时可能为全问号；对关键字典做内存兜底，避免列表状态等大面积显示异常。
 */
const GARBLED = /^[?？\uFFFD\s]*$/i

const LABEL_FALLBACK: Record<string, Record<string, string>> = {
  common_status: {
    '0': '开启',
    '1': '关闭'
  },
  system_role_type: {
    '1': '内置',
    '2': '自定义'
  }
}

export function isGarbledDictLabel(label: unknown): boolean {
  if (label == null) return true
  const s = String(label).trim()
  return s.length === 0 || GARBLED.test(s)
}

/** 就地修正 dictMap 中已知类型的乱码 label（含从 sessionStorage 读出的缓存） */
export function sanitizeDictMapGarbledLabels(dictDataMap: Record<string, any[]>) {
  if (!dictDataMap) return
  for (const [dictType, fixMap] of Object.entries(LABEL_FALLBACK)) {
    const rows = dictDataMap[dictType]
    if (!rows?.length) continue
    for (const row of rows) {
      const v = row.value != null ? String(row.value) : ''
      const fb = fixMap[v]
      if (!fb) continue
      if (isGarbledDictLabel(row.label)) {
        row.label = fb
      }
    }
  }
}

export function getFallbackDictLabel(dictType: string, rawValue: string): string | undefined {
  return LABEL_FALLBACK[dictType]?.[rawValue]
}
