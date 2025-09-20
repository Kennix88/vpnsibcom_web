import { authApiClient } from '@app/core/authApiClient'
import { ServersDataInterface } from '@app/types/servers-data.interface'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ServersStore {
  serversData: ServersDataInterface | null
  setServersData: (data: ServersDataInterface) => void
  updateServers: () => Promise<void>
}

export const useServersStore = create<ServersStore>()(
  persist(
    (set) => ({
      serversData: null,
      setServersData: (data) => set({ serversData: data }),
      updateServers: async () => {
        const data = await authApiClient.getServers()
        set({ serversData: data })
      },
    }),
    { name: 'servers-storage' },
  ),
)
