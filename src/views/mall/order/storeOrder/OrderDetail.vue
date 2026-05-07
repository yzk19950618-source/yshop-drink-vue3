<template>
 <el-drawer v-model="drawer" :title="dialogTitle" size="40%">
    <div>
      <div class="no-print" style="margin-bottom: 12px">
        <el-button type="primary" @click="handlePrintTicket">打印小票</el-button>
      </div>
      <!-- 热敏小票：58mm（@page）；改 80mm 见下方非 scoped 样式注释 -->
      <div id="order-print-ticket" class="order-print-ticket">
        <div class="ticket-shop">{{ DetailData.shopName || '门店' }}</div>
        <div class="ticket-row">订单号 {{ DetailData.orderId }}</div>
        <div class="ticket-row">取餐号 {{ DetailData.numberId }}</div>
        <div class="ticket-row">状态 {{ DetailData.statusStr || '—' }}</div>
        <template v-if="DetailData.orderType === 'takeout'">
          <hr class="ticket-sep" />
          <div class="ticket-row" v-if="DetailData.realName">
            收货人 {{ maskRecipientForTicket(DetailData.realName) }}
          </div>
          <div class="ticket-row" v-if="DetailData.userPhone">
            电话 {{ maskPhoneForTicket(DetailData.userPhone) }}
          </div>
          <div class="ticket-row ticket-addr" v-if="DetailData.userAddress">
            地址 {{ maskAddressForTicket(DetailData.userAddress) }}
          </div>
        </template>
        <template v-else-if="DetailData.orderType === 'desk'">
          <hr class="ticket-sep" />
          <div class="ticket-row">堂食 桌位 {{ DetailData.deskNumber ?? '—' }} 人数 {{ DetailData.deskPeople ?? '—' }}</div>
        </template>
        <template v-else-if="DetailData.orderType === 'takein'">
          <hr class="ticket-sep" />
          <div class="ticket-row">自取</div>
        </template>
        <hr class="ticket-sep" />
        <div class="ticket-colhead">
          <span class="ticket-c-name">品名</span>
          <span class="ticket-c-qty">数量</span>
          <span class="ticket-c-price">金额</span>
        </div>
        <template v-if="product && product.length">
          <div v-for="(row, idx) in product" :key="idx" class="ticket-goods">
            <div class="ticket-colrow ticket-title-line">
              <span class="ticket-c-name">{{ row.title }}</span>
              <span class="ticket-c-qty">x{{ row.number }}</span>
              <span class="ticket-c-price">￥{{ row.price }}</span>
            </div>
            <div v-if="formatProductSpecDisplay(row.spec)" class="ticket-spec-line">
              {{ formatProductSpecDisplay(row.spec) }}
            </div>
          </div>
        </template>
        <div v-else class="ticket-row ticket-muted">（无商品行）</div>
        <hr class="ticket-sep" />
        <div class="ticket-row ticket-strong">实付 ￥{{ DetailData.payPrice }}</div>
        <div class="ticket-row">下单 {{ formatDate(DetailData.createTime) }}</div>
        <div class="ticket-row" v-if="DetailData.mark">备注 {{ DetailData.mark }}</div>
      </div>

      <div class="order-detail-rest">
      <el-descriptions title="收货信息1" :column="2" v-if="DetailData.orderType == 'takeout'">
        <el-descriptions-item label="用户昵称">{{ nickname }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ DetailData.realName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ DetailData.userPhone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址">{{ DetailData.userAddress }}</el-descriptions-item>
      </el-descriptions>
      <el-descriptions title="商品明细" :column="1">
          <el-descriptions-item label="菜品">
              <table width="100%">
                <tr style="font-weight:bold;height:50px">
                  <td>图片</td>
                  <td>名称</td>
                  <td>规格</td>
                  <td>价格</td>
                  <td>数量</td>
                </tr>
                <tr v-for="(val, i) in product" :key="i">
                    <td><el-image style="width: 40px; height: 40px" :src="val.image" :fit="fit" /></td>
                    <td>{{ val.title}}</td>
                    <td>{{ formatProductSpecDisplay(val.spec) || '-' }}</td>
                    <td>{{ '￥'+ val.price}}</td>
                    <td>{{ ' x '+ val.number}}</td>
                </tr>
              </table>
          </el-descriptions-item>
      </el-descriptions>
      <el-descriptions title="订单信息" :column="2">
        <template #title>
          订单信息
          <el-tag  type="danger" v-if="DetailData.orderType=='desk'">堂食</el-tag>
          <el-tag  type="danger" v-if="DetailData.orderType=='takeout'">外卖</el-tag>
          <el-tag  type="danger" v-if="DetailData.orderType=='takein'">自取</el-tag>
        </template>
        <el-descriptions-item label="门店">{{ DetailData.shopName }}</el-descriptions-item>
        <el-descriptions-item label="取餐号">{{ DetailData.numberId }}</el-descriptions-item>
        <el-descriptions-item label="桌位号">{{ DetailData.deskNumber ? DetailData.deskNumber : '无' }}</el-descriptions-item>
        <el-descriptions-item label="就餐人数">{{ DetailData.deskPeople ? DetailData.deskPeople : '无' }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ DetailData.orderId }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ DetailData.statusStr }}</el-descriptions-item>
        <el-descriptions-item label="商品总数">{{ DetailData.totalNum }}</el-descriptions-item>
        <el-descriptions-item label="商品总价">{{ DetailData.totalPrice }}</el-descriptions-item>
        <el-descriptions-item label="支付邮费">{{ DetailData.payPostage }}</el-descriptions-item>
        <el-descriptions-item label="优惠券金额">{{ DetailData.couponPrice }}</el-descriptions-item>
        <el-descriptions-item label="积分抵扣">{{ DetailData.useIntegral }}</el-descriptions-item>
        <el-descriptions-item label="实际支付">{{ DetailData.payPrice }}</el-descriptions-item>
        <el-descriptions-item label="赠送积分">{{ DetailData.gainIntegral }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(DetailData.createTime)}}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDate(DetailData.payTime) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <span v-if="DetailData.paid == 1">
           <span v-if="DetailData.payType=='yue'">余额支付</span>
           <span v-if="DetailData.payType=='weixin'">微信支付</span>
           <span v-if="DetailData.payType=='alipay'">支付宝支付</span>
           <span v-if="DetailData.payType=='cash'">现金支付</span>
          </span>
          <span v-else>--</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单备注">{{ DetailData.mark }}</el-descriptions-item>
      </el-descriptions>
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in logisticResult"
          :key="index"
          :timestamp="activity.acceptTime"
        >
          {{ activity.acceptStation }}
        </el-timeline-item>
      </el-timeline>
      </div>
    </div>
  </el-drawer>
