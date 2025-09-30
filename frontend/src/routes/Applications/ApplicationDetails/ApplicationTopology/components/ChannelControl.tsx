/* Copyright Contributors to the Open Cluster Management project */

import React, { Component } from 'react'
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
import { deepEqual } from '../utils'

/**
 * ChannelControl component manages subscription channel selection and pagination
 * for application topology views. It provides:
 * - Dropdown selection for different subscription channels
 * - Pagination controls for subscriptions with multiple resource pages
 * - Tooltip help information for users
 */
class ChannelControl extends Component<ChannelControlProps, ChannelControlState> {
  /**
   * Component constructor
   * @param props - Component props containing channel control data and callbacks
   */
  constructor(props: ChannelControlProps) {
    super(props)
    this.state = {
      currentChannel: {},
    }
  }

  /**
   * Initialize channel control variables when component mounts
   * Sets up the current channel if multiple channels are available
   */
  componentDidMount(): void {
    const { activeChannel, allChannels } = this.props.channelControl ?? { activeChannel: '', allChannels: [] }
    if (allChannels.length > 1) {
      this.fetchCurrentChannel(activeChannel ?? '', allChannels)
    }
  }

  /**
   * Optimize re-renders by comparing channel control props
   * @param nextProps - Next props to compare against current props
   * @returns true if component should update, false otherwise
   */
  shouldComponentUpdate(nextProps: ChannelControlProps): boolean {
    return deepEqual(this.props.channelControl, nextProps.channelControl)
  }

  /**
   * Handle subscription channel change from dropdown selection
   * @param selectedId - ID of the selected channel from dropdown
   * @param displayChannels - Array of available display channels
   */
  handleSubscriptionChange = (selectedId: string, displayChannels: DisplayChannel[]): void => {
    const selectedItem = displayChannels.find((chn) => chn.id === selectedId)
    if (selectedItem) {
      this.changeSubscriptionChannels(selectedItem.chn)
      // Set the current channel to the selected channel
      this.setState({ currentChannel: selectedItem })
      // Close drawer and refresh topology view
      this.props.setDrawerContent?.('Close', false, true, true, true, undefined, true)
    }
  }

  /**
   * Select a channel by its numeric position in the channels array
   * @param channelNb - 1-based channel number to select
   */
  selectChannelByNumber(channelNb: number): void {
    const allChannels = this.props.channelControl?.allChannels ?? []

    const changeToChannel = allChannels.length >= channelNb ? allChannels[channelNb - 1] : null
    if (changeToChannel) {
      this.changeSubscriptionChannels(changeToChannel)
    }
  }

  /**
   * Get the selected channel index for pagination display
   * @param activeChannel - Currently active channel identifier
   * @param allChannels - Array of all available channels
   * @returns 1-based index of the selected channel
   */
  getSelectedIndex = (activeChannel: string, allChannels: SubChannelItem[]): number => {
    let selectedChannelIndex = 1
    if (activeChannel && allChannels) {
      selectedChannelIndex = allChannels.findIndex(({ chnl }) => chnl === activeChannel) + 1
      if (selectedChannelIndex === 0) {
        selectedChannelIndex = 1 // if not found select first one
      }
    }

    return selectedChannelIndex
  }

  /**
   * Parse and organize channels into a structured map with subchannels
   * Channels are expected in format: "namespace/name//subscription/channel///begin///end"
   * @param allChannels - Array of raw channel strings
   * @returns Map of organized channel data with subchannels
   */
  getSubChannels = (allChannels: string[]): Record<string, ChannelItem> => {
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
  }

  /**
   * Find the index of the "All Subscriptions" channel in display channels
   * @param displayChannels - Array of display channels to search
   * @returns Index of the "All Subscriptions" channel, or -1 if not found
   */
  getChannelAllIndex = (displayChannels: DisplayChannel[]): number => {
    return displayChannels.findIndex(({ chn }) => chn === '__ALL__/__ALL__//__ALL__/__ALL__')
  }

