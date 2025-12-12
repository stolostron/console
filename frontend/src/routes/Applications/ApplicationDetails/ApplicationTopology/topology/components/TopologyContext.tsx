/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useState, useMemo, Dispatch, SetStateAction } from 'react'

export type TopologyOptions = {
  setSubscriptionOptions: Dispatch<SetStateAction<boolean>>
}

export const defaultContext = {
  setSubscriptionOptions: () => {},
}

export const TopologyContext = createContext<TopologyOptions>(defaultContext)

export const useTopologyContextValue = () => {
  const [subscriptionOptions, setSubscriptionOptions] = useState<boolean>(false)

  const contextValue = useMemo(
    () => ({
      subscriptionOptions,
      setSubscriptionOptions,
    }),
    [subscriptionOptions]
  )
  return contextValue
}

useTopologyContextValue.context = TopologyContext
