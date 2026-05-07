<script lang="tsx">
/**
 * 字典标签：必须读取 Pinia dictMap 响应式状态，否则字典异步写入后组件不重绘（表现为 ?? 或空白）。
 */
import { defineComponent, PropType } from 'vue'
import { storeToRefs } from 'pinia'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { isHexColor } from '@/utils/color'
import { ElTag } from 'element-plus'
import type { DictDataType } from '@/utils/dict'
import { getFallbackDictLabel, isGarbledDictLabel } from '@/utils/dictLabelSanitize'

export default defineComponent({
  name: 'DictTag',
  props: {
    type: {
      type: String as PropType<string>,
      required: true
    },
    value: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
      required: true
    }
  },
  setup(props) {
    const dictStore = useDictStoreWithOut()
    const { dictMap } = storeToRefs(dictStore)

    const normalizeValue = (v: string | number | boolean) => {
      if (typeof v === 'boolean') {
        return String(v)
      }
      return String(v)
    }

    const findDict = (dictType: string, raw: string): DictDataType | undefined => {
      const opts = (dictMap.value as Record<string, DictDataType[]>)?.[dictType]
      if (!opts?.length) {
        return undefined
      }
      for (const dict of opts) {
        if (dict.value == null) {
          continue
        }
        if (String(dict.value) === raw) {
          let colorType = dict.colorType
          if (colorType + '' === 'primary' || colorType + '' === 'default') {
            colorType = ''
          }
          return { ...dict, colorType }
        }
      }
      return undefined
    }

    const renderDictTag = () => {
      if (!props.type) {
        return null
      }
      if (props.value === undefined || props.value === null) {
        return null
      }
      const strVal = normalizeValue(props.value as string | number | boolean)
      const matched = findDict(props.type, strVal)

      const ct = matched?.colorType
      const elTagType =
        ct && /^(success|info|warning|danger|primary)$/.test(String(ct))
          ? String(ct)
          : undefined

      const tagProps: Record<string, unknown> = {
        style: matched?.cssClass ? 'color: #fff' : '',
        disableTransitions: true
      }
      if (elTagType) {
        tagProps.type = elTagType
      }
      if (matched?.cssClass && isHexColor(matched.cssClass)) {
        tagProps.color = matched.cssClass
      }

      let labelText =
        matched?.label ??
        (props.value !== undefined && props.value !== null ? strVal : '')
      const fb = getFallbackDictLabel(props.type, strVal)
      if (fb && (!matched || isGarbledDictLabel(matched.label))) {
        labelText = fb
      }

      return (
        <ElTag {...tagProps}>{labelText}</ElTag>
      )
    }
    return () => renderDictTag()
  }
})
</script>
