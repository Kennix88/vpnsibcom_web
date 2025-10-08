'use client'

import { authApiClient } from '@app/core/authApiClient'
import { publicApiClient } from '@app/core/publicApiClient'
import { PaymentMethodEnum } from '@app/enums/payment-method.enum'
import { PlansServersSelectTypeEnum } from '@app/enums/plans-servers-select-type.enum'
import { PlansEnum } from '@app/enums/plans.enum'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { TrafficResetEnum } from '@app/enums/traffic-reset.enum'
import { usePlansStore } from '@app/store/plans.store'
import { useServersStore } from '@app/store/servers.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'
import { PlansInterface } from '@app/types/plans.interface'
import { ServerDataInterface } from '@app/types/servers-data.interface'
import {
  CreateSubscriptionDataInterface,
  SubscriptionResponseInterface,
} from '@app/types/subscription-data.interface'
import { UserDataInterface } from '@app/types/user-data.interface'
import {
  calculateDaysByPeriod,
  calculateSubscriptionCost,
} from '@app/utils/calculate-subscription-cost.util'
import { invoice } from '@telegram-apps/sdk-react'
import { addDays, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { TrafficPeriodButtonInterface } from '../subscription/RenewButton'
import TooltipWrapper from '../TooltipWrapper'
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

export default function AddSubscription() {
  const tBill = useTranslations('billing.payment')
  const location = usePathname()
  const url = location.includes('/tma') ? '/tma' : '/app'
  const router = useRouter()

  const { subscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const { serversData, setServersData } = useServersStore()
  const { plansData, setPlansData } = usePlansStore()

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
  const [serverSelected, setServerSelected] =
    useState<ServerDataInterface | null>(null)
  const [periodMultiplier, setPeriodMultiplier] = useState(1)
  const [isUnlimitTraffic, setIsUnlimitTraffic] = useState(false)
  const [trafficLimitGb, setTrafficLimitGb] = useState(1)
  const [isAutoRenewal, setIsAutoRenewal] = useState(true)
  const [planSelected, setPlanSelected] = useState<PlansInterface | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [trafficReset, setTrafficReset] = useState<TrafficResetEnum>(
    TrafficResetEnum.DAY,
  )
  const [name, setName] = useState<string>('Subscription 1')
  const trafficPeriodButtons: TrafficPeriodButtonInterface[] = [
    {
      key: TrafficResetEnum.DAY,
      label: 'Ежедневно',
      minDays: 0,
    },
    {
      key: TrafficResetEnum.WEEK,
      label: 'Еженедельно',
      minDays: 7,
    },
    {
      key: TrafficResetEnum.MONTH,
      label: 'Ежемесячно',
      minDays: 30,
    },
    {
      key: TrafficResetEnum.YEAR,
      label: 'Ежегодно',
      minDays: 360,
    },
  ]
  const [trafficPeriodButton, setTrafficPeriodButton] =
    useState<TrafficPeriodButtonInterface | null>(trafficPeriodButtons[0])

  const balance = useMemo(() => {
    return user?.balance.payment || 0
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

  const privileges = useMemo(
    () => [
      ...(planSelected?.key === PlansEnum.TRAFFIC
        ? [
            {
              key: 'traffic-plan',
              icon: '🤔',
              text: 'Без срока окончания, оплата только за трафик!',
            },
          ]
        : []),
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
            : planSelected?.key === PlansEnum.TRAFFIC
              ? 'Нужное количество трафика'
              : isUnlimitTraffic
                ? 'Безлимитный трафик'
                : `${trafficReset == TrafficResetEnum.DAY ? `${trafficLimitGb} GB трафика ежедневно` : trafficReset == TrafficResetEnum.WEEK ? `${trafficLimitGb * 7} GB трафика еженедельно` : trafficReset == TrafficResetEnum.MONTH ? `${trafficLimitGb * 30} GB трафика ежемесячно` : `${trafficLimitGb * 365} GB трафика ежегодно`}`,
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
      { key: 'no-ads', icon: <MdAdsClick />, text: 'Отсутвие рекламы' },
      {
        key: 'devices-support',
        icon: <MdOutlineDevicesOther />,
        text: 'Широкая поддержка устройств',
      },
      { key: 'xray', icon: <IoShieldHalf />, text: 'Надежное ядро XRAY' },
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
      trafficReset,
    ],
  )

  const price = useMemo(() => {
    if (!user || !subscriptions || !planSelected || !periodButton) {
      return 0
    }

    return calculateSubscriptionCost({
      period: periodButton.key,
      periodMultiplier,
      isPremium: user.isPremium,
      isTgProgramPartner: user.isTgProgramPartner,
      devicesCount,
      serversCount: baseServersCount,
      premiumServersCount,
      trafficLimitGb,
      isAllBaseServers,
      isAllPremiumServers,
      isUnlimitTraffic,
      userDiscount: user.roleDiscount,
      plan: planSelected,
      settings: subscriptions,
    })
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
  ])

  // Загрузка серверов и тарифов
  useEffect(() => {
    let ignore = false

    const fetchData = async () => {
      try {
        const [servers, plans] = await Promise.all([
          authApiClient.getServers(),
          publicApiClient.getPlans(),
        ])

        if (ignore) return

        setServersData({
          baseServersCount: servers.baseServersCount,
          premiumServersCount: servers.premiumServersCount,
          servers: servers.servers,
        })
        setBaseServersCount(servers.baseServersCount)
        setPremiumServersCount(servers.premiumServersCount)
        setUser(servers.user)
        setPlansData(plans)
      } catch {
        if (!ignore) toast.error('Error updating data')
      }
    }

    fetchData()
    return () => {
      ignore = true
    }
  }, [
    setServersData,
    setBaseServersCount,
    setPremiumServersCount,
    setUser,
    setPlansData,
  ])

  // Выбор тарифа после загрузки
  useEffect(() => {
    if (plansData?.plans?.length) {
      selectPlan(plansData.plans[0])
    }
  }, [plansData, selectPlan])

  // Установка кнопок периодов
  useEffect(() => {
    if (!subscriptions || !user) return

    const buttons: PeriodButtonInterface[] = [
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
    setPeriodButton(buttons[3])
  }, [subscriptions, user])

  // TODO: Изменить функцию покупки подписки
  const handlePurchase = async (method: PaymentMethodEnum | 'BALANCE') => {
    if (isLoading || !planSelected || !periodButton) return
    setIsLoading(true)

    try {
      const payload: CreateSubscriptionDataInterface = {
        name: 'sub',
        method: 'BALANCE',
        period: periodButton.key,
        trafficReset: TrafficResetEnum.DAY,
        periodMultiplier,
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
      } = await authApiClient.purchaseSubscription(payload)

      // await setUser(update.user)
      // await setSubscriptions(update.subscriptions)

      if (update.linkPay) {
        await invoice.open(update.linkPay, 'url')
      }
    } catch {
      toast.error('Error updating data')
    } finally {
      setIsLoading(false)
      router.push(url)
    }
  }

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
        price={price}
      />

      <PrivilegesList privileges={privileges} />

      {planSelected.serversSelectType === PlansServersSelectTypeEnum.CUSTOM && (
        <DevicesSelection
          devicesCount={devicesCount}
          setDevicesCount={setDevicesCount}
          user={user}
          subscriptions={subscriptions}
        />
      )}

      {planSelected.serversSelectType !==
        PlansServersSelectTypeEnum.NOT_SELECTED && (
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
          setServerSelected={setServerSelected}
        />
      )}

      {planSelected.key === PlansEnum.TRAFFIC && (
        <TrafficSelection
          trafficLimitGb={trafficLimitGb}
          setTrafficLimitGb={setTrafficLimitGb}
          setIsUnlimitTraffic={setIsUnlimitTraffic}
          price={price}
        />
      )}

      {planSelected.key !== PlansEnum.TRAFFIC && (
        <PaymentPeriod
          periodButtons={periodButtons}
          periodButton={periodButton}
          setPeriodButton={setPeriodButton}
          periodMultiplier={periodMultiplier}
          setPeriodMultiplier={setPeriodMultiplier}
          price={price}
        />
      )}

      {trafficReset !== TrafficResetEnum.NO_RESET &&
        !isUnlimitTraffic &&
        planSelected.key !== PlansEnum.TRAFFIC && (
          <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
            <div className="flex gap-2 items-end justify-between w-full px-4 ">
              <div className="opacity-50 flex flex-row gap-2 items-center">
                Обнуление трафика
              </div>
              <div>
                {trafficPeriodButton?.key == TrafficResetEnum.DAY
                  ? trafficLimitGb
                  : trafficPeriodButton?.key == TrafficResetEnum.WEEK
                    ? trafficLimitGb * 7
                    : trafficPeriodButton?.key == TrafficResetEnum.MONTH
                      ? trafficLimitGb * 30
                      : trafficPeriodButton?.key == TrafficResetEnum.YEAR
                        ? trafficLimitGb * 365
                        : ''}{' '}
                GB
              </div>
            </div>

            <motion.div
              layout
              className="text-sm bg-[var(--surface-container-lowest)] rounded-xl flex flex-row flex-wrap gap-2 items-center p-4 w-full shadow-md">
              {trafficPeriodButtons.map((btn) => {
                const isActive = btn.key === trafficPeriodButton?.key
                const expiresDays = eachDayOfInterval({
                  start: new Date(),
                  end: addDays(
                    new Date(new Date()),
                    calculateDaysByPeriod(periodButton.key, periodMultiplier) ||
                      0,
                  ),
                }).length
                const isDisabled = btn.minDays >= expiresDays
                const bgOpacity = isActive ? 0.3 : 0.15
                return (
                  <motion.button
                    key={btn.key}
                    disabled={isDisabled}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTrafficPeriodButton(btn)
                      setTrafficReset(btn.key)
                    }}
                    className={`flex flex-row gap-2 grow items-center justify-center text-white px-3 py-1.5 rounded-md text-sm font-mono transition-all duration-200 hover:brightness-110 active:scale-[0.97] ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : ' cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: `rgba(216, 197, 255, ${bgOpacity})`,
                      border: isActive
                        ? `1px solid rgba(216, 197, 255, 0.7)`
                        : '1px solid transparent',
                    }}>
                    {btn.label}
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        )}

      {planSelected.key !== PlansEnum.TRAFFIC && (
        <SubscriptionOptions
          isAutoRenewal={isAutoRenewal}
          setIsAutoRenewal={setIsAutoRenewal}
          // user={user}
          // subscriptions={subscriptions}
        />
      )}

      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
          Задайте удобное имя
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
          <motion.div className="flex gap-2 items-center px-4 py-2 text-sm font-mono">
            <TooltipWrapper
              prompt={
                'Имя вашей подписки будет отображаться в списке ваших подписок'
              }
              color="info"
              placement="top">
              <FaCircleInfo />
            </TooltipWrapper>
            <input
              className="border w-full border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
              maxLength={20}
              minLength={1}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </motion.div>
        </motion.div>
      </div>

      <SubscriptionSummary
        planSelected={planSelected}
        devicesCount={devicesCount}
        isUnlimitTraffic={isUnlimitTraffic}
        trafficLimitGb={trafficLimitGb}
        isAllBaseServers={isAllBaseServers}
        isAllPremiumServers={isAllPremiumServers}
        periodButton={periodButton}
        periodMultiplier={periodMultiplier}
        user={user}
        isAutoRenewal={isAutoRenewal}
        price={price}
        subscriptions={subscriptions}
        name={name}
        trafficReset={trafficReset}
        serverSelected={serverSelected}
      />

      <PaymentActions
        isAllBaseServers={isAllBaseServers}
        isAllPremiumServers={isAllPremiumServers}
        serversSelected={serversSelected}
        balance={balance}
        price={price}
        isLoading={isLoading}
        onPayment={(method) => handlePurchase(method)}
      />
    </div>
  )
}
