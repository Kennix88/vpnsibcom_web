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
import { CreateSubscriptionDataInterface } from '@app/types/subscription-data.interface'
import {
  calculateDaysByPeriod,
  calculateSubscriptionCost,
  calculateSubscriptionCostNoDiscount,
} from '@app/utils/calculate-subscription-cost.util'
import { invoice } from '@telegram-apps/sdk-react'
import { beginCell, toNano } from '@ton/core'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
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
  const t = useTranslations('billing')
  const location = usePathname()
  const url = location.includes('/tma') ? '/tma' : '/app'
  const router = useRouter()

  const { subscriptions, setSubscriptions } = useSubscriptionsStore()
  const { user, setUser } = useUserStore()
  const { serversData, setServersData } = useServersStore()
  const { plansData, setPlansData } = usePlansStore()
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()

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
  const [name, setName] = useState<string>(t('subscription.name.default'))
  const trafficPeriodButtons: TrafficPeriodButtonInterface[] = [
    {
      key: TrafficResetEnum.DAY,
      label: t('subscription.trafficReset.daily'),
      minDays: 0,
    },
    {
      key: TrafficResetEnum.WEEK,
      label: t('subscription.trafficReset.weekly'),
      minDays: 7,
    },
    {
      key: TrafficResetEnum.MONTH,
      label: t('subscription.trafficReset.monthly'),
      minDays: 30,
    },
    {
      key: TrafficResetEnum.YEAR,
      label: t('subscription.trafficReset.yearly'),
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
              text: t('subscription.privileges.trafficPlan'),
            },
          ]
        : []),
      {
        key: 'devices',
        icon: <MdDevices />,
        text:
          planSelected?.serversSelectType === PlansServersSelectTypeEnum.CUSTOM
            ? t('subscription.privileges.customDevices')
            : t('subscription.privileges.devices', { count: devicesCount }),
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
          t,
        ),
      },
      {
        key: 'traffic',
        icon: <TbCloudNetwork />,
        text:
          planSelected?.serversSelectType === PlansServersSelectTypeEnum.CUSTOM
            ? t('subscription.privileges.customTraffic')
            : planSelected?.key === PlansEnum.TRAFFIC
              ? t('subscription.privileges.customTraffic')
              : isUnlimitTraffic
                ? t('subscription.privileges.traffic')
                : trafficReset == TrafficResetEnum.DAY
                  ? t('subscription.privileges.dailyTraffic', {
                      count: trafficLimitGb,
                    })
                  : trafficReset == TrafficResetEnum.WEEK
                    ? t('subscription.privileges.weeklyTraffic', {
                        count: trafficLimitGb * 7,
                      })
                    : trafficReset == TrafficResetEnum.MONTH
                      ? t('subscription.privileges.monthlyTraffic', {
                          count: trafficLimitGb * 30,
                        })
                      : t('subscription.privileges.yearlyTraffic', {
                          count: trafficLimitGb * 365,
                        }),
      },
      {
        key: 'security',
        icon: <FaShieldHeart />,
        text: t('subscription.privileges.security'),
      },
      {
        key: 'speed',
        icon: <MdTraffic />,
        text: t('subscription.privileges.speed'),
      },
      {
        key: 'masking',
        icon: <BiSolidMask />,
        text: t('subscription.privileges.masking'),
      },
      {
        key: 'no-ads',
        icon: <MdAdsClick />,
        text: t('subscription.privileges.noAds'),
      },
      {
        key: 'devices-support',
        icon: <MdOutlineDevicesOther />,
        text: t('subscription.privileges.devicesSupport'),
      },
      {
        key: 'xray',
        icon: <IoShieldHalf />,
        text: t('subscription.privileges.xray'),
      },
      {
        key: 'opensource',
        icon: <IoLogoGithub />,
        text: t('subscription.privileges.opensource'),
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
      t,
    ],
  )

  const { price, priceNoDiscount } = useMemo(() => {
    if (!user || !subscriptions || !planSelected || !periodButton) {
      return {
        price: 0,
        priceNoDiscount: 0,
      }
    }

    return {
      price: calculateSubscriptionCost({
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
      }),
      priceNoDiscount: calculateSubscriptionCostNoDiscount({
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
        plan: planSelected,
        settings: subscriptions,
      }),
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
        label: t('subscription.period.hour'),
        discount: subscriptions.hourRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.DAY,
        label: t('subscription.period.day'),
        discount: subscriptions.dayRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.WEEK,
        label: t('subscription.period.week'),
        discount: subscriptions.weekRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.MONTH,
        label: t('subscription.period.month'),
        discount: 1,
      },
      {
        key: SubscriptionPeriodEnum.THREE_MONTH,
        label: t('subscription.period.threeMonth'),
        discount: subscriptions.threeMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.SIX_MONTH,
        label: t('subscription.period.sixMonth'),
        discount: subscriptions.sixMouthesRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.YEAR,
        label: t('subscription.period.year'),
        discount: subscriptions.oneYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.TWO_YEAR,
        label: t('subscription.period.twoYear'),
        discount: subscriptions.twoYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.THREE_YEAR,
        label: t('subscription.period.threeYear'),
        discount: subscriptions.threeYearRatioPayment,
      },
      {
        key: SubscriptionPeriodEnum.INDEFINITELY,
        label: t('subscription.period.indefinitely'),
        discount: subscriptions.indefinitelyRatio,
      },
    ]

    setPeriodButtons(buttons)
    setPeriodButton(buttons[3])
  }, [subscriptions, user, t])

  const handlePurchase = async (
    method: PaymentMethodEnum | 'BALANCE' | 'TRAFFIC',
  ) => {
    if (isLoading || !planSelected || !periodButton) return
    if (method === PaymentMethodEnum.TON_TON && !wallet?.account?.address) {
      try {
        await tonConnectUI.openModal()
      } catch {
        toast.error('Error when opening a wallet')
      }
      return
    }
    setIsLoading(true)

    try {
      const payload: CreateSubscriptionDataInterface = {
        name,
        method,
        period: periodButton.key,
        trafficReset,
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

      const data = await authApiClient.purchaseSubscription(payload)

      if (!data.invoice) {
        setUser(data.user)
        setSubscriptions(data.subscriptions)
        toast.success('Subscription purchased successfully')
      } else {
        if (data.invoice?.isTonPayment) {
          const amountNano = toNano(data.invoice?.amountTon.toString())

          // payload с ID платежа в виде комментария
          const payload = beginCell()
            .storeUint(0, 32) // opcode text_comment
            .storeStringTail(data.invoice?.token || '')
            .endCell()

          // транзакция
          const tx = {
            validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
            messages: [
              {
                address: data.invoice?.linkPay || '',
                amount: amountNano.toString(),
                payload: payload.toBoc().toString('base64'),
              },
            ],
          }

          try {
            await tonConnectUI.sendTransaction(tx)
          } catch (err) {
            console.error('Ошибка при оплате', err)
          }
        } else {
          await invoice.open(data.invoice?.linkPay || '', 'url')
        }
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
                {t('subscription.trafficReset.title')}
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

      {planSelected.key !== PlansEnum.TRAFFIC &&
        periodButton.key !== SubscriptionPeriodEnum.INDEFINITELY && (
          <SubscriptionOptions
            isAutoRenewal={isAutoRenewal}
            setIsAutoRenewal={setIsAutoRenewal}
            // user={user}
            // subscriptions={subscriptions}
          />
        )}

      <div className="flex flex-col gap-2 items-center font-extralight font-mono w-full">
        <div className="px-4 opacity-50 flex flex-row gap-2 items-center w-full">
          {t('subscription.name.label')}
        </div>

        <motion.div
          layout
          className="text-sm bg-[var(--surface-container-lowest)] divide-y divide-[var(--primary)] rounded-xl flex flex-col p-4 py-2 w-full shadow-md">
          <motion.div className="flex gap-2 items-center px-4 py-2 text-sm font-mono">
            <TooltipWrapper
              prompt={t('subscription.name.tooltip')}
              color="info"
              placement="top">
              <FaCircleInfo />
            </TooltipWrapper>
            <input
              className="border w-full border-[var(--on-surface)]/50 rounded-md px-2 py-1 bg-transparent focus:border-[var(--primary)] focus:outline-none"
              maxLength={20}
              minLength={1}
              type="text"
              placeholder={t('subscription.name.placeholder')}
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
        priceNoDiscount={priceNoDiscount}
        subscriptions={subscriptions}
        name={name}
        trafficReset={trafficReset}
        serverSelected={serverSelected}
      />

      <PaymentActions
        planSelected={planSelected}
        isAllBaseServers={isAllBaseServers}
        isAllPremiumServers={isAllPremiumServers}
        serversSelected={serversSelected}
        balance={balance}
        price={price}
        priceNoDiscount={priceNoDiscount}
        isLoading={isLoading}
        trafficLimitGb={trafficLimitGb}
        trafficBalance={user.balance.traffic}
        onPayment={(method) => handlePurchase(method)}
      />
    </div>
  )
}