  /**
   * Convert channel map to display-ready channels with proper labeling
   * @param channelMap - Organized channel data map
   * @param activeChannel - Currently active channel identifier
   * @returns Tuple of [displayChannels, selectedIndex]
   */
  getDisplayedChannels = (
    channelMap: Record<string, ChannelItem>,
    activeChannel: string
  ): [DisplayChannel[], number] => {
    const displayChannels: DisplayChannel[] = []
    let mainSubscriptionName: string | undefined // name as showing in the combo; pages from the same subscription share the same main name

    Object.values(channelMap).forEach(({ chnl, splitChn, subchannels }) => {
      let channelLabel = splitChn && splitChn[2] ? splitChn[2] : 'unknown'
      if (channelLabel === '__ALL__') {
        channelLabel = this.props.t('All Subscriptions')
      }
      const channelID = channelLabel.replace(/\s+/g, '-').toLowerCase()

      displayChannels.push({
        id: channelID,
        text: channelLabel,
        chn: chnl,
        subchannels,
      })

      // Determine which subscription is currently selected
      if (
        chnl === activeChannel ||
        (subchannels.length > 0 && subchannels.findIndex(({ chnl: subchannel }) => subchannel === activeChannel) !== -1)
      ) {
        mainSubscriptionName = channelLabel
      }
    })

    // Find the index of the selected subscription
    let selectedIdx =
      displayChannels.length === 1 || !mainSubscriptionName
        ? 0
        : displayChannels.findIndex(({ text }) => text === mainSubscriptionName)
    if (selectedIdx < 0) {
      selectedIdx = displayChannels.findIndex(({ chn }) => !!chn)
    }

    return [displayChannels, selectedIdx]
  }

  /**
   * Fetch and set the current channel based on active channel and all available channels
   * Updates component state with the appropriate current channel
   * @param activeChannel - Currently active channel identifier
   * @param allChannels - Array of all available channel strings
   */
  fetchCurrentChannel = (activeChannel: string, allChannels: string[]): void => {
    const { fetchChannel } = this.state
    activeChannel = fetchChannel || activeChannel

    const channelMap = this.getSubChannels(allChannels)
    const channelsData = this.getDisplayedChannels(channelMap, activeChannel)
    const displayChannels = channelsData[0]
    const selectedIdx = channelsData[1]
    let currentChannel: DisplayChannel | null = null

    // Set default current channel on page load
    if (!activeChannel) {
      currentChannel = displayChannels[selectedIdx + 1]
    }

    this.setState({
      currentChannel: currentChannel || displayChannels[selectedIdx],
    })
  }

  /**
   * Extract subscription name from channel string
   * @param channel - Channel string to parse
   * @returns Subscription portion of the channel string
   */
  getChannelSubscription = (channel: string): string => {
    const channelSplit = channel ? channel.split('//') : []
    return channelSplit.length > 0 ? channelSplit[0] : ''
  }

  /**
   * Generate subscription count display text for UI
   * @param displayChannels - Array of display channels
   * @param currentChannel - Currently selected channel
   * @returns Formatted subscription count string
   */
  getSubscriptionCount = (
    displayChannels: DisplayChannel[],
    currentChannel: DisplayChannel | SubChannelItem
  ): string => {
    let subscriptionShowInfo = ''
    const channelsLength = displayChannels.length
    const channelAllIndex = this.getChannelAllIndex(displayChannels)

    if (channelsLength !== -1) {
      const num = channelsLength > 1 ? (channelAllIndex !== -1 ? channelsLength - 1 : channelsLength) : 1
      subscriptionShowInfo =
        (currentChannel as DisplayChannel).chn === '__ALL__/__ALL__//__ALL__/__ALL__'
          ? this.props.t('({{0}} of {{0}})', [num])
          : this.props.t('(1 of {{0}})', [num])
    }
    return subscriptionShowInfo
  }

  /**
   * Get pagination information for the selected subscription
   * @param channelControl - Channel control data
   * @returns Object containing selected subscription and current page information
   */
  getSelectedSubscriptionPage = (channelControl: ChannelControlProps['channelControl']): SelectedSubscriptionData => {
    const { allChannels } = channelControl ?? { allChannels: [] }
    let { activeChannel } = channelControl ?? { activeChannel: '' }
    const { fetchChannel } = this.state
    activeChannel = fetchChannel || activeChannel || allChannels[0]

    const channelMap = this.getSubChannels(allChannels)
    const subscriptionsData = this.getDisplayedChannels(channelMap, activeChannel)
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
  }

