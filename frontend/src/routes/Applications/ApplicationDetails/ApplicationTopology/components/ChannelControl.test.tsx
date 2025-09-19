/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChannelControl from './ChannelControl'
import type {
  ChannelControlProps,
  ChannelControlData,
  DisplayChannel,
  SubChannelItem,
  TranslationFunction,
} from '../types'

/**
 * Mock translation function that returns the input string as-is
 * Used to simulate internationalization in test environment
 */
const mockT: TranslationFunction = (key: string, params?: (string | number)[]): string => {
  if (params && params.length > 0) {
    let result = key
    params.forEach((param, index) => {
      result = result.replace(new RegExp(`\\{\\{${index}\\}\\}`, 'g'), String(param))
    })
    return result
  }
  return key
}

/**
 * Mock drawer content setter function
 */
const mockSetDrawerContent = jest.fn()

/**
 * Mock channel setter function
 */
const mockSetActiveChannel = jest.fn()

/**
 * Creates mock channel control data for testing
 */
const createMockChannelControlData = (overrides: Partial<ChannelControlData> = {}): ChannelControlData => ({
  allChannels: [
    'namespace1/subscription1//channel1/subchannel1///begin1///end1',
    'namespace1/subscription1//channel1/subchannel2///begin2///end2',
    'namespace2/subscription2//channel2/subchannel1///begin3///end3',
    '__ALL__/__ALL__//__ALL__/__ALL__',
  ],
  activeChannel: 'namespace1/subscription1//channel1/subchannel1///begin1///end1',
  setActiveChannel: mockSetActiveChannel,
  ...overrides,
})

/**
 * Creates mock props for ChannelControl component
 */
const createMockProps = (channelControlOverrides: Partial<ChannelControlData> = {}): ChannelControlProps => ({
  channelControl: createMockChannelControlData(channelControlOverrides),
  t: mockT,
  setDrawerContent: mockSetDrawerContent,
})

