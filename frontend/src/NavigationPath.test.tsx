/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import { MemoryRouter } from 'react-router'
import { navigateToBackCancelLocation, useBackCancelNavigation } from './NavigationPath'

const mockNavigate = jest.fn()

jest.mock('react-router', () => {
  const originalModule = jest.requireActual('react-router')
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: () => mockNavigate,
  }
})

beforeEach(() => {
  mockNavigate.mockClear()
})

describe('navigateToBackCancelLocation', () => {
  it('navigates to the location with back/cancel state applied', () => {
    const navigate = jest.fn()

    navigateToBackCancelLocation(navigate, '/target')

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith('/target', {
      state: { maxBackSteps: 1, cancelSteps: 1 },
    })
  })

  it('preserves existing location state while adding back/cancel state', () => {
    const navigate = jest.fn()

    navigateToBackCancelLocation(navigate, { pathname: '/target', state: { foo: 'bar' } } as any)

    expect(navigate).toHaveBeenCalledWith(
      { pathname: '/target', state: { foo: 'bar' } },
      { state: { foo: 'bar', maxBackSteps: 1, cancelSteps: 1 } }
    )
  })
})

describe('useBackCancelNavigation', () => {
  function wrapperWithState(state?: unknown) {
    return function Wrapper({ children }: PropsWithChildren) {
      return <MemoryRouter initialEntries={[{ pathname: '/current', state }]}>{children}</MemoryRouter>
    }
  }

  describe('nextStep', () => {
    it('increments maxBackSteps/cancelSteps from an intermediate step', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState({ maxBackSteps: 2, cancelSteps: 3 }),
      })

      result.current.nextStep('/next')()

      expect(mockNavigate).toHaveBeenCalledWith('/next', {
        state: { maxBackSteps: 3, cancelSteps: 4 },
      })
    })

    it('starts back/cancel steps at defaults when there is no prior state', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState(undefined),
      })

      result.current.nextStep('/next')()

      expect(mockNavigate).toHaveBeenCalledWith('/next', {
        state: { maxBackSteps: 1, cancelSteps: 0 },
      })
    })

    it('merges state from the provided location object', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState(undefined),
      })

      result.current.nextStep({ pathname: '/next', state: { extra: true } } as any)()

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: '/next', state: { extra: true } },
        { state: { extra: true, maxBackSteps: 1, cancelSteps: 0 } }
      )
    })
  })

  describe('back', () => {
    it('navigates back one history entry when maxBackSteps is set', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState({ maxBackSteps: 2 }),
      })

      result.current.back('/default')()

      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('navigates to the default location when maxBackSteps is not set', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState(undefined),
      })

      result.current.back('/default')()

      expect(mockNavigate).toHaveBeenCalledWith('/default')
    })
  })

  describe('cancel', () => {
    it('navigates back cancelSteps history entries when cancelSteps is set', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState({ cancelSteps: 3 }),
      })

      result.current.cancel('/default')()

      expect(mockNavigate).toHaveBeenCalledWith(-3)
    })

    it('navigates to the default location when cancelSteps is not set', () => {
      const { result } = renderHook(() => useBackCancelNavigation(), {
        wrapper: wrapperWithState(undefined),
      })

      result.current.cancel('/default')()

      expect(mockNavigate).toHaveBeenCalledWith('/default')
    })
  })
})
