/* Copyright Contributors to the Open Cluster Management project */

let capturedOptions: Record<string, unknown> = {}

jest.mock('@patternfly/react-topology', () => {
  const React = require('react')
  const mockScaleBy = jest.fn()
  const mockFit = jest.fn()
  const mockReset = jest.fn()
  const mockLayout = jest.fn()
  return {
    __mockGraph: { scaleBy: mockScaleBy, fit: mockFit, reset: mockReset, layout: mockLayout },
    useVisualizationController: jest.fn().mockReturnValue({
      getGraph: jest.fn().mockReturnValue({ scaleBy: mockScaleBy, fit: mockFit, reset: mockReset, layout: mockLayout }),
    }),
    createTopologyControlButtons: jest.fn((options: Record<string, unknown>) => {
      capturedOptions = options
      return ['mock-button']
    }),
    defaultControlButtonsOptions: {},
    TopologyControlBar: jest.fn((props: Record<string, unknown>) => {
      return React.createElement('div', { 'data-testid': 'topology-control-bar', className: props.className })
    }),
    action: (fn: () => void) => fn,
  }
})

jest.mock('../css/topology-zoombar.css', () => ({}))

import { render } from '@testing-library/react'
import TopologyZoomBar from './TopologyZoomBar'
import { createTopologyControlButtons, TopologyControlBar } from '@patternfly/react-topology'

const { __mockGraph } = require('@patternfly/react-topology') as { __mockGraph: Record<string, jest.Mock> }
const { scaleBy: mockScaleBy, fit: mockFit, reset: mockReset, layout: mockLayout } = __mockGraph

describe('TopologyZoomBar tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedOptions = {}
  })

  test('renders the topology control bar', () => {
    render(<TopologyZoomBar />)
    expect(TopologyControlBar).toHaveBeenCalled()
  })

  test('TopologyControlBar is called with correct className', () => {
    render(<TopologyZoomBar />)
    expect(TopologyControlBar).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'topology-zoombar',
      }),
      expect.anything()
    )
  })

  test('TopologyControlBar is called with control buttons', () => {
    render(<TopologyZoomBar />)
    expect(TopologyControlBar).toHaveBeenCalledWith(
      expect.objectContaining({
        controlButtons: ['mock-button'],
      }),
      expect.anything()
    )
  })

  test('createTopologyControlButtons is called with correct options when no collapseAllCallback', () => {
    render(<TopologyZoomBar />)
    expect(createTopologyControlButtons).toHaveBeenCalledWith(
      expect.objectContaining({
        expandAll: false,
        collapseAll: false,
        legend: false,
      })
    )
  })

  test('createTopologyControlButtons is called with expandAll/collapseAll enabled when collapseAllCallback is provided', () => {
    const collapseAllCallback = jest.fn()
    render(<TopologyZoomBar collapseAllCallback={collapseAllCallback} />)
    expect(createTopologyControlButtons).toHaveBeenCalledWith(
      expect.objectContaining({
        expandAll: true,
        collapseAll: true,
        legend: false,
      })
    )
  })

  test('zoom in callback scales by 4/3', () => {
    render(<TopologyZoomBar />)
    const zoomInCallback = capturedOptions.zoomInCallback as () => void
    zoomInCallback()
    expect(mockScaleBy).toHaveBeenCalledWith(4 / 3)
  })

  test('zoom out callback scales by 0.75', () => {
    render(<TopologyZoomBar />)
    const zoomOutCallback = capturedOptions.zoomOutCallback as () => void
    zoomOutCallback()
    expect(mockScaleBy).toHaveBeenCalledWith(0.75)
  })

  test('fit to screen callback calls fit with padding of 90', () => {
    render(<TopologyZoomBar />)
    const fitToScreenCallback = capturedOptions.fitToScreenCallback as () => void
    fitToScreenCallback()
    expect(mockFit).toHaveBeenCalledWith(90)
  })

  test('reset view callback resets graph and calls layout', () => {
    render(<TopologyZoomBar />)
    const resetViewCallback = capturedOptions.resetViewCallback as () => void
    resetViewCallback()
    expect(mockReset).toHaveBeenCalled()
    expect(mockLayout).toHaveBeenCalled()
  })
})
