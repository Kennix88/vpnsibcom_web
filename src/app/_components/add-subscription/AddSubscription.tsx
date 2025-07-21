'use client'

import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { usePlansStore } from '@app/store/plans.store'
import { useServersStore } from '@app/store/servers.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { PlansInterface } from '@app/types/plans.interface'
import { SubscriptionResponseInterface } from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import { calculateSubscriptionCost } from '@app/utils/calculate-subscription-cost.util'
import { invoice } from '@telegram-apps/sdk-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BiServer, BiSolidMask } from 'react-icons/bi'
import { FaShieldHeart } from 'react-icons/fa6'
import { IoLogoGithub, IoShieldHalf } from 'react-icons/io5'
import {
  MdAdsClick,
  MdDevices,
  MdOutlineDevicesOther,
  MdTraffic,
} from 'react-icons/md'
import { TbCloudNetwork } from 'react-icons/tb'
import { toast } from 'react-toastify'
import { DevicesSelection } from './DevicesSelection'
import { getServersText } from './functions'
import { PaymentActions } from './PaymentActions'
import { PaymentPeriod } from './PaymentPeriod'
import { PlanSelection } from './PlanSelection'
import { PrivilegesList } from './PrivilegesList'
import { ServersSelection } from './ServersSelection'
import { SubscriptionOptions } from './SubscriptionOptions'
import { SubscriptionSummary } from './SubscriptionSummary'
import { TrafficSelection } from './TrafficSelection'

export interface PeriodButtonInterface {
  key: SubscriptionPeriodEnum
  label: string
  discount: number
}