</template>
<script setup lang="ts">
import * as StoreOrderApi from '@/api/mall/order/storeOrder'
import { formatDate } from '@/utils/formatTime'
import { formatProductSpecDisplay } from '@/utils/formatter'

const { t } = useI18n() // 国际化
const dialogTitle = ref('') // 弹窗的标题
const drawer = ref(false)
const DetailData = ref<Record<string, any>>({})
const nickname = ref('')
const logisticResult = ref({})
const product = ref<any[]>([])
const fit = 'cover'

const handlePrintTicket = () => {
  window.print()
}

/** 小票打印：手机号脱敏（含 11 位手机与其它格式） */
function maskPhoneForTicket(raw?: string): string {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  const digits = s.replace(/\D/g, '')
  if (digits.length >= 11) {
    return `${digits.slice(0, 3)}****${digits.slice(-4)}`
  }
  if (digits.length >= 7) {
    return `${digits.slice(0, 3)}****${digits.slice(-2)}`
  }
  if (s.length <= 4) return '****'
  return `${s.slice(0, 2)}****${s.slice(-2)}`
}

/** 小票打印：地址脱敏（保留前后片段便于分拣，隐藏中间门牌细节） */
function maskAddressForTicket(raw?: string): string {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  if (s.length <= 10) {
    if (s.length <= 3) return '****'
    return `${s.slice(0, 2)}****${s.slice(-1)}`
  }
  const headLen = Math.min(12, s.length - 8)
  return `${s.slice(0, headLen)}****${s.slice(-6)}`
}

