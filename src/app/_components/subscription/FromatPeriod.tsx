'use client'
import { SubscriptionPeriodEnum } from '@app/enums/subscription-period.enum'
import { useTranslations } from 'next-intl'

/**
 * Formats subscription period to human-readable string
 * @param period - Subscription period enum value
 * @returns Formatted period string
 */
export default function FormatPeriod({
  period,
}: {
  period: SubscriptionPeriodEnum
}) {
  const t = useTranslations('subscriptions.periods')

  switch (period) {
    case SubscriptionPeriodEnum.HOUR:
      return <>{t('hour')}</>
    case SubscriptionPeriodEnum.DAY:
      return <>{t('day')}</>
    case SubscriptionPeriodEnum.WEEK:
      return <>1 неделя</>
    case SubscriptionPeriodEnum.MONTH:
      return <>{t('month')}</>
    case SubscriptionPeriodEnum.THREE_MONTH:
      return <>{t('threeMonth')}</>
    case SubscriptionPeriodEnum.SIX_MONTH:
      return <>{t('sixMonth')}</>
    case SubscriptionPeriodEnum.YEAR:
      return <>{t('year')}</>
    case SubscriptionPeriodEnum.TWO_YEAR:
      return <>{t('twoYear')}</>
    case SubscriptionPeriodEnum.THREE_YEAR:
      return <>{t('threeYear')}</>
    case SubscriptionPeriodEnum.INDEFINITELY ||
      SubscriptionPeriodEnum.TRAFFIC ||
      SubscriptionPeriodEnum.TRIAL:
      return <>Безсрочно</>
    default:
      return <>{period}</>
  }
}
