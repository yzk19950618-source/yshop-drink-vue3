import { defineStore } from 'pinia'
import { store } from '../index'
// @ts-ignore
import { DictDataVO } from '@/api/system/dict/types'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
const { wsCache } = useCache('sessionStorage')
import { getSimpleDictDataList } from '@/api/system/dict/dict.data'
import { sanitizeDictMapGarbledLabels } from '@/utils/dictLabelSanitize'

export interface DictValueType {
  value: any
  label: string
  clorType?: string
  cssClass?: string
}
export interface DictTypeType {
  dictType: string
  dictValue: DictValueType[]
}
export interface DictState {
  /** 须为普通对象：若用 new Map()，用 dictMap[type] 取不到条目，会导致 DictTag 等永远匹配不到字典 */
  dictMap: Record<string, any>
  isSetDict: boolean
}

export const useDictStore = defineStore('dict', {
  state: (): DictState => ({
    dictMap: {},
    isSetDict: false
  }),
  getters: {
    getDictMap(): Recordable {
      const dictMap = wsCache.get(CACHE_KEY.DICT_CACHE)
      if (dictMap) {
        sanitizeDictMapGarbledLabels(dictMap)
        this.dictMap = dictMap
      }
      return this.dictMap
    },
    getIsSetDict(): boolean {
      return this.isSetDict
    }
  },
  actions: {
    async setDictMap() {
      const dictMap = wsCache.get(CACHE_KEY.DICT_CACHE)
      if (dictMap) {
        sanitizeDictMapGarbledLabels(dictMap)
        this.dictMap = dictMap
        this.isSetDict = true
      } else {
        const res = await getSimpleDictDataList()
        const dictDataMap: Record<string, any[]> = {}
        res.forEach((dictData: DictDataVO) => {
          if (!dictDataMap[dictData.dictType]) {
            dictDataMap[dictData.dictType] = []
          }
          dictDataMap[dictData.dictType].push({
            value: dictData.value,
            label: dictData.label,
            colorType: dictData.colorType,
            cssClass: dictData.cssClass
          })
        })
        sanitizeDictMapGarbledLabels(dictDataMap)
        this.dictMap = dictDataMap
        this.isSetDict = true
        wsCache.set(CACHE_KEY.DICT_CACHE, dictDataMap, { exp: 60 }) // 60 秒 过期
      }
    },
    getDictByType(type: string) {
      if (!this.isSetDict) {
        this.setDictMap()
      }
      return this.dictMap[type]
    },
    async resetDict() {
      wsCache.delete(CACHE_KEY.DICT_CACHE)
      const res = await getSimpleDictDataList()
      const dictDataMap: Record<string, any[]> = {}
      res.forEach((dictData: DictDataVO) => {
        if (!dictDataMap[dictData.dictType]) {
          dictDataMap[dictData.dictType] = []
        }
        dictDataMap[dictData.dictType].push({
          value: dictData.value,
          label: dictData.label,
          colorType: dictData.colorType,
          cssClass: dictData.cssClass
        })
      })
      sanitizeDictMapGarbledLabels(dictDataMap)
      this.dictMap = dictDataMap
      this.isSetDict = true
      wsCache.set(CACHE_KEY.DICT_CACHE, dictDataMap, { exp: 60 }) // 60 秒 过期
    }
  }
})

export const useDictStoreWithOut = () => {
  return useDictStore(store)
}