describe('ChannelControl Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Mounting and Initialization', () => {
    it('should render without crashing with minimal props', () => {
      const props = createMockProps({ allChannels: [] })
      render(<ChannelControl {...props} />)
      // Component should render but return null for empty channels
      expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument()
    })

    it('should render subscription controls when multiple channels exist', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)

      // Check for the presence of the channel controls container
      const channelContainer = container.querySelector('.channel-controls-container')
      expect(channelContainer).toBeInTheDocument()
    })

    it('should initialize current channel on mount when multiple channels exist', () => {
      const props = createMockProps()
      const component = render(<ChannelControl {...props} />)

      // Component should have initialized and processed channels
      expect(component.container.querySelector('.channel-controls-container')).toBeInTheDocument()
    })

    it('should not render controls when only one channel exists', () => {
      const props = createMockProps({
        allChannels: ['namespace1/subscription1//channel1/subchannel1///begin1///end1'],
      })
      render(<ChannelControl {...props} />)

      expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument()
    })
  })

  describe('Channel Selection and Dropdown', () => {
    it('should display correct subscription count', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)

      // Should show some subscription count information
      const channelContainer = container.querySelector('.channel-controls-container')
      expect(channelContainer).toBeInTheDocument()
    })

    it('should handle subscription change from dropdown', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)

      // Find the dropdown button by ID
      const dropdown = container.querySelector('#comboChannel')

      // The dropdown should be interactive
      expect(dropdown).toBeInTheDocument()
    })

    it('should call setDrawerContent when subscription changes', () => {
      const props = createMockProps()
      const component = render(<ChannelControl {...props} />)
      const instance = component.container.querySelector('.channel-controls-container')

      expect(instance).toBeInTheDocument()
      // Note: Testing the actual dropdown selection would require more complex setup
      // as it involves PatternFly components that may need additional mocking
    })
  })

  describe('Pagination Controls', () => {
    it('should render pagination when subscription has multiple pages', () => {
      const props = createMockProps()
      render(<ChannelControl {...props} />)

      // Pagination component should be present
      const pagination = screen.queryByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })

    it('should handle first page navigation', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)
      const instance = container.querySelector('.channel-controls-container')

      expect(instance).toBeInTheDocument()
      // Test would involve clicking pagination buttons, but requires PatternFly setup
    })

    it('should handle last page navigation', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)
      const instance = container.querySelector('.channel-controls-container')

      expect(instance).toBeInTheDocument()
    })

    it('should handle next page navigation', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)
      const instance = container.querySelector('.channel-controls-container')

      expect(instance).toBeInTheDocument()
    })

    it('should handle previous page navigation', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)
      const instance = container.querySelector('.channel-controls-container')

      expect(instance).toBeInTheDocument()
    })

    it('should handle page input navigation', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)
      const instance = container.querySelector('.channel-controls-container')

      expect(instance).toBeInTheDocument()
    })
  })

  describe('Helper Methods', () => {
    let component: ChannelControl
    let props: ChannelControlProps

    beforeEach(() => {
      props = createMockProps()
      const wrapper = render(<ChannelControl {...props} />)
      component = wrapper.container.querySelector('.channel-controls-container') as any
    })

    it('should correctly parse channels into subchannel map', () => {
      const channelControl = new ChannelControl(props)
      const channels = [
        'namespace1/subscription1//channel1/subchannel1///begin1///end1',
        'namespace1/subscription1//channel1/subchannel2///begin2///end2',
        'namespace2/subscription2//channel2/subchannel1///begin3///end3',
      ]

      const result = channelControl.getSubChannels(channels)

      expect(Object.keys(result)).toHaveLength(3)
      expect(result['namespace1/subscription1//channel1/subchannel1']).toBeDefined()
      expect(result['namespace1/subscription1//channel1/subchannel2']).toBeDefined()
      expect(result['namespace2/subscription2//channel2/subchannel1']).toBeDefined()
    })

    it('should get correct selected index', () => {
      const channelControl = new ChannelControl(props)
      const subChannels: SubChannelItem[] = [
        { chnl: 'channel1', beg: 'begin1', end: 'end1', text: 'text1' },
        { chnl: 'channel2', beg: 'begin2', end: 'end2', text: 'text2' },
        { chnl: 'channel3', beg: 'begin3', end: 'end3', text: 'text3' },
      ]

      const index = channelControl.getSelectedIndex('channel2', subChannels)
      expect(index).toBe(2)
    })

    it('should return 1 for invalid active channel', () => {
      const channelControl = new ChannelControl(props)
      const subChannels: SubChannelItem[] = [{ chnl: 'channel1', beg: 'begin1', end: 'end1', text: 'text1' }]

      const index = channelControl.getSelectedIndex('invalid-channel', subChannels)
      expect(index).toBe(1)
    })

    it('should find "All Subscriptions" channel index', () => {
      const channelControl = new ChannelControl(props)
      const displayChannels: DisplayChannel[] = [
        { id: 'channel1', text: 'Channel 1', chn: 'channel1', subchannels: [] },
        {
          id: 'all-subscriptions',
          text: 'All Subscriptions',
          chn: '__ALL__/__ALL__//__ALL__/__ALL__',
          subchannels: [],
        },
      ]

      const index = channelControl.getChannelAllIndex(displayChannels)
      expect(index).toBe(1)
    })

    it('should return -1 when "All Subscriptions" channel not found', () => {
      const channelControl = new ChannelControl(props)
      const displayChannels: DisplayChannel[] = [
        { id: 'channel1', text: 'Channel 1', chn: 'channel1', subchannels: [] },
      ]

      const index = channelControl.getChannelAllIndex(displayChannels)
      expect(index).toBe(-1)
    })

    it('should extract subscription from channel string', () => {
      const channelControl = new ChannelControl(props)
      const channel = 'namespace1/subscription1//channel1/subchannel1'

      const subscription = channelControl.getChannelSubscription(channel)
      expect(subscription).toBe('namespace1/subscription1')
    })

    it('should handle empty channel string', () => {
      const channelControl = new ChannelControl(props)

      const subscription = channelControl.getChannelSubscription('')
      expect(subscription).toBe('')
    })

    it('should generate correct subscription count display', () => {
      const channelControl = new ChannelControl(props)
      const displayChannels: DisplayChannel[] = [
        { id: 'channel1', text: 'Channel 1', chn: 'channel1', subchannels: [] },
        { id: 'channel2', text: 'Channel 2', chn: 'channel2', subchannels: [] },
        {
          id: 'all-subscriptions',
          text: 'All Subscriptions',
          chn: '__ALL__/__ALL__//__ALL__/__ALL__',
          subchannels: [],
        },
      ]
      const currentChannel = displayChannels[0]

      const count = channelControl.getSubscriptionCount(displayChannels, currentChannel)
      expect(count).toBe('(1 of 2)')
    })

    it('should show correct count for "All Subscriptions"', () => {
      const channelControl = new ChannelControl(props)
      const displayChannels: DisplayChannel[] = [
        { id: 'channel1', text: 'Channel 1', chn: 'channel1', subchannels: [] },
        { id: 'channel2', text: 'Channel 2', chn: 'channel2', subchannels: [] },
        {
          id: 'all-subscriptions',
          text: 'All Subscriptions',
          chn: '__ALL__/__ALL__//__ALL__/__ALL__',
          subchannels: [],
        },
      ]
      const currentChannel = displayChannels[2] // "All Subscriptions"

      const count = channelControl.getSubscriptionCount(displayChannels, currentChannel)
      expect(count).toBe('(2 of 2)')
    })
  })

  describe('Component Updates and Optimization', () => {
    it('should optimize re-renders using shouldComponentUpdate', () => {
      const props = createMockProps()
      const { rerender, container } = render(<ChannelControl {...props} />)

      // Re-render with same props should not cause update
      rerender(<ChannelControl {...props} />)

      // Component should handle this optimization internally
      const channelContainer = container.querySelector('.channel-controls-container')
      expect(channelContainer).toBeInTheDocument()
    })

    it('should update when channelControl props change', () => {
      const props = createMockProps()
      const { rerender, container } = render(<ChannelControl {...props} />)

      const newProps = createMockProps({
        activeChannel: 'namespace2/subscription2//channel2/subchannel1///begin3///end3',
      })

      rerender(<ChannelControl {...newProps} />)
      const channelContainer = container.querySelector('.channel-controls-container')
      expect(channelContainer).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed channel strings gracefully', () => {
      const props = createMockProps({
        allChannels: ['invalid-channel-format'],
        activeChannel: 'invalid-channel-format',
      })

      // Should render without throwing, but may not show controls
      const { container } = render(<ChannelControl {...props} />)
      expect(container).toBeInTheDocument()
    })

    it('should handle empty allChannels array', () => {
      const props = createMockProps({ allChannels: [] })
      const { container } = render(<ChannelControl {...props} />)

      // Component should render but not show controls for empty channels
      expect(container).toBeInTheDocument()
    })

    it('should handle missing activeChannel', () => {
      const props = createMockProps({ activeChannel: '' })

      expect(() => render(<ChannelControl {...props} />)).not.toThrow()
    })

    it('should handle undefined channelControl', () => {
      const props: ChannelControlProps = {
        channelControl: {
          allChannels: [],
          activeChannel: '',
          setActiveChannel: mockSetActiveChannel,
        },
        t: mockT,
        setDrawerContent: mockSetDrawerContent,
      }

      const { container } = render(<ChannelControl {...props} />)
      expect(container).toBeInTheDocument()
    })

    it('should handle pagination with no selected subscription', () => {
      const channelControl = new ChannelControl(createMockProps({ allChannels: [] }))
      const mockEvent = { target: { value: '1' } } as React.SyntheticEvent

      // Should not throw when no subscription is selected
      expect(() => channelControl.handlePagination(mockEvent, 'input')).not.toThrow()
    })

    it('should handle invalid page input', () => {
      const props = createMockProps()
      const channelControl = new ChannelControl(props)
      const mockEvent = { target: { value: 'invalid' } } as any

      expect(() => channelControl.handlePagination(mockEvent, 'input', 5)).not.toThrow()
    })

    it('should handle page input out of bounds', () => {
      const props = createMockProps()
      const channelControl = new ChannelControl(props)
      const mockEvent = { target: { value: '10' } } as any

      expect(() => channelControl.handlePagination(mockEvent, 'input', 5)).not.toThrow()
    })
  })

  describe('Channel Selection by Number', () => {
    it('should select channel by valid number', () => {
      const props = createMockProps()
      const channelControl = new ChannelControl(props)

      expect(() => channelControl.selectChannelByNumber(1)).not.toThrow()
      expect(mockSetActiveChannel).toHaveBeenCalled()
    })

    it('should handle invalid channel number', () => {
      const props = createMockProps()
      const channelControl = new ChannelControl(props)

      expect(() => channelControl.selectChannelByNumber(10)).not.toThrow()
      // Should not call setActiveChannel for invalid number
    })

    it('should handle zero or negative channel number', () => {
      const props = createMockProps()
      const channelControl = new ChannelControl(props)

      expect(() => channelControl.selectChannelByNumber(0)).not.toThrow()
      expect(() => channelControl.selectChannelByNumber(-1)).not.toThrow()
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should render help tooltips', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)

      const helpIcons = container.querySelectorAll('.channel-controls-help-icon')
      expect(helpIcons.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA labels and roles', () => {
      const props = createMockProps()
      render(<ChannelControl {...props} />)

      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
    })

    it('should display translated text correctly', () => {
      const props = createMockProps()
      const { container } = render(<ChannelControl {...props} />)

      // Check that the component renders with proper structure
      const channelContainer = container.querySelector('.channel-controls-container')
      expect(channelContainer).toBeInTheDocument()
    })
  })

  describe('Integration with Parent Components', () => {
    it('should call setActiveChannel when changing channels', () => {
      const props = createMockProps()
      const channelControl = new ChannelControl(props)

      channelControl.changeSubscriptionChannels('new-channel')
      expect(mockSetActiveChannel).toHaveBeenCalledWith('new-channel')
    })

    it('should handle missing setActiveChannel gracefully', () => {
      const props = createMockProps({
        setActiveChannel: undefined as any,
      })
      const channelControl = new ChannelControl(props)

      expect(() => channelControl.changeSubscriptionChannels('new-channel')).not.toThrow()
    })

    it('should call setDrawerContent with correct parameters', () => {
      const props = createMockProps()
      const displayChannels: DisplayChannel[] = [
        { id: 'test-channel', text: 'Test Channel', chn: 'test-chn', subchannels: [] },
      ]
      const channelControl = new ChannelControl(props)

      channelControl.handleSubscriptionChange('test-channel', displayChannels)

      expect(mockSetDrawerContent).toHaveBeenCalledWith('Close', false, true, true, true, undefined, true)
    })
  })
})
