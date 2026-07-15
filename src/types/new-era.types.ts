import { UserRolesEnum } from '@app/enums/user-roles.enum'

export enum SubscriptionExtensionsWithConditionsTypeEnum {
  ROLE = 'ROLE',
  SUB = 'SUB',
}

export enum SubscriptionExtensionsEnum {
  PREMIUM = 'PREMIUM', // Покупка премиума (открывает модальное окно с покупкой према пока сделай заглушку вызово нужноого компонента в модальном окне)
  CHANNEL = 'CHANNEL', // Подписка на канал (открывает канал по ссылке)
  CHAT = 'CHAT', // Вступление в чат (открывает чат по ссылке)
  BIO = 'BIO', // Указание в описании профиля телеграм "@vpnsibcom_bot" (Стоит уточнить, что не будет читаться у тех, у кого профиль скрыт настройками приватности)
  NAME = 'NAME', // Указание в Имени пользователя телеграм "@vpnsibcom_bot"
}

export interface SubscriptionExtensionsWithConditionsInterface {
  key: UserRolesEnum | SubscriptionExtensionsEnum
  type: SubscriptionExtensionsWithConditionsTypeEnum
  days: number // добавляет n дней к подписке
  devicesCount: number // добавляет n устройств к лимиту устройств у подписки
  trafficLimitGb: number // Добавляет n гигабайт трафика к лимиту трафика в день на подписке
  isUnlimitTraffic: boolean // Дает безлимитный трафик к подписке
  conditionMet: boolean // Выполнено ли это расширение
  isPremiumServers: boolean // дает ли доступ к премиум серверам
  isNoAds: boolean // Отключает рекламу в Telegram-mini-app и боте
  isRoleChat: boolean // Дает ли Тэг роли в чате
  roleName?: string // Какой какой Тэг роли будет
  isAutoRenewing: boolean // Автоматически продлевает подписку по истечении дней (нет необходимости заходить каждые n дней, чтобы нажать самому кнопку продлить)
  // Если в условиях 0 или false, то их и не надо показывать, только те, что реально дают дополнительную награду к подписке
}

export type RemnaUserStatus = 'ACTIVE' | 'DISABLED' | 'LIMITED' | 'EXPIRED'

export interface NewEraSubWithTmaInterface {
  isNoSub: boolean
  status: RemnaUserStatus // Статус подписки Активна, Отключена, В лимитах (истек трафик), Истек период
  isUnlimitTraffic: boolean // Безлимитный ли трафик
  dataLimitBytes?: number // Лимит трафика (в день)
  devicesLimit: number // Ограничение устройств
  usedTrafficBytes: number // Использовано лимита трафика
  lifetimeUsedTrafficBytes: number // Использовано трафика за всё время использования подписки
  subscriptionUrl?: string // Ссылка на подписку (используется в компоненте добавления устройства)
  happCryptoUrl?: string // Ссылка на подписку крипто happ (используется в компоненте добавления устройства)
  days: number // Лимит дней для подписки (визуализируется полосочками, каждая полосочка это день)
  expiredAt?: Date // Когда заканчивается (в полосочках цветные сколько осталось, притемненные сколько прошло, текущий день можно в процентах заполнетости дня полоски, еще когда остается 1-2 дня, эти полоски мигают и кнопка продления тоже)
  onlineAt?: Date // Когда последний раз был онлайн
  devices: HwidDevice[] // Подключенные устройства (Можно удалять)
  isAutoRenewing: boolean
}

export interface HwidDevice {
  hwid: string // уникальный id устройства
  platform: string | null // Платформа на который подключен
  osVersion: string | null
  deviceModel: string | null // Название устройства
}