  /**
   * Handle pagination navigation events
   * @param e - Event object from pagination component
   * @param action - Type of pagination action ('input', 'first', 'prev', 'next', 'last')
   * @param pageLimit - Maximum number of pages available
   */
  handlePagination = (e: React.SyntheticEvent, action: string, pageLimit?: number): void => {
    const { channelControl } = this.props
    if (!channelControl) return
    const { selectedSubscription, selectedPageForCurrentSubs } = this.getSelectedSubscriptionPage(channelControl)

    if (!selectedSubscription) {
      // subscription not found
      return
    }

    let newPageSelection: SubChannelItem | null = null

    switch (action) {
      case 'input': {
        const target = e.target as HTMLInputElement
        const inputValue = parseInt(target.value, 10)
        if (pageLimit && inputValue > 0 && inputValue <= pageLimit) {
          newPageSelection = selectedSubscription.subchannels[inputValue - 1]
        }
        break
      }
      case 'first': {
        // move to the first page
        if (selectedSubscription.subchannels.length > 0) {
          newPageSelection = selectedSubscription.subchannels[0]
        }
        break
      }
      case 'prev': {
        // move one page down
        if (selectedSubscription.subchannels.length > 0 && selectedPageForCurrentSubs !== 0) {
          newPageSelection = selectedSubscription.subchannels[selectedPageForCurrentSubs - 1]
        }
        break
      }
      case 'next': {
        // move one page up
        if (selectedSubscription.subchannels.length > selectedPageForCurrentSubs) {
          newPageSelection = selectedSubscription.subchannels[selectedPageForCurrentSubs + 1]
        }
        break
      }
      case 'last': {
        // up to the last page
        if (selectedSubscription.subchannels.length > 0) {
          newPageSelection = selectedSubscription.subchannels[selectedSubscription.subchannels.length - 1]
        }
        break
      }
      default:
        break
    }

    if (newPageSelection) {
      // update state information on current channel
      this.setState({ currentChannel: newPageSelection })
      // update selected channel
      this.changeSubscriptionChannels(newPageSelection.chnl)
    }
  }

  /**
   * Render the channel control component
   * @returns JSX element containing subscription dropdown and pagination controls
   */
  render(): React.ReactNode {
    const { channelControl, t } = this.props
    const { currentChannel } = this.state
    if (!channelControl) return null
    const { allChannels } = channelControl

    if (allChannels) {
      // Initialize channel control variables for topology refresh state
      let showMainChannel = true
      let selectedSubscriptionIsPaged = false // true if selected subscription has paged resources
      let selectedSubscriptionPages = 0
      let selectedChannelIndex = 0
      let displayChannels: DisplayChannel[] = []
      let isRefreshing = true
      const maxNodesPerPage = 100

      if (allChannels.length > 1) {
        // Update channel control variables for when refresh state is done
        let { activeChannel } = channelControl
        const { fetchChannel } = this.state
        activeChannel = fetchChannel || activeChannel || allChannels[0]
        const channelMap = this.getSubChannels(allChannels)
        showMainChannel = Object.keys(channelMap).length > 0

        // determine displayed channels
        const channelsData = this.getDisplayedChannels(channelMap, activeChannel)
        displayChannels = channelsData[0]
        const selectedIdx = channelsData[1]

        selectedSubscriptionIsPaged = displayChannels[selectedIdx].subchannels.length > 0
        selectedSubscriptionPages = selectedSubscriptionIsPaged ? displayChannels[selectedIdx].subchannels.length : 0

        selectedChannelIndex = selectedSubscriptionIsPaged
          ? this.getSelectedIndex(activeChannel, displayChannels[selectedIdx].subchannels)
          : 0

        isRefreshing = false
      }

      return (
        <div className="channel-controls-container">
          {/* Show subscription dropdown only when more than one subscription exists */}
          {showMainChannel && (
            <>
              <div className="subscription label">
                {t('Subscriptions')} {this.getSubscriptionCount(displayChannels, currentChannel as DisplayChannel)}
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
                  onSelect={(e) => this.handleSubscriptionChange(e, displayChannels)}
                  text={(currentChannel as DisplayChannel).text}
                  dropdownItems={displayChannels}
                  dropdownPosition="left"
                  isPlain={false}
                  isPrimary={false}
                />
              </div>
            </>
          )}

          {/* Show pagination controls for subscriptions with multiple resource pages */}
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
                  onFirstClick={(e) => this.handlePagination(e, 'first')}
                  onLastClick={(e) => this.handlePagination(e, 'last')}
                  onNextClick={(e) => this.handlePagination(e, 'next')}
                  onPreviousClick={(e) => this.handlePagination(e, 'prev')}
                  onPageInput={(e) => this.handlePagination(e, 'input', selectedSubscriptionPages)}
                />
              </div>
            </>
          )}
        </div>
      )
    }
    return null
  }

  /**
   * Update the active subscription channel
   * @param fetchChannel - Channel identifier to set as active
   */
  changeSubscriptionChannels(fetchChannel: string): void {
    const { channelControl } = this.props
    if (!channelControl) return
    const { setActiveChannel } = channelControl

    if (setActiveChannel) {
      this.setState({ fetchChannel })
      setActiveChannel(fetchChannel)
    }
  }
}

export default ChannelControl
