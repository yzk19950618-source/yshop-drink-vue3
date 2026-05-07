/**
 * 配置浏览器本地存储的方式，可直接存储对象数组。
 */

import WebStorageCache from 'web-storage-cache'

type CacheType = 'localStorage' | 'sessionStorage'

export const CACHE_KEY = {
  // 用户相关
  ROLE_ROUTERS: 'roleRouters',
  USER: 'user',
  // 系统设置
  IS_DARK: 'isDark',
  LANG: 'lang',
  THEME: 'theme',
  LAYOUT: 'layout',
  // 版本号变更可强制丢弃浏览器里旧的字典缓存（避免脏数据导致界面 ??）
  DICT_CACHE: 'dictCache_v3',
  // 登录表单
  LoginForm: 'loginForm',
  TenantId: 'tenantId'
}

export const useCache = (type: CacheType = 'localStorage') => {
  const wsCache: WebStorageCache = new WebStorageCache({
    storage: type
  })

  return {
    wsCache
  }
}

export const deleteUserCache = () => {
  const { wsCache } = useCache()
  wsCache.delete(CACHE_KEY.USER)
  wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
  // 注意，不要清理 LoginForm 登录表单
}