// Основной компонент
export default function AddSubscription() {
  const tBill = useTranslations('billing.payment')
  const location = usePathname()
  const url = location.includes('/tma') ? '/tma' : '/app'
  const router = useRouter()

  // Zustand stores
  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const { serversData, setServersData } = useServersStore()
  const { plansData, setPlansData } = usePlansStore()

  // Состояния компонента
  const [periodButton, setPeriodButton] =
    useState<PeriodButtonInterface | null>(null)
  const [periodButtons, setPeriodButtons] = useState<PeriodButtonInterface[]>(
    [],
  )
  const [devicesCount, setDevicesCount] = useState(1)
  const [isAllBaseServers, setIsAllBaseServers] = useState(true)
  const [isAllPremiumServers, setIsAllPremiumServers] = useState(true)
  const [baseServersCount, setBaseServersCount] = useState(0)
  const [premiumServersCount, setPremiumServersCount] = useState(0)
  const [serversSelected, setServersSelected] = useState<string[]>([])
  const [isFixedPrice, setIsFixedPrice] = useState(false)
  const [periodMultiplier, setPeriodMultiplier] = useState(1)
  const [isUnlimitTraffic, setIsUnlimitTraffic] = useState(false)
  const [trafficLimitGb, setTrafficLimitGb] = useState(1)
  const [isAutoRenewal, setIsAutoRenewal] = useState(true)
  const [planSelected, setPlanSelected] = useState<PlansInterface | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Мемоизированные значения
  const balance = useMemo(() => {
    return user?.balance.isUseWithdrawalBalance
      ? user.balance.paymentBalance + user.balance.withdrawalBalance
      : user?.balance.paymentBalance || 0
  }, [user])

  const selectPlan = useCallback(
    (plan: PlansInterface) => {
      setPlanSelected(plan)
      setDevicesCount(plan.devicesCount)
      setIsAllBaseServers(plan.isAllBaseServers)
      setIsAllPremiumServers(plan.isAllPremiumServers)
      setIsUnlimitTraffic(plan.isUnlimitTraffic)
      setTrafficLimitGb(plan.trafficLimitGb ?? 0)

      if (!serversData) return

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

  // Привилегии тарифа
  const privileges = useMemo(
    () => [
      {
        key: 'devices',
        icon: <MdDevices />,
        text:
          planSelected?.serversSelectType === PlansServersSelectTypeEnum.CUSTOM
            ? 'Нужное количество устройств'
            : `До ${devicesCount} одновременных устройств`,
      },
      {
        key: 'servers',
        icon: <BiServer />,
        text: getServersText(
          planSelected,
          isAllBaseServers,
          isAllPremiumServers,
          baseServersCount,
          premiumServersCount,
        ),
      },
      {
        key: 'traffic',
        icon: <TbCloudNetwork />,
        text:
          planSelected?.serversSelectType === PlansServersSelectTypeEnum.CUSTOM
            ? 'Нужное количество трафика'
            : isUnlimitTraffic
              ? 'Безлимитный трафик'
              : `${trafficLimitGb} ГБ трафика ежедневно`,
      },
      {
        key: 'security',
        icon: <FaShieldHeart />,
        text: 'Защищенное соединение',
      },
      {
        key: 'speed',
        icon: <MdTraffic />,
        text: 'Без ограничений на скорость',
      },
      {
        key: 'masking',
        icon: <BiSolidMask />,
        text: 'Маскировка вашего трафика',
      },
      {
        key: 'no-ads',
        icon: <MdAdsClick />,
        text: 'Отсутвие рекламы',
      },
      {
        key: 'devices-support',
        icon: <MdOutlineDevicesOther />,
        text: 'Широкая поддержка устройств',
      },
      {
        key: 'xray',
        icon: <IoShieldHalf />,
        text: 'Надежное ядро XRAY',
      },
      {
        key: 'opensource',
        icon: <IoLogoGithub />,
        text: 'Открытый исходный код',
      },
    ],
    [
      planSelected,
      devicesCount,
      isAllBaseServers,
      isAllPremiumServers,
      baseServersCount,
      premiumServersCount,
      isUnlimitTraffic,
      trafficLimitGb,
    ],
  )

  // Расчет цены
  const { price, nextFinalPrice } = useMemo(() => {
    if (!user || !subscriptions || !planSelected || !periodButton) {
      return { price: 0, finalPrice: 0, nextFinalPrice: 0 }
    }

    const basePrice = calculateSubscriptionCost({
      period: periodButton.key,
      periodMultiplier,
      isPremium: user.isPremium,
      devicesCount,
      serversCount: baseServersCount,
      premiumServersCount,
      trafficLimitGb,
      isAllBaseServers,
      isAllPremiumServers,
      isUnlimitTraffic,
      userDiscount: Math.min(Math.max(user.roleDiscount, 0), 1),
      plan: planSelected,
      settings: subscriptions,
    })

    const withFixedPrice = isFixedPrice
      ? basePrice + subscriptions.fixedPriceStars
      : basePrice

    const withPartnerDiscount = user.isTgProgramPartner
      ? withFixedPrice * subscriptions.telegramPartnerProgramRatio
      : withFixedPrice

    return {
      price: basePrice,
      finalPrice: withFixedPrice,
      nextFinalPrice: withPartnerDiscount,
    }
  }, [
    user,
    subscriptions,
    planSelected,
    periodButton,
    periodMultiplier,
    devicesCount,
    baseServersCount,
    premiumServersCount,
    trafficLimitGb,
    isAllBaseServers,
    isAllPremiumServers,
    isUnlimitTraffic,
    isFixedPrice,
  ])

  // Загрузка данных при монтировании
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servers, plans] = await Promise.all([
          authApiClient.getServers(),
          publicApiClient.getPlans(),
        ])

        setServersData({
          baseServersCount: servers.baseServersCount,
          premiumServersCount: servers.premiumServersCount,
          servers: servers.servers,
        })
        setBaseServersCount(servers.baseServersCount)
        setPremiumServersCount(servers.premiumServersCount)
        setUser(servers.user)

        setPlansData(plans)
        selectPlan(plans.plans[0])
      } catch {
        toast.error('Error updating data')
      }
    }

    fetchData()
  }, [selectPlan, setPlansData, setServersData, setUser])

  // Установка периодов оплаты
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
      { key: SubscriptionPeriodEnum.MONTH, label: '1 месяц', discount: 1 },
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
    setPeriodButton(buttons[3]) // По умолчанию выбираем 1 месяц
  }, [subscriptions, user])

  // Обработчики действий
  const handlePurchase = async (isInvoice = false) => {
    if (!planSelected || !periodButton) return

    setIsLoading(true)
    try {
      const payload = {
        period: periodButton.key,
        periodMultiplier,
        isFixedPrice,
        devicesCount,
        isAllBaseServers,
        isAllPremiumServers,
        trafficLimitGb,
        isUnlimitTraffic,
        servers: serversSelected,
        isAutoRenewal,
        planKey: planSelected.key,
      }

      const update: {
        subscriptions: SubscriptionResponseInterface
        user: UserDataInterface
        linkPay?: string
        isTmaIvoice?: boolean
      } = isInvoice
        ? await authApiClient.purchaseInvoiceSubscription({
            ...payload,
            method: PaymentMethodEnum.STARS,
          })
        : await authApiClient.purchaseSubscription(payload)

      setUser(update.user)
      setSubscriptions(update.subscriptions)

      if (isInvoice && update.linkPay) {
        await invoice.open(update.linkPay, 'url')
      }

      router.push(url)
    } catch {
      toast.error('Error updating data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClickPurchaseSubscription = () => handlePurchase(false)
  const handleClickPurchaseInvoiceSubscription = () => handlePurchase(true)

  // Проверка условий рендеринга
  if (
    !subscriptions ||
    !user ||
    !periodButton ||
    !serversData ||
    !plansData ||
    !planSelected
  ) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 items-center w-full max-w-[400px]">
      <PlanSelection
        plans={plansData.plans}
        planSelected={planSelected}
        onSelect={selectPlan}
        user={user}
        subscriptions={subscriptions}
        price={price}
      />

      <PrivilegesList privileges={privileges} />

      {planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM && (
        <>
          <DevicesSelection
            devicesCount={devicesCount}
            setDevicesCount={setDevicesCount}
            user={user}
            subscriptions={subscriptions}
          />

          <ServersSelection
            serversData={serversData}
            planSelected={planSelected}
            serversSelected={serversSelected}
            setServersSelected={setServersSelected}
            isAllBaseServers={isAllBaseServers}
            setIsAllBaseServers={setIsAllBaseServers}
            isAllPremiumServers={isAllPremiumServers}
            setIsAllPremiumServers={setIsAllPremiumServers}
            setBaseServersCount={setBaseServersCount}
            setPremiumServersCount={setPremiumServersCount}
            baseServersCount={baseServersCount}
            premiumServersCount={premiumServersCount}
            user={user}
            subscriptions={subscriptions}
          />

          <TrafficSelection
            trafficLimitGb={trafficLimitGb}
            setTrafficLimitGb={setTrafficLimitGb}
            isUnlimitTraffic={isUnlimitTraffic}
            setIsUnlimitTraffic={setIsUnlimitTraffic}
            user={user}
            subscriptions={subscriptions}
          />
        </>
      )}

      <PaymentPeriod
        periodButtons={periodButtons}
        periodButton={periodButton}
        setPeriodButton={setPeriodButton}
        periodMultiplier={periodMultiplier}
        setPeriodMultiplier={setPeriodMultiplier}
        planSelected={planSelected}
        user={user}
        subscriptions={subscriptions}
        price={price}
      />

      {planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM && (
        <SubscriptionOptions
          isAutoRenewal={isAutoRenewal}
          setIsAutoRenewal={setIsAutoRenewal}
          isFixedPrice={isFixedPrice}
          setIsFixedPrice={setIsFixedPrice}
          user={user}
          subscriptions={subscriptions}
        />
      )}

      <SubscriptionSummary
        planSelected={planSelected}
        devicesCount={devicesCount}
        isUnlimitTraffic={isUnlimitTraffic}
        trafficLimitGb={trafficLimitGb}
        isAllBaseServers={isAllBaseServers}
        isAllPremiumServers={isAllPremiumServers}
        baseServersCount={baseServersCount}
        premiumServersCount={premiumServersCount}
        periodButton={periodButton}
        periodMultiplier={periodMultiplier}
        user={user}
        isFixedPrice={isFixedPrice}
        isAutoRenewal={isAutoRenewal}
        price={price}
        nextFinalPrice={nextFinalPrice}
        subscriptions={subscriptions}
      />

      <PaymentActions
        isAllBaseServers={isAllBaseServers}
        isAllPremiumServers={isAllPremiumServers}
        serversSelected={serversSelected}
        balance={balance}
        nextFinalPrice={nextFinalPrice}
        isLoading={isLoading}
        onBalancePayment={handleClickPurchaseSubscription}
        onInvoicePayment={handleClickPurchaseInvoiceSubscription}
        tBill={tBill}
      />
    </div>
  )
}
