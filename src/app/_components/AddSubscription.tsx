'use client'

import { config } from '@app/config/client'
import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { usePlansStore } from '@app/store/plans.store'
import { useServersStore } from '@app/store/servers.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { PlansInterface } from '@app/types/plans.interface'
import { ServerDataInterface } from '@app/types/servers-data.interface'
import {
  calculatePremiumServersPrice,
  calculateServersPrice,
  calculateSubscriptionCost,
} from '@app/utils/calculate-subscription-cost.util'
import { invoice } from '@telegram-apps/sdk-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { JSX, useCallback, useEffect, useState } from 'react'
import { BiServer, BiSolidMask } from 'react-icons/bi'
import { FaCircleInfo, FaShieldHeart } from 'react-icons/fa6'
import { IoLogoGithub, IoShieldHalf } from 'react-icons/io5'
import {
  MdAdsClick,
  MdDevices,
  MdOutlineDevicesOther,
  MdTraffic,
} from 'react-icons/md'
import { TbCloudNetwork } from 'react-icons/tb'
import { toast } from 'react-toastify'
import TgStar from './TgStar'
import TooltipWrapper from './TooltipWrapper'

interface PeriodButtonInterface {
  key: SubscriptionPeriodEnum
  label: string
  discount: number
}

const periodMultiplierButtons = [1, 2, 3, 5, 7, 10]
const devicesCountButtons = [1, 2, 3, 5, 7, 10, 15, 20, 30]
const trafficGbButtons = [1, 2, 3, 5, 7, 10, 15, 20, 30]

const getButtonColor = (amount: number) => {
  if (amount == 1) return 'var(--color-green)'
  if (amount <= 5) return 'var(--color-gold)'
  return 'var(--color-red)'
}

const getDevicesCountButtonColor = (amount: number) => {
  if (amount <= 5) return 'var(--color-green)'
  if (amount <= 10) return 'var(--color-gold)'
  return 'var(--color-red)'
}