/** 小票打印：收货人姓名脱敏 */
function maskRecipientForTicket(raw?: string): string {
  if (raw == null || raw === '') return ''
  const s = String(raw).trim()
  if (s.length <= 1) return '*'
  if (s.length === 2) return `${s[0]}*`
  return `${s[0]}*${s.slice(-1)}`
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  drawer.value = true
  dialogTitle.value = t('action.' + type)
  DetailData.value = (await StoreOrderApi.getStoreOrder(id)) || {}
  nickname.value = DetailData.value?.userRespVO?.nickname ?? ''
  product.value = DetailData.value?.storeOrderCartInfoDOList ?? []
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

</script>
<style scoped>
.no-print {
  display: block;
}
/* 屏幕预览：接近 58mm 可打宽度 */
.order-print-ticket {
  box-sizing: border-box;
  width: 58mm;
  max-width: 100%;
  padding: 0;
  margin: 0 0 16px;
  border: 1px dashed var(--el-border-color);
  font-family: SimHei, 'Microsoft YaHei', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.35;
  color: #000;
  background: #fff;
}
.ticket-shop {
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 4px;
  word-break: break-all;
}
.ticket-row {
  margin: 0;
  padding: 0;
  word-break: break-all;
}
.ticket-strong {
  font-weight: 700;
}
.ticket-muted {
  color: #666;
}
hr.ticket-sep {
  border: none;
  border-top: 1px solid #000;
  margin: 3px 0;
  height: 0;
  padding: 0;
  background: none;
}
.ticket-colhead,
.ticket-colrow {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
  width: 100%;
  margin: 0;
  padding: 0;
  font-size: 12px;
}
.ticket-colhead {
  font-weight: 700;
  margin-top: 2px;
}
.ticket-goods {
  margin: 3px 0 0;
}
.ticket-title-line {
  font-weight: 400;
}
.ticket-c-name {
  flex: 1 1 55%;
  min-width: 0;
  word-break: break-all;
}
.ticket-c-qty {
  flex: 0 0 auto;
  text-align: right;
  white-space: nowrap;
}
.ticket-c-price {
  flex: 0 0 4.5em;
  text-align: right;
  white-space: nowrap;
}
.ticket-spec-line {
  font-size: 11px;
  margin: 0;
  padding: 0 0 0 0;
  word-break: break-all;
  color: #000;
}
.ticket-addr {
  word-break: break-all;
}
</style>

<style>
/*
  打印：整页仅小票、无边距、无背景；58mm 热敏宽度与 @page 一致。
  改用 80mm：将本 @media 内三处「58mm」改为「80mm」（含 @page size 与 #order-print-ticket width）。
*/
@media print {
  @page {
    size: 58mm auto;
    margin: 0;
  }
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  body * {
    visibility: hidden;
  }
  #order-print-ticket,
  #order-print-ticket * {
    visibility: visible;
  }
  #order-print-ticket {
    position: absolute;
    left: 0;
    top: 0;
    box-sizing: border-box;
    width: 58mm;
    max-width: 58mm;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #000 !important;
    font-family: SimHei, 'Microsoft YaHei', 'Courier New', monospace !important;
    font-size: 12px !important;
    line-height: 1.35 !important;
  }
  #order-print-ticket,
  #order-print-ticket * {
    box-shadow: none !important;
    background-image: none !important;
  }
  #order-print-ticket .ticket-shop {
    font-size: 14px !important;
  }
  #order-print-ticket hr.ticket-sep {
    border-top: 1px solid #000 !important;
    background: none !important;
  }
  .no-print,
  .order-detail-rest {
    display: none !important;
  }
}
</style>