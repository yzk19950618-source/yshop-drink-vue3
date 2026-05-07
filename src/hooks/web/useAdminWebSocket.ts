import { ref, watch } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { getAccessToken } from '@/utils/auth'

/** 可选：将 `public/order-notify.mp3` 放入项目根 public 目录后自动播放；否则使用简短蜂鸣 */
function playOrderNotifySound() {
  try {
    const src = `${import.meta.env.BASE_URL}order-notify.mp3`
    const audio = new Audio(src)
    audio.volume = 0.55
    void audio.play().catch(() => playFallbackBeep())
  } catch {
    playFallbackBeep()
  }
}

function playFallbackBeep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.12
    osc.start()
    window.setTimeout(() => {
      osc.stop()
      void ctx.close()
    }, 140)
  } catch {
    // ignore
  }
}

/**
 * 管理端登录后主布局内建立 `/infra/ws` 连接，解析门店订单等业务推送并弹出通知。
 */
export function useAdminWebSocket() {
  const userStore = useUserStore()
  const router = useRouter()

  const wsUrl = ref<string | undefined>(undefined)

  const syncUrl = () => {
    if (!userStore.getIsSetUser || !getAccessToken()) {
      wsUrl.value = undefined
      return
    }
    const base = import.meta.env.VITE_BASE_URL + '/infra/ws'
    wsUrl.value = base.replace(/^http/, 'ws') + '?token=' + getAccessToken()
  }

  const { data } = useWebSocket(wsUrl, {
    immediate: true,
    heartbeat: true,
    autoReconnect: {
      retries: 10,
      delay: 3000
    }
  })

  watch(
    () => [userStore.getIsSetUser, userStore.user.id] as const,
    () => {
      syncUrl()
    },
    { immediate: true }
  )

  const pushOrderNotify = (content: Record<string, unknown>) => {
    const event = String(content.event ?? '')
    const orderId = String(content.orderId ?? '')
    const shopName = String(content.shopName ?? '')
    const payPrice = content.payPrice
    const priceStr =
      payPrice !== undefined && payPrice !== null ? String(payPrice) : ''

    const title =
      event === 'created' ? '新订单' : event === 'paid' ? '订单已支付' : '订单通知'
    const parts: string[] = []
    if (shopName) parts.push(`门店：${shopName}`)
    if (orderId) parts.push(`订单号：${orderId}`)
    if (priceStr) parts.push(`金额：¥${priceStr}`)

    ElNotification({
      title,
      message: parts.length ? parts.join('，') : '订单变动',
      type: event === 'created' ? 'warning' : 'success',
      duration: 8000,
      onClick: () => {
        router.push({ name: 'StoreOrder', query: orderId ? { orderId } : {} })
      }
    })
    if (event === 'created' || event === 'paid') {
      playOrderNotifySound()
    }
  }

  watch(data, (raw) => {
    if (raw == null || raw === '') {
      return
    }
    if (raw === 'pong') {
      return
    }
    try {
      const jsonMessage = JSON.parse(raw as string)
      const type = jsonMessage.type as string | undefined
      if (!type) {
        return
      }
      let content: Record<string, unknown>
      try {
        content =
          typeof jsonMessage.content === 'string'
            ? JSON.parse(jsonMessage.content)
            : jsonMessage.content
      } catch {
        return
      }
      if (type === 'store-order-notify') {
        pushOrderNotify(content)
        return
      }
      if (type === 'order-pay-success') {
        pushOrderNotify({ ...content, event: 'paid' })
      }
    } catch {
      // 非 JSON 或结构异常时忽略
    }
  })
}
