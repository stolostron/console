/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { setLightTheme, ThemeSwitcher } from './theme'

const DARK_CLASS = 'pf-v6-theme-dark'

describe('theme', () => {
  afterEach(() => {
    document.documentElement.classList.remove(DARK_CLASS)
    localStorage.removeItem('theme')
  })

  describe('setLightTheme', () => {
    it('removes the PatternFly dark class', () => {
      document.documentElement.classList.add(DARK_CLASS)

      setLightTheme()

      expect(document.documentElement).not.toHaveClass(DARK_CLASS)
    })

    it('does not persist the choice unless asked to', () => {
      setLightTheme()

      expect(localStorage.getItem('theme')).toBeNull()
    })

    it('persists the choice when asked to', () => {
      setLightTheme(true)

      expect(localStorage.getItem('theme')).toBe('light')
    })
  })

  describe('ThemeSwitcher', () => {
    it('switches to dark and persists the choice', async () => {
      render(<ThemeSwitcher />)

      await userEvent.click(screen.getByRole('button'))

      expect(document.documentElement).toHaveClass(DARK_CLASS)
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('switches back to light and persists the choice', async () => {
      document.documentElement.classList.add(DARK_CLASS)
      render(<ThemeSwitcher />)

      await userEvent.click(screen.getByRole('button'))

      expect(document.documentElement).not.toHaveClass(DARK_CLASS)
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(<ThemeSwitcher />)

      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
