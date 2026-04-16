/* Copyright Contributors to the Open Cluster Management project */

import React, { useCallback, useEffect, useState } from 'react'
import { AcmDropdown } from '../../../../../ui-components'
import { Pagination, Tooltip } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import {
  ChannelControlProps,
  ChannelControlState,
  DisplayChannel,
  SubChannelItem,
  ChannelItem,
  SelectedSubscriptionData,
} from '../types'

/**
 * ChannelControl component manages subscription channel selection and pagination
 * for application topology views. It provides:
 * - Dropdown selection for different subscription channels
 * - Pagination controls for subscriptions with multiple resource pages
 * - Tooltip help information for users
 */
function ChannelControl({ channelControl, t, setDrawerContent }: ChannelControlProps): React.ReactNode {
  const [currentChannel, setCurrentChannel] = useState<ChannelControlState['currentChannel']>({})
  const [fetchChannel, setFetchChannel] = useState<string | undefined>(undefined)

  const getSubChannels = useCallback((allChannels: string[]): Record<string, ChannelItem> => {
    const channelMap: Record<string, ChannelItem> = {}

    allChannels.forEach((chnl) => {
      const [chn, beg, end] = chnl.split('///')
      const splitChn = /(.*)\/(.*)\/\/(.*)\/(.*)/.exec(chn)
      if (splitChn && splitChn.length === 5) {
        let data = channelMap[chn]
        if (!data) {
          data = channelMap[chn] = { chnl, splitChn, subchannels: [] }
        }
        if (beg && end) {
          data.subchannels.push({ chnl, beg, end, text: splitChn[1] })
        }
      }
    })

    return channelMap
  }, [])

  const getDisplayedChannels = useCallback(
    (channelMap: Record<string, ChannelItem>, activeChannel: string): [DisplayChannel[], number] => {
      const displayChannels: DisplayChannel[] = []
      let mainSubscriptionName: string | undefined

      Object.values(channelMap).forEach(({ chnl, splitChn, subchannels }) => {
        let channelLabel = splitChn && splitChn[2] ? splitChn[2] : 'unknown'
        if (channelLabel === '__ALL__') {
          channelLabel = t('All Subscriptions')
        }
        const channelID = channelLabel.replaceAll(/\s+/g, '-').toLowerCase()

        displayChannels.push({
          id: channelID,
          text: channelLabel,
          chn: chnl,
          subchannels,
        })

        if (
          chnl === activeChannel ||
          (subchannels.length > 0 &&
            subchannels.findIndex(({ chnl: subchannel }) => subchannel === activeChannel) !== -1)
        ) {
          mainSubscriptionName = channelLabel
        }
      })

      let selectedIdx =
        displayChannels.length === 1 || !mainSubscriptionName
          ? 0
          : displayChannels.findIndex(({ text }) => text === mainSubscriptionName)
      if (selectedIdx < 0) {
        selectedIdx = displayChannels.findIndex(({ chn }) => !!chn)
      }

      return [displayChannels, selectedIdx]
    },
    [t]
  )

  useEffect(() => {
    const { activeChannel, allChannels } = channelControl ?? { activeChannel: '', allChannels: [] }
    if (allChannels.length <= 1) {
      return
    }
    const resolvedActive = activeChannel ?? ''
    const channelMap = getSubChannels(allChannels)
    const channelsData = getDisplayedChannels(channelMap, resolvedActive)
    const displayChannels = channelsData[0]
    const selectedIdx = channelsData[1]
    let nextCurrent: DisplayChannel | null = null

    if (!resolvedActive) {
      nextCurrent = displayChannels[selectedIdx + 1]
    }

    setCurrentChannel(nextCurrent || displayChannels[selectedIdx])
    // Match class componentDidMount: initialize once on mount (channelControl from initial render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getSelectedIndex = useCallback((activeChannel: string, allChannels: SubChannelItem[]): number => {
    let selectedChannelIndex = 1
    if (activeChannel && allChannels) {
      selectedChannelIndex = allChannels.findIndex(({ chnl }) => chnl === activeChannel) + 1
      if (selectedChannelIndex === 0) {
        selectedChannelIndex = 1
      }
    }

    return selectedChannelIndex
  }, [])

  const getChannelAllIndex = useCallback((displayChannels: DisplayChannel[]): number => {
    return displayChannels.findIndex(({ chn }) => chn === '__ALL__/__ALL__//__ALL__/__ALL__')
  }, [])

  const changeSubscriptionChannels = useCallback(
    (nextFetchChannel: string): void => {
      if (!channelControl) return
      const { setActiveChannel } = channelControl

      if (setActiveChannel) {
        setFetchChannel(nextFetchChannel)
        setActiveChannel(nextFetchChannel)
      }
    },
    [channelControl]
  )

  const handleSubscriptionChange = useCallback(
    (selectedId: string, displayChannels: DisplayChannel[]): void => {
      const selectedItem = displayChannels.find((chn) => chn.id === selectedId)
      if (selectedItem) {
        changeSubscriptionChannels(selectedItem.chn)
        setCurrentChannel(selectedItem)
        setDrawerContent?.('Close', false, true, true, true, undefined, true)
      }
    },
    [changeSubscriptionChannels, setDrawerContent]
  )

  const getSubscriptionCount = useCallback(
    (displayChannels: DisplayChannel[], currentCh: DisplayChannel | SubChannelItem): string => {
      let subscriptionShowInfo = ''
      const channelsLength = displayChannels.length
      const channelAllIndex = getChannelAllIndex(displayChannels)

      if (channelsLength !== -1) {
        const num = channelsLength > 1 ? (channelAllIndex !== -1 ? channelsLength - 1 : channelsLength) : 1
        subscriptionShowInfo =
          (currentCh as DisplayChannel).chn === '__ALL__/__ALL__//__ALL__/__ALL__'
            ? t('({{0}} of {{0}})', [num])
            : t('(1 of {{0}})', [num])
      }
      return subscriptionShowInfo
    },
    [getChannelAllIndex, t]
  )

  const getSelectedSubscriptionPage = useCallback(
    (cc: ChannelControlProps['channelControl']): SelectedSubscriptionData => {
      const { allChannels } = cc ?? { allChannels: [] }
      let { activeChannel } = cc ?? { activeChannel: '' }
      activeChannel = fetchChannel || activeChannel || allChannels[0]

      const channelMap = getSubChannels(allChannels)
      const subscriptionsData = getDisplayedChannels(channelMap, activeChannel)
      const displayChannels = subscriptionsData[0]
      const selectedIdx = subscriptionsData[1]

      const selectedSubscription = displayChannels.length > selectedIdx ? displayChannels[selectedIdx] : null

      let selectedPageForCurrentSubs = -1
      selectedSubscription?.subchannels.forEach((item) => {
        if ((item.chnl ?? '') === activeChannel) {
          selectedPageForCurrentSubs = selectedSubscription.subchannels.indexOf(item)
        }
      })

      return { selectedSubscription, selectedPageForCurrentSubs }
    },
    [fetchChannel, getDisplayedChannels, getSubChannels]
  )

  const handlePagination = useCallback(
    (e: React.SyntheticEvent, action: string, pageLimit?: number): void => {
      if (!channelControl) return
      const { selectedSubscription, selectedPageForCurrentSubs } = getSelectedSubscriptionPage(channelControl)

      if (!selectedSubscription) {
        return
      }

      let newPageSelection: SubChannelItem | null = null

      switch (action) {
        case 'input': {
          const target = e.target as HTMLInputElement
          const inputValue = Number.parseInt(target.value, 10)
          if (pageLimit && inputValue > 0 && inputValue <= pageLimit) {
            newPageSelection = selectedSubscription.subchannels[inputValue - 1]
          }
          break
        }
        case 'first': {
          if (selectedSubscription.subchannels.length > 0) {
            newPageSelection = selectedSubscription.subchannels[0]
          }
          break
        }
        case 'prev': {
          if (selectedSubscription.subchannels.length > 0 && selectedPageForCurrentSubs !== 0) {
            newPageSelection = selectedSubscription.subchannels[selectedPageForCurrentSubs - 1]
          }
          break
        }
        case 'next': {
          if (selectedSubscription.subchannels.length > selectedPageForCurrentSubs) {
            newPageSelection = selectedSubscription.subchannels[selectedPageForCurrentSubs + 1]
          }
          break
        }
        case 'last': {
          if (selectedSubscription.subchannels.length > 0) {
            newPageSelection = selectedSubscription.subchannels[selectedSubscription.subchannels.length - 1]
          }
          break
        }
        default:
          break
      }

      if (newPageSelection) {
        setCurrentChannel(newPageSelection)
        changeSubscriptionChannels(newPageSelection.chnl)
      }
    },
    [channelControl, changeSubscriptionChannels, getSelectedSubscriptionPage]
  )

  if (!channelControl) return null
  const { allChannels } = channelControl

  if (!allChannels) {
    return null
  }

  let showMainChannel = true
  let selectedSubscriptionIsPaged = false
  let selectedSubscriptionPages = 0
  let selectedChannelIndex = 0
  let displayChannels: DisplayChannel[] = []
  let isRefreshing = true
  const maxNodesPerPage = 100

  if (allChannels.length > 1) {
    let { activeChannel } = channelControl
    activeChannel = fetchChannel || activeChannel || allChannels[0]
    const channelMap = getSubChannels(allChannels)
    showMainChannel = Object.keys(channelMap).length > 0

    const channelsData = getDisplayedChannels(channelMap, activeChannel)
    displayChannels = channelsData[0]
    const selectedIdx = channelsData[1]

    selectedSubscriptionIsPaged = displayChannels[selectedIdx].subchannels.length > 0
    selectedSubscriptionPages = selectedSubscriptionIsPaged ? displayChannels[selectedIdx].subchannels.length : 0

    selectedChannelIndex = selectedSubscriptionIsPaged
      ? getSelectedIndex(activeChannel, displayChannels[selectedIdx].subchannels)
      : 0

    isRefreshing = false
  }

  return (
    <div className="channel-controls-container">
      {showMainChannel && (
        <>
          <div className="subscription label">
            {t('Subscriptions')} {getSubscriptionCount(displayChannels, currentChannel as DisplayChannel)}
            <Tooltip
              isContentLeftAligned
              content={<span className="showPagesTooltip">{t('subscription.page.count.info')}</span>}
            >
              <OutlinedQuestionCircleIcon className="channel-controls-help-icon" />
            </Tooltip>
          </div>

          <div className="channelsCombo">
            <AcmDropdown
              isDisabled={isRefreshing}
              id="comboChannel"
              onSelect={(selectedId) => handleSubscriptionChange(selectedId, displayChannels)}
              text={(currentChannel as DisplayChannel).text}
              dropdownItems={displayChannels}
              dropdownPosition="left"
              isPlain={false}
              isPrimary={false}
            />
          </div>
        </>
      )}

      {selectedSubscriptionIsPaged && (
        <>
          <div className="resourcePaging label">
            {t('Resource nodes')}
            <div className="show-subscription-pages-icon">
              <Tooltip
                isContentLeftAligned
                content={
                  <span className="showPagesTooltip">
                    {t('Use the navigation to view the resources that are deployed by the selected subscription.')}
                  </span>
                }
              >
                <OutlinedQuestionCircleIcon className="channel-controls-help-icon" />
              </Tooltip>
            </div>
          </div>
          <div className="mainPagination">
            <Pagination
              itemCount={selectedSubscriptionPages * maxNodesPerPage}
              perPage={maxNodesPerPage}
              page={selectedChannelIndex}
              onFirstClick={(e) => handlePagination(e, 'first')}
              onLastClick={(e) => handlePagination(e, 'last')}
              onNextClick={(e) => handlePagination(e, 'next')}
              onPreviousClick={(e) => handlePagination(e, 'prev')}
              onPageInput={(e) => handlePagination(e, 'input', selectedSubscriptionPages)}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default ChannelControl
