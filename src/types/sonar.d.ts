/**
 * Коллбэки для событий жизненного цикла размещения рекламы:
 *
 * onShowStart - после начала показа рекламного блока
 * onShow - после отображения рекламного блока
 * onCloseNetwork - после закрытия рекламного блока пользователем
 * onError - возникает ошибка
 * onRefresh - обновление баннера / только для баннерной рекламы
 * onReward - получение награды / только для rewarded рекламы
 */
export type SonarShowCallbackName =
  | 'onStart'
  | 'onShow'
  | 'onRefresh'
  | 'onReward'
  | 'onClose'
  | 'onError'
export type SonarShowCallback = () => void

export type SonarShowParams = Partial<
  Record<SonarShowCallbackName, SonarShowCallback>
> & {
  adUnit: string
  loader?: boolean // не показывать фулскрин-лоадер, только для interstitital / rewarded рекламы
}

export type SonarReturnStatus = 'showing' | 'hidden' | 'removed' | 'error'

export type SonarReturn = {
  status: SonarReturnStatus
  message?: string
}

export type SonarRemoveParams = {
  adUnit: string
}

export interface Sonar {
  show(showParams: SonarShowParams): Promise<SonarReturn>
  remove(removeParams: SonarRemoveParams): Promise<SonarReturn>
}
