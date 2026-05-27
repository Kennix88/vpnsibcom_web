import { useCurrencyStore } from '@app/store/currency.store'
import { usePaymentMethodsStore } from '@app/store/payment-methods.store'
import { usePlansStore } from '@app/store/plans.store'
import { useRefferlsStore } from '@app/store/referrals.store'
import { useServersStore } from '@app/store/servers.store'
import { useSubscriptionsStore } from '@app/store/subscriptions.store'
import { useUserStore } from '@app/store/user.store'

const STORE_KEYS = [
  'user-storage',
  'currency-storage',
  'payment-methods-storage',
  'plans-storage',
  'referrals-storage',
  'servers-storage',
  'subscriptions-storage',
]

export function resetAllStores() {
  useUserStore.setState({ user: null, accessToken: null })
  useCurrencyStore.setState({ currencies: [], rates: null })
  usePaymentMethodsStore.setState({ methods: [] })
  usePlansStore.setState({ plansData: null })
  useRefferlsStore.setState({ referralsData: null })
  useServersStore.setState({ serversData: null })
  useSubscriptionsStore.setState({ subscriptions: null })

  useUserStore.persist?.clearStorage()
  useCurrencyStore.persist?.clearStorage()
  usePaymentMethodsStore.persist?.clearStorage()
  usePlansStore.persist?.clearStorage()
  useRefferlsStore.persist?.clearStorage()
  useServersStore.persist?.clearStorage()
  useSubscriptionsStore.persist?.clearStorage()

  if (typeof window !== 'undefined') {
    for (const key of STORE_KEYS) {
      window.localStorage.removeItem(key)
    }
  }
}
