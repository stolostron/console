/* Copyright Contributors to the Open Cluster Management project */
import { Button } from '@patternfly/react-core'
import { MoonIcon, SunIcon } from '@patternfly/react-icons'
import { CSSProperties, useState } from 'react'

// Do not detect dark theme automatically in production for standalone
if (process.env.NODE_ENV === 'development') {
  let theme = localStorage.getItem('theme')
  if (!theme) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark'
    } else {
      theme = 'light'
    }
  }
  if (theme === 'dark') {
    setDarkTheme()
  } else {
    setLightTheme()
  }
}

function isDarkTheme() {
  return (
    document.documentElement.classList.contains('pf-v5-theme-dark') ||
    document.documentElement.classList.contains('pf-v6-theme-dark')
  )
}

function toggleTheme() {
  if (isDarkTheme()) {
    setLightTheme(true)
  } else {
    setDarkTheme(true)
  }
}

export function setLightTheme(save?: boolean) {
  document.documentElement.classList.remove('pf-v5-theme-dark', 'pf-v6-theme-dark')
  if (save) {
    localStorage.setItem('theme', 'light')
  }
}

function setDarkTheme(save?: boolean) {
  document.documentElement.classList.add('pf-v5-theme-dark', 'pf-v6-theme-dark')
  if (save) {
    localStorage.setItem('theme', 'dark')
  }
}

export function ThemeSwitcher(props: { style?: CSSProperties }) {
  const [light, setLight] = useState(!isDarkTheme())
  return (
    <Button
      onClick={() => {
        toggleTheme()
        setLight(!isDarkTheme())
      }}
      variant="plain"
      icon={light ? <SunIcon /> : <MoonIcon />}
      style={{ ...props.style }}
    />
  )
}
