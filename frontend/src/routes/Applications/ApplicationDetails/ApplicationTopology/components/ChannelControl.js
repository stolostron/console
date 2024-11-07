/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { Component } from 'react'
import R from 'ramda'
import PropTypes from 'prop-types'
import { AcmDropdown } from '../../../../../ui-components'
import { Pagination, Tooltip } from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons'
import _ from 'lodash'

class ChannelControl extends Component {
  static propTypes = {
    channelControl: PropTypes.shape({
      allChannels: PropTypes.array,
      activeChannel: PropTypes.string,
      setActiveChannel: PropTypes.func,
    }),
    t: PropTypes.func,
    setDrawerContent: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      currentChannel: {},
    }
  }

  componentDidMount() {
    // Initialize channel control variables for topology refresh state
    const { activeChannel, allChannels } = this.props.channelControl
    if (allChannels.length > 1) {
      this.fetchCurrentChannel(activeChannel, allChannels)
    }
  }

  shouldComponentUpdate(nextProps) {
    return _.isEqual(this.props.channelControl, nextProps.channelControl)
  }

  handleSubscriptionChange = (e, displayChannels) => {
    const selectedItem = displayChannels.find((chn) => chn.id === e)
    this.changeSubscriptionChannels(selectedItem.chn)
    // Set the current channel to the selected channel
    this.setState({ currentChannel: selectedItem })
    this.props.setDrawerContent('Close', false, true, true, true, undefined, true)
  }

  selectChannelByNumber(channelNb) {
    const allChannels = R.pathOr([], ['channelControl', 'allChannels'])(this.props)

    const changeToChannel = allChannels.length >= channelNb ? allChannels[channelNb - 1] : null
    this.changeSubscriptionChannels(changeToChannel)
  }

  getSelectedIndex = (activeChannel, allChannels) => {
    let selectedChannelIndex = 1
    if (activeChannel && allChannels) {
      selectedChannelIndex = allChannels.findIndex(({ chnl }) => chnl === activeChannel) + 1
      if (selectedChannelIndex === 0) {
        selectedChannelIndex = 1 //if not found select first one
      }
    }

    return selectedChannelIndex
  }

  getSubChannels = (allChannels) => {
    const channelMap = {}

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

  getChannelAllIndex = (displayChannels) => {
    // find the index for all susbcriptions
    return displayChannels.findIndex(({ chn }) => chn === '__ALL__/__ALL__//__ALL__/__ALL__')
  }

  getDisplayedChannels = (channelMap, activeChannel) => {
    // construct display channels and the selected channel index
    const displayChannels = []
    let mainSubscriptionName //name as showing in the combo; pages from the same subscription share the same main name

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
      if (
        chnl === activeChannel ||
        (subchannels.length > 0 && subchannels.findIndex(({ chnl: subchannel }) => subchannel === activeChannel) !== -1)
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
    //displayChannels = all subscriptions showing in the combo, with paging information(subChannels)
    //selectedIdx = index of the channel (within subChannels list) showing in the topology
    return [displayChannels, selectedIdx]
  }

  fetchCurrentChannel = (activeChannel, allChannels) => {
    // Update channel control variables for when refresh state is done
    const { fetchChannel } = this.state
    activeChannel = fetchChannel || activeChannel

    const channelMap = this.getSubChannels(allChannels)

    // determine displayed channels
    const channelsData = this.getDisplayedChannels(channelMap, activeChannel)
    const displayChannels = channelsData[0]
    const selectedIdx = channelsData[1]
    let currentChannel = null

    // Set default current channel on page load
    if (!activeChannel) {
      currentChannel = displayChannels[selectedIdx + 1]
    }

    this.setState({
      currentChannel: currentChannel || displayChannels[selectedIdx],
    })
  }

  getChannelSubscription = (channel) => {
    const channelSplit = channel ? channel.split('//') : []

    return channelSplit.length > 0 ? channelSplit[0] : ''
  }

  getSubscriptionCount = (displayChannels, currentChannel) => {
    // count subscription amount and renders corresponding message
    let subscriptionShowInfo
    const channelsLength = displayChannels.length
    const channelAllIndex = this.getChannelAllIndex(displayChannels)
    if (channelsLength !== -1) {
      const num = channelsLength > 1 ? (channelAllIndex !== -1 ? channelsLength - 1 : channelsLength) : 1
      subscriptionShowInfo =
        currentChannel.chn === '__ALL__/__ALL__//__ALL__/__ALL__'
          ? this.props.t('({{0}} of {{0}})', [num])
          : this.props.t('(1 of {{0}})', [num])
    }
    return subscriptionShowInfo
  }

  //for paged subscriptions give the selected subscription current page number
  getSelectedSubscriptionPage = (channelControl) => {
    const { allChannels } = channelControl
    let { activeChannel } = channelControl
    const { fetchChannel } = this.state
    activeChannel = fetchChannel || activeChannel || allChannels[0]

    const channelMap = this.getSubChannels(allChannels)

    // determine displayed subscriptions ( returns all subscriptions and the index for the selected subscription)
    const subscriptionsData = this.getDisplayedChannels(channelMap, activeChannel)
    const displayChannels = subscriptionsData[0]
    const selectedIdx = subscriptionsData[1]

    const selectedSubscription = displayChannels.length > selectedIdx ? displayChannels[selectedIdx] : null

    let selectedPageForCurrentSubs = -1
    selectedSubscription?.subchannels.forEach((item) => {
      if (_.get(item, 'chnl', '') === activeChannel) {
        selectedPageForCurrentSubs = selectedSubscription.subchannels.indexOf(item)
      }
    })

    return { selectedSubscription, selectedPageForCurrentSubs }
  }

  handlePagination = (e, action, pageLimit) => {
    const { channelControl = {} } = this.props
    const { selectedSubscription, selectedPageForCurrentSubs } = this.getSelectedSubscriptionPage(channelControl)

    if (!selectedSubscription) {
      //subscription not found
      return
    }
    let newPageSelection = null
    switch (action) {
      case 'input': {
        if (e.target.value > 0 && e.target.value <= pageLimit) {
          newPageSelection = selectedSubscription.subchannels[e.target.value - 1]
        }
        break
      }
      case 'first': {
        //move to the first page
        if (selectedSubscription.subchannels.length > 0) {
          newPageSelection = selectedSubscription.subchannels[0]
        }
        break
      }
      case 'prev': {
        //move one page down
        if (selectedSubscription.subchannels.length > 0 && selectedPageForCurrentSubs !== 0) {
          newPageSelection = selectedSubscription.subchannels[selectedPageForCurrentSubs - 1]
        }
        break
      }
      case 'next': {
        //move one page up
        if (selectedSubscription.subchannels.length > selectedPageForCurrentSubs) {
          newPageSelection = selectedSubscription.subchannels[selectedPageForCurrentSubs + 1]
        }
        break
      }
      case 'last': {
        //up to the last page
        if (selectedSubscription.subchannels.length > 0) {
          newPageSelection = selectedSubscription.subchannels[selectedSubscription.subchannels.length - 1]
        }
        break
      }
      default:
        break
    }

    if (newPageSelection) {
      //update state information on current channel
      this.setState({ currentChannel: newPageSelection })
      //update selected channel
      this.changeSubscriptionChannels(newPageSelection.chnl)
    }
  }

  render() {
    const { channelControl = {}, t } = this.props
    const { currentChannel } = this.state
    const { allChannels } = channelControl

    if (allChannels) {
      // Initialize channel control variables for topology refresh state
      let showMainChannel = true
      let selectedSubscriptionIsPaged = false //true if selected subscription has paged resources
      let selectedSubscriptionPages = 0
      let selectedChannelIndex = 0
      let displayChannels = []
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
        // show subscription names only when more than one
        <div className="channel-controls-container">
          {showMainChannel && (
            <>
              <div className="subscription label">
                {t('Subscriptions')} {this.getSubscriptionCount(displayChannels, currentChannel)}
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
                  text={currentChannel.text}
                  dropdownItems={displayChannels}
                  position="left"
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

  changeSubscriptionChannels(fetchChannel) {
    const { channelControl = {} } = this.props
    const { setActiveChannel } = channelControl

    if (setActiveChannel) {
      this.setState({ fetchChannel })
      setActiveChannel(fetchChannel)
    }
  }
}

export default ChannelControl