export default function AddSubscription() {
  const tBill = useTranslations('billing.payment')
  const location = usePathname()
  const url = location.includes('/tma') ? '/tma' : '/app'
  const router = useRouter()
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const { serversData, setServersData } = useServersStore()
  const { plansData, setPlansData } = usePlansStore()
  const [periodButton, setPeriodButton] =
    useState<PeriodButtonInterface | null>(null)
  const [periodButtons, setPeriodButtons] = useState<PeriodButtonInterface[]>(
    [],
  )
  const [devicesCount, setDevicesCount] = useState<number>(1)
  const [isAllBaseServers, setIsAllBaseServers] = useState<boolean>(true)
  const [isAllPremiumServers, setIsAllPremiumServers] = useState<boolean>(true)
  const [baseServersCount, setBaseServersCount] = useState<number>(0)
  const [premiumServersCount, setPremiumServersCount] = useState<number>(0)
  const [serversSelected, setServersSelected] = useState<string[]>([])
  const [isFixedPrice, setIsFixedPrice] = useState<boolean>(false)
  const [periodMultiplier, setPeriodMultiplier] = useState<number>(1)
  const [isUnlimitTraffic, setIsUnlimitTraffic] = useState<boolean>(false)
  const [trafficLimitGb, setTrafficLimitGb] = useState<number>(1)
  const [isAutoRenewal, setIsAutoRenewal] = useState<boolean>(true)
  const [planSelected, setPlanSelected] = useState<PlansInterface | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const selectPlan = useCallback(
    (plan: PlansInterface) => {
      setPlanSelected(plan)
      setDevicesCount(plan.devicesCount)
      setIsAllBaseServers(plan.isAllBaseServers)
      setIsAllPremiumServers(plan.isAllPremiumServers)
      setIsUnlimitTraffic(plan.isUnlimitTraffic)
      setTrafficLimitGb(plan.trafficLimitGb ?? 0)

      if (!serversData || !plan) return
      if (plan.isAllBaseServers && plan.isAllPremiumServers) {
        setServersSelected([])
        setBaseServersCount(serversData.baseServersCount)
        setPremiumServersCount(serversData.premiumServersCount)
      } else if (plan.isAllBaseServers && !plan.isAllPremiumServers) {
        setServersSelected([])
        setBaseServersCount(serversData.baseServersCount)
        setPremiumServersCount(0)
      } else {
        setServersSelected([])
        setBaseServersCount(0)
        setPremiumServersCount(0)
      }
    },
    [serversData],
  )

  useEffect(() => {
    const getServers = async () => {
      try {
        const updated = await authApiClient.getServers()
        setServersData({
          baseServersCount: updated.baseServersCount,
          premiumServersCount: updated.premiumServersCount,
          servers: updated.servers,
        })
        setBaseServersCount(updated.baseServersCount)
        setPremiumServersCount(updated.premiumServersCount)
        setUser(updated.user)
      } catch {
        toast.error('Error updating data')
      }
    }
    const getPlans = async () => {
      try {
        const updated = await publicApiClient.getPlans()
        setPlansData(updated)
        selectPlan(updated.plans[0])
      } catch {
        toast.error('Error updating data')
      }
    }
    getServers()
    getPlans()
    return () => {}
  }, [setPlansData, setServersData, setUser, selectPlan])

  useEffect(() => {
    if (!subscriptions || !user) return

    const buttons = [
      {
        key: SubscriptionPeriodEnum.HOUR,
        label: '1 час',
        discount: subscriptions.hourRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.DAY,
        label: '1 день',
        discount: subscriptions.dayRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.WEEK,
        label: '1 неделя',
        discount: subscriptions.weekRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.MONTH,
        label: '1 месяц',
        discount: 1,
      },
      {
        key: SubscriptionPeriodEnum.THREE_MONTH,
        label: '3 месяца',
        discount: subscriptions.threeMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.SIX_MONTH,
        label: '6 месяцев',
        discount: subscriptions.sixMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.YEAR,
        label: '1 год',
        discount: subscriptions.oneYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.TWO_YEAR,
        label: '2 года',
        discount: subscriptions.twoYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.THREE_YEAR,
        label: '3 года',
        discount: subscriptions.threeYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.INDEFINITELY,
        label: 'Бессрочно',
        discount: subscriptions.indefinitelyRatio,
      },
    ]

    setPeriodButtons(buttons)
    setPeriodButton(buttons[3])
  }, [subscriptions, user])

  if (
    !subscriptions ||
    !user ||
    !periodButton ||
    !serversData ||
    !plansData ||
    !planSelected
  )
    return null

  const handleClickPurchaseSubscription = async () => {
    setIsLoading(true)
    try {
      const update = await authApiClient.purchaseSubscription({
        period: periodButton.key,
        periodMultiplier: periodMultiplier,
        isFixedPrice: isFixedPrice,
        devicesCount: devicesCount,
        isAllBaseServers: isAllBaseServers,
        isAllPremiumServers: isAllPremiumServers,
        trafficLimitGb: trafficLimitGb,
        isUnlimitTraffic: isUnlimitTraffic,
        servers: serversSelected,
        isAutoRenewal: isAutoRenewal,
        planKey: planSelected.key,
      })
      await setUser(update.user)
      await setSubscriptions(update.subscriptions)
    } catch {
      toast.error('Error updating data')
    } finally {
      setIsLoading(false)
      router.push(url)
    }
  }

  const handleClickPurchaseInvoiceSubscription = async () => {
    setIsLoading(true)
    try {
      const update = await authApiClient.purchaseInvoiceSubscription({
        method: PaymentMethodEnum.STARS,
        period: periodButton.key,
        periodMultiplier: periodMultiplier,
        isFixedPrice: isFixedPrice,
        devicesCount: devicesCount,
        isAllBaseServers: isAllBaseServers,
        isAllPremiumServers: isAllPremiumServers,
        trafficLimitGb: trafficLimitGb,
        isUnlimitTraffic: isUnlimitTraffic,
        servers: serversSelected,
        isAutoRenewal: isAutoRenewal,
        planKey: planSelected.key,
      })
      await setUser(update.user)
      await setSubscriptions(update.subscriptions)
      await invoice.open(update.linkPay, 'url')
    } catch {
      toast.error('Error updating data')
    } finally {
      setIsLoading(false)
      router.push(url)
    }
  }

  const privileges = [
    {
      key: 'asd124sdfg65234qwf',
      icon: <MdDevices />,
      text:
        planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM
          ? 'Нужное количество устройств'
          : `До ${devicesCount} одновременных устройств`,
    },
    {
      key: 'asdqwf',
      icon: <BiServer />,
      text:
        planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM
          ? 'Выбирай нужные сервера'
          : planSelected.serversSelectType ==
              PlansServersSelectTypeEnum.ONE_BASE
            ? 'Один базовый сервер на выбор'
            : planSelected.serversSelectType ==
                PlansServersSelectTypeEnum.ONE_BASE_OR_PREMIUM
              ? 'Один базовый или премиум сервер на выбор'
              : isAllBaseServers && isAllPremiumServers
                ? 'Доступ ко всем серверам'
                : isAllBaseServers
                  ? 'Доступ ко всем базовым серверам'
                  : premiumServersCount == 0
                    ? `Доступ к ${baseServersCount} базовым серверам`
                    : `Доступ к ${baseServersCount} базовым и ${premiumServersCount} премиум серверам`,
    },
    {
      key: 'asd234qwf',
      icon: <TbCloudNetwork />,
      text:
        planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM
          ? 'Нужное количество трафика'
          : isUnlimitTraffic
            ? 'Безлимитный трафик'
            : `${trafficLimitGb} ГБ трафика ежедневно`,
    },
    {
      key: 'asdq21wf',
      icon: <FaShieldHeart />,
      text: 'Защищенное соединение',
    },
    {
      key: 'asd32187qwf',
      icon: <MdTraffic />,
      text: 'Без ограничений на скорость',
    },
    {
      key: 'as01566dqwf',
      icon: <BiSolidMask />,
      text: 'Маскировка вашего трафика',
    },
    {
      key: 'asd21564qwf',
      icon: <MdAdsClick />,
      text: 'Отсутвие рекламы',
    },
    {
      key: 'asd123dsfeqwf',
      icon: <MdOutlineDevicesOther />,
      text: 'Широкая поддержка устройств',
    },

    {
      key: 'asd12465234qwf',
      icon: <IoShieldHalf />,
      text: 'Надежное ядро XRAY',
    },
    {
      key: 'asd11232465234qwf',
      icon: <IoLogoGithub />,
      text: 'Открытый исходный код',
    },
  ]

  const getFinalPercent = (ratio: number) => 100 - ratio * 100

  const price = calculateSubscriptionCost({
    period: periodButton.key,
    periodMultiplier,
    isPremium: user.isPremium,
    devicesCount,
    serversCount: baseServersCount,
    premiumServersCount,
    trafficLimitGb,
    isAllBaseServers: isAllBaseServers,
    isAllPremiumServers,
    isUnlimitTraffic,
    userDiscount: user.roleDiscount,
    plan: planSelected,
    settings: subscriptions,
  })
  const balance = user.balance.isUseWithdrawalBalance
    ? user.balance.paymentBalance + user.balance.withdrawalBalance
    : user.balance.paymentBalance

  const finalPrice = isFixedPrice
    ? price + subscriptions.fixedPriceStars
    : price

  const nextFinalPrice = user.isTgProgramPartner
    ? finalPrice * subscriptions.telegramPartnerProgramRatio
    : finalPrice

  const resultList: { name: string; value: JSX.Element; isVisible: boolean }[] =
    [
      {
        name: 'Устройства',
        value: <div>{devicesCount} шт.</div>,
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM,
      },
      {
        name: 'Трафик',
        value: (
          <div>{isUnlimitTraffic ? 'Безлимит' : `${trafficLimitGb} ГБ.`}</div>
        ),
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM,
      },
      {
        name: 'Сервера',
        value: (
          <div className="flex gap-2 items-center">
            {isAllBaseServers && isAllPremiumServers ? (
              'Все базовые + премиум'
            ) : isAllBaseServers ? (
              'Все базовые'
            ) : (
              <>
                <TooltipWrapper
                  prompt={'Базовые/Премиум сервера'}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
                {baseServersCount}/{premiumServersCount} шт.
              </>
            )}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM,
      },
      {
        name: 'Период',
        value: (
          <div className="flex gap-1 items-center">
            <div>{periodButton.label}</div>
            {periodMultiplier > 1 && (
              <div className="rounded-md w-[22px] h-[22px] justify-center items-center flex bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold">
                x{periodMultiplier}
              </div>
            )}
          </div>
        ),
        isVisible: true,
      },
      {
        name: 'Скидка за период',
        value: <div>{getFinalPercent(periodButton.discount)}%</div>,
        isVisible:
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          getFinalPercent(periodButton.discount) > 0,
      },
      {
        name: 'Скидка за роль',
        value: <div>{getFinalPercent(user.roleDiscount)}%</div>,
        isVisible: getFinalPercent(user.roleDiscount) > 0,
      },
      {
        name: 'Авто продление',
        value: (
          <div className="flex flex-row gap-2 items-center">
            {isAutoRenewal ? 'Да' : 'Нет'}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isAutoRenewal,
      },
      {
        name: 'К оплате за период',
        value: (
          <div className="flex flex-row gap-2 items-center">
            <TgStar type="gold" w={14} />
            {price}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM &&
          isFixedPrice &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY,
      },
      {
        name: 'Фиксация цены',
        value: (
          <div className="flex flex-row gap-2 items-center">
            {isFixedPrice ? 'Да' : 'Нет'}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isFixedPrice,
      },
      {
        name: 'К оплате разово',
        value: (
          <div className="flex flex-row gap-2 items-center">
            <TgStar type="gold" w={14} />
            {subscriptions.fixedPriceStars}
          </div>
        ),
        isVisible:
          planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM &&
          periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY &&
          isFixedPrice,
      },
      {
        name: 'Всего к оплате',
        value: (
          <div className="flex flex-row gap-2 items-center">
            <TgStar type="gold" w={14} />
            {nextFinalPrice.toFixed(2)}
          </div>
        ),
        isVisible: true,
      },
    ]

  const trafficPrice = user.isPremium
    ? isUnlimitTraffic
      ? subscriptions.unlimitTrafficPriceStars *
        subscriptions.telegramPremiumRatio
      : subscriptions.trafficGbPriceStars *
        trafficLimitGb *
        subscriptions.telegramPremiumRatio
    : isUnlimitTraffic
      ? subscriptions.unlimitTrafficPriceStars
      : subscriptions.trafficGbPriceStars * trafficLimitGb

  const serversPrice =
    (calculateServersPrice(
      isAllBaseServers,
      isAllPremiumServers,
      baseServersCount,
      subscriptions,
    ) +
      calculatePremiumServersPrice(
        isAllBaseServers,
        isAllPremiumServers,
        premiumServersCount,
        subscriptions,
      )) *
    (user.isPremium ? subscriptions.telegramPremiumRatio : 1)

  const devicePrice = user.isPremium
    ? subscriptions.devicesPriceStars *
      devicesCount *
      subscriptions.telegramPremiumRatio
    : subscriptions.devicesPriceStars * devicesCount

  return (
    <div className={'flex flex-col gap-4 items-center w-full max-w-[400px]'}>
      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="flex gap-2 items-end justify-between w-full px-4 ">
          <div className="opacity-50 flex flex-row gap-2 items-center">
            Тариф
          </div>
          <div className="flex gap-2 items-center ">
            <TgStar type="gold" w={14} />
            {(user.isTgProgramPartner
              ? price * subscriptions.telegramPartnerProgramRatio
              : price
            ).toFixed(2)}
          </div>
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
          {plansData.plans
            .sort((a, b) => {
              const indexA = Object.values(PlansEnum).indexOf(a.key)
              const indexB = Object.values(PlansEnum).indexOf(b.key)

              const safeIndexA = indexA === -1 ? Infinity : indexA
              const safeIndexB = indexB === -1 ? Infinity : indexB

              return safeIndexA - safeIndexB
            })
            .map((btn: PlansInterface) => {
              const isActive = btn.key === planSelected?.key
              const bgOpacity = isActive ? 0.3 : 0.15
              return (
                <motion.button
                  key={btn.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    selectPlan(btn)
                  }}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  )}
                  style={{
                    backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                    border: isActive
                      ? `1px solid rgba(216, 197, 255, 0.7)`
                      : '1px solid transparent',
                  }}>
                  {btn.name}
                </motion.button>
              )
            })}
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
          {privileges.map((el) => {
            return (
              <motion.div
                key={el.key}
                className={clsx(
                  'flex flex-row gap-3 items-center px-4 py-2 text-sm font-mono',
                )}>
                {el.icon} {el.text}
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM && (
        <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
          <div className="flex gap-2 items-end justify-between w-full px-4 ">
            <div className="opacity-50 flex flex-row gap-2 items-center">
              Устройства
            </div>
            <div className="flex gap-2 items-center ">
              <TgStar type="gold" w={14} />
              {(user.isTgProgramPartner
                ? devicePrice * subscriptions.telegramPartnerProgramRatio
                : devicePrice
              ).toFixed(2)}
            </div>
          </div>

          <motion.div
            layout
            className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
            <button
              onClick={() =>
                setDevicesCount(devicesCount == 1 ? 1 : devicesCount - 1)
              }
              className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
              style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
              -
            </button>
            <input
              type="number"
              placeholder={'Введите число'}
              value={devicesCount || ''}
              onChange={(e) =>
                setDevicesCount(
                  e.target.value
                    ? parseInt(e.target.value) < 1
                      ? 1
                      : parseInt(e.target.value)
                    : 1,
                )
              }
              className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              onClick={() => setDevicesCount(devicesCount + 1)}
              className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
              style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
              +
            </button>
            {devicesCountButtons.map((val) => {
              const isActive = devicesCount === val
              const rgb = getDevicesCountButtonColor(val)
              const bgOpacity = isActive ? 0.3 : 0.15
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDevicesCount(val)}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  )}
                  style={{
                    backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                    border: isActive
                      ? `1px solid rgba(${rgb}, 0.7)`
                      : '1px solid transparent',
                  }}>
                  {val}
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      )}

      {planSelected.serversSelectType !==
        PlansServersSelectTypeEnum.NOT_SELECTED && (
        <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
          <div className="flex gap-2 items-end justify-between w-full px-4 ">
            <div className="opacity-50 flex flex-row gap-2 items-center">
              Сервера
            </div>
            {planSelected.serversSelectType ==
              PlansServersSelectTypeEnum.CUSTOM && (
              <div className="flex gap-2 items-center ">
                <TgStar type="gold" w={14} />
                {(user.isTgProgramPartner
                  ? serversPrice * subscriptions.telegramPartnerProgramRatio
                  : serversPrice
                ).toFixed(2)}
              </div>
            )}
          </div>

          <motion.div
            layout
            className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
            {planSelected.serversSelectType ==
              PlansServersSelectTypeEnum.CUSTOM && (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isAllBaseServers) {
                      setIsAllBaseServers(false)
                      setIsAllPremiumServers(false)
                      setBaseServersCount(0)
                    } else {
                      setServersSelected([])
                      setBaseServersCount(serversData.baseServersCount)
                      setIsAllBaseServers(true)
                    }
                  }}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  )}
                  style={{
                    backgroundColor: `rgba(216, 197, 255, ${isAllBaseServers ? 0.3 : 0.15})`,
                    border: isAllBaseServers
                      ? `1px solid rgba(216, 197, 255, 0.7)`
                      : '1px solid transparent',
                  }}>
                  Базовые
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isAllPremiumServers) {
                      setIsAllPremiumServers(false)
                      setPremiumServersCount(0)
                    } else {
                      setServersSelected([])
                      setIsAllBaseServers(true)
                      setBaseServersCount(serversData.baseServersCount)
                      setIsAllPremiumServers(true)
                      setPremiumServersCount(serversData.premiumServersCount)
                    }
                  }}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  )}
                  style={{
                    backgroundColor: `rgba(216, 197, 255, ${isAllPremiumServers ? 0.3 : 0.15})`,
                    border: isAllPremiumServers
                      ? `1px solid rgba(216, 197, 255, 0.7)`
                      : '1px solid transparent',
                  }}>
                  Премиум
                </motion.button>
                <div className="w-full flex gap-2 items-center">
                  <div className="h-[1px] grow bg-[var(--primary)]"></div>
                  <div className="text-[var(--primary)]">или на выбор</div>
                  <div className="h-[1px] grow bg-[var(--primary)]"></div>
                </div>
              </>
            )}

            {serversData.servers
              .filter((el) =>
                planSelected.serversSelectType ==
                PlansServersSelectTypeEnum.ONE_BASE
                  ? !el.isPremium
                  : planSelected.serversSelectType ==
                      PlansServersSelectTypeEnum.NOT_SELECTED
                    ? false
                    : true,
              )
              .map((btn: ServerDataInterface) => {
                const isActive = serversSelected.includes(btn.code)
                const bgOpacity = isActive ? 0.3 : 0.15
                return (
                  <motion.button
                    key={btn.code}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isActive) {
                        setServersSelected(
                          serversSelected.filter((val) => val !== btn.code),
                        )
                        if (btn.isPremium)
                          setPremiumServersCount(
                            premiumServersCount < 0
                              ? 0
                              : premiumServersCount - 1,
                          )
                        else
                          setBaseServersCount(
                            baseServersCount < 0 ? 0 : baseServersCount - 1,
                          )
                      } else {
                        if (
                          planSelected.serversSelectType ==
                            PlansServersSelectTypeEnum.ONE_BASE ||
                          planSelected.serversSelectType ==
                            PlansServersSelectTypeEnum.ONE_BASE_OR_PREMIUM
                        ) {
                          setServersSelected([btn.code])
                          if (btn.isPremium) setPremiumServersCount(1)
                          else setBaseServersCount(1)
                        } else {
                          setServersSelected([...serversSelected, btn.code])
                          if (btn.isPremium)
                            setPremiumServersCount(
                              serversSelected.length < 1
                                ? 1
                                : premiumServersCount + 1,
                            )
                          else
                            setBaseServersCount(
                              serversSelected.length < 1
                                ? 1
                                : baseServersCount + 1,
                            )
                        }
                        setIsAllBaseServers(false)
                        setIsAllPremiumServers(false)
                      }
                    }}
                    className={clsx(
                      'flex flex-wrap gap-2 grow items-center justify-center text-white px-2 py-1.5 rounded-md text-xs font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                    )}
                    style={{
                      backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                      border: isActive
                        ? `1px solid rgba(216, 197, 255, 0.7)`
                        : '1px solid transparent',
                    }}>
                    {btn.isPremium && (
                      <div className="flex items-center justify-center h-5 w-5 bg-[var(--gold-container)] rounded-md">
                        ⭐
                      </div>
                    )}
                    <Image
                      src={`/flags/${btn.flagKey}.svg`}
                      alt="flag"
                      width={20}
                      height={20}
                    />
                    {btn.code.toUpperCase()} [{btn.network}GBit] {btn.name}
                  </motion.button>
                )
              })}
          </motion.div>
        </div>
      )}

      {planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM && (
        <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
          <div className="flex gap-2 items-end justify-between w-full px-4 ">
            <div className="opacity-50 flex flex-row gap-2 items-center">
              Ежедневный трафик ГБ
            </div>
            <div className="flex gap-2 items-center ">
              <TgStar type="gold" w={14} />
              {(user.isTgProgramPartner
                ? trafficPrice * subscriptions.telegramPartnerProgramRatio
                : trafficPrice
              ).toFixed(2)}
            </div>
          </div>

          <motion.div
            layout
            className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
            <button
              onClick={() => {
                setTrafficLimitGb(trafficLimitGb == 1 ? 1 : trafficLimitGb - 1)
                setIsUnlimitTraffic(false)
              }}
              className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
              style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
              -
            </button>
            <input
              type="number"
              placeholder={'Введите число'}
              value={trafficLimitGb || ''}
              onChange={(e) => {
                setTrafficLimitGb(
                  e.target.value
                    ? parseInt(e.target.value) < 1
                      ? 1
                      : parseInt(e.target.value)
                    : 1,
                )
                setIsUnlimitTraffic(false)
              }}
              className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              onClick={() => {
                setTrafficLimitGb(trafficLimitGb + 1)
                setIsUnlimitTraffic(false)
              }}
              className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
              style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
              +
            </button>
            {trafficGbButtons.map((val) => {
              const isActive = trafficLimitGb === val
              const rgb = getDevicesCountButtonColor(val)
              const bgOpacity = isActive ? 0.3 : 0.15
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTrafficLimitGb(val)
                    setIsUnlimitTraffic(false)
                  }}
                  className={clsx(
                    'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                  )}
                  style={{
                    backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                    border: isActive
                      ? `1px solid rgba(${rgb}, 0.7)`
                      : '1px solid transparent',
                  }}>
                  {val}
                </motion.button>
              )
            })}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setTrafficLimitGb(0)
                setIsUnlimitTraffic(true)
              }}
              className={clsx(
                'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
              )}
              style={{
                backgroundColor: `rgba(216, 197, 255, ${isUnlimitTraffic ? 0.3 : 0.15})`,
                border: isUnlimitTraffic
                  ? `1px solid rgba(216, 197, 255, 0.7)`
                  : '1px solid transparent',
              }}>
              Безлимит
            </motion.button>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="flex gap-2 items-end justify-between w-full px-4 ">
          <div className="opacity-50 flex flex-row gap-2 items-center">
            Периодичность оплаты
          </div>
          <div className="flex gap-2 items-center ">
            <TgStar type="gold" w={14} />
            {(user.isTgProgramPartner
              ? price * subscriptions.telegramPartnerProgramRatio
              : price
            ).toFixed(2)}
          </div>
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
          {periodButtons.map((btn: PeriodButtonInterface) => {
            const isActive = btn.key === periodButton.key
            const bgOpacity = isActive ? 0.3 : 0.15
            return (
              <motion.button
                key={btn.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (btn.key === SubscriptionPeriodEnum.INDEFINITELY) {
                    setPeriodMultiplier(1)
                  }
                  setPeriodButton(btn)
                }}
                className={clsx(
                  'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                )}
                style={{
                  backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                  border: isActive
                    ? `1px solid rgba(216, 197, 255, 0.7)`
                    : '1px solid transparent',
                }}>
                {btn.label}{' '}
                {btn.discount < 1 && `(-${100 - btn.discount * 100}%)`}
              </motion.button>
            )
          })}
          {planSelected.serversSelectType ==
            PlansServersSelectTypeEnum.CUSTOM &&
            periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY && (
              <>
                <div className="w-full flex flex-col gap-1 opacity-50">
                  Множитель периода
                </div>
                <button
                  onClick={() =>
                    setPeriodMultiplier(
                      periodMultiplier == 1 ? 1 : periodMultiplier - 1,
                    )
                  }
                  className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                  style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
                  -
                </button>
                <input
                  type="number"
                  placeholder={'Введите число'}
                  value={periodMultiplier || ''}
                  onChange={(e) =>
                    setPeriodMultiplier(
                      e.target.value
                        ? parseInt(e.target.value) < 1
                          ? 1
                          : parseInt(e.target.value)
                        : 1,
                    )
                  }
                  className="border max-w-[100px] border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  onClick={() => setPeriodMultiplier(periodMultiplier + 1)}
                  className="flex grow items-center justify-center text-white px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] "
                  style={{ backgroundColor: 'rgba(216, 197, 255, 0.15)' }}>
                  +
                </button>
                {periodMultiplierButtons.map((val) => {
                  const isActive = periodMultiplier === val
                  const rgb = getButtonColor(val)
                  const bgOpacity = isActive ? 0.3 : 0.15
                  return (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPeriodMultiplier(val)}
                      className={clsx(
                        'flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97]',
                      )}
                      style={{
                        backgroundColor: `rgba(${rgb}, ${bgOpacity})`,
                        border: isActive
                          ? `1px solid rgba(${rgb}, 0.7)`
                          : '1px solid transparent',
                      }}>
                      x{val}
                    </motion.button>
                  )
                })}
              </>
            )}
        </motion.div>
      </div>

      {planSelected.serversSelectType == PlansServersSelectTypeEnum.CUSTOM && (
        <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
          <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
            Опции
          </div>

          <motion.div
            layout
            className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
            <motion.div
              className={clsx(
                'flex flex-row gap-3 items-center justify-between px-4 py-2 text-sm font-mono',
              )}>
              <div className="flex gap-2 items-center">
                <TooltipWrapper
                  prompt={'Подписка автоматически пролиться с вашего баланса'}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
                <div className="opacity-50">Авто продление:</div>
              </div>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="autoRenewalCheckbox"
                  checked={isAutoRenewal}
                  onChange={() => setIsAutoRenewal(!isAutoRenewal)}
                  className="sr-only peer"
                />
                <label
                  htmlFor="autoRenewalCheckbox"
                  className="flex items-center justify-center w-5 h-5 bg-transparent border border-[var(--on-surface)]/50 rounded-md cursor-pointer peer-focus:border-[var(--primary)] peer-focus:ring-2 peer-focus:ring-[var(--primary)]/20 peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                  {isAutoRenewal && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[var(--on-primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </label>
              </div>
            </motion.div>
            <motion.div
              className={clsx(
                'flex flex-row gap-3 items-center justify-between px-4 py-2 text-sm font-mono',
              )}>
              <div className="flex gap-2 items-center">
                <TooltipWrapper
                  prompt={'При продлениях цена никогда не изменится!'}
                  color="info"
                  placement="top">
                  <FaCircleInfo />
                </TooltipWrapper>
                <div className="opacity-50">Зафиксировать цену:</div>
              </div>
              <div className="flex flex-row gap-2 items-center">
                <TgStar type="gold" w={14} />
                {(user.isTgProgramPartner
                  ? subscriptions.fixedPriceStars *
                    subscriptions.telegramPartnerProgramRatio
                  : subscriptions.fixedPriceStars
                ).toFixed(2)}
              </div>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="autoFixedPrice"
                  checked={isFixedPrice}
                  onChange={() => setIsFixedPrice(!isFixedPrice)}
                  className="sr-only peer"
                />
                <label
                  htmlFor="autoFixedPrice"
                  className="flex items-center justify-center w-5 h-5 bg-transparent border border-[var(--on-surface)]/50 rounded-md cursor-pointer peer-focus:border-[var(--primary)] peer-focus:ring-2 peer-focus:ring-[var(--primary)]/20 peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all duration-200 hover:brightness-110 active:scale-[0.97]">
                  {isFixedPrice && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-[var(--on-primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </label>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
          Итого
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
          {resultList.map((el) => {
            if (!el.isVisible) return null
            return (
              <motion.div
                key={el.name}
                className={clsx(
                  'flex flex-row gap-3 items-center justify-between px-4 py-2 text-sm font-mono',
                )}>
                <div className="opacity-50">{el.name}:</div>
                {el.value}
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 items-center w-full">
        {(!isAllBaseServers || !isAllPremiumServers) &&
        serversSelected.length <= 0 ? (
          <div
            className={
              'bg-[var(--warning-container)] text-[var(--on-warning-container)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]'
            }>
            <div className={'flex flex-row gap-2 items-center text-xs'}>
              <FaCircleInfo />
              Выберите хотя бы один сервер!
            </div>
          </div>
        ) : balance >= nextFinalPrice ? (
          <button
            onClick={() => handleClickPurchaseSubscription()}
            disabled={isLoading}
            className={clsx(
              'flex flex-row gap-2 items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-medium text-sm px-4 py-2 rounded-md w-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer max-w-[400px]',
              isLoading && 'opacity-50 pointer-events-none',
            )}>
            {isLoading && (
              <div
                className={'loader'}
                style={{
                  width: '15px',
                  height: '15px',
                  borderWidth: '2px',
                }}></div>
            )}
            Оплатить с баланса <TgStar type={'gold'} w={15} />{' '}
            {nextFinalPrice.toFixed(2)}
          </button>
        ) : (
          <>
            <div
              className={
                'bg-[var(--surface-container)] text-[var(--on-surface)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]'
              }>
              <div className={'flex flex-row gap-2 items-center text-xs'}>
                <FaCircleInfo />
                На вашем балансе недостаточно средств
              </div>
              <Link
                className={
                  'flex flex-row gap-2 items-center justify-center px-4 py-2 bg-[var(--surface-container-high)] rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer text-sm'
                }
                href={`/tma/payment?amount=${Math.ceil(nextFinalPrice - balance)}`}>
                Пополнить баланс на <TgStar type="gold" w={14} />{' '}
                {Math.ceil(nextFinalPrice - balance)}
              </Link>
            </div>
          </>
        )}

        {(!isAllBaseServers || !isAllPremiumServers) &&
        serversSelected.length <= 0 ? (
          <></>
        ) : (
          <>
            <div className="w-full flex gap-2 items-center px-4">
              <div className="h-[1px] grow bg-[var(--primary)]"></div>
              <div className="text-[var(--primary)]">или</div>
              <div className="h-[1px] grow bg-[var(--primary)]"></div>
            </div>
            <button
              onClick={() => handleClickPurchaseInvoiceSubscription()}
              disabled={isLoading}
              className={clsx(
                'flex flex-row gap-2 items-center justify-center bg-[var(--surface-container-lowest)] font-medium text-sm px-4 py-2 rounded-md w-full transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer max-w-[400px]',
                isLoading && 'opacity-50 pointer-events-none',
              )}>
              {isLoading && (
                <div
                  className={'loader'}
                  style={{
                    width: '15px',
                    height: '15px',
                    borderWidth: '2px',
                  }}></div>
              )}
              Оплатить напрямую <TgStar type={'original'} w={15} />
              {Math.ceil(nextFinalPrice)}
            </button>
            <div
              className={
                'bg-[var(--surface-container)] text-[var(--on-surface)] rounded-md flex flex-col gap-2 py-2 px-4 w-full max-w-[400px]'
              }>
              <div className={'flex flex-row gap-2 items-center text-xs'}>
                <FaCircleInfo className={'text-3xl'} />
                {tBill('split')}
              </div>
              <Link
                href={config.SPLIT_TG_REF_URL}
                className={
                  'flex flex-row gap-2 items-center justify-center px-4 py-2 bg-[var(--surface-container-high)] rounded-md transition-all duration-200 hover:brightness-110 active:scale-[0.97] cursor-pointer text-sm'
                }
                target={'_blank'}>
                {tBill('splitBay')} <TgStar type={'original'} w={15} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
