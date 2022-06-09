/* Copyright Contributors to the Open Cluster Management project */
import { Button } from '@patternfly/react-core'
import { MoonIcon, SunIcon } from '@patternfly/react-icons'
import { CSSProperties, useState } from 'react'

export let theme = localStorage.getItem('theme')
if (!theme) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark'
    } else {
        theme = 'light'
    }
}
if (theme === 'dark') {
    document.documentElement.classList.add('pf-theme-dark')
}

export function toggleTheme() {
    if (document.documentElement.classList.contains('pf-theme-dark')) {
        setLightTheme()
    } else {
        setDarkTheme()
    }
}

export function setLightTheme() {
    document.documentElement.classList.remove('pf-theme-dark')
    localStorage.setItem('theme', 'light')
}

export function isDarkTheme() {
    return document.documentElement.classList.contains('pf-theme-dark')
}

export function setDarkTheme() {
    document.documentElement.classList.add('pf-theme-dark')
    localStorage.setItem('theme', 'dark')
}

export function ThemeSwitcher(props: { style?: CSSProperties }) {
    const [light, setLight] = useState(!document.documentElement.classList.contains('pf-theme-dark'))
    return (
        <Button
            onClick={() => {
                toggleTheme()
                setLight(!document.documentElement.classList.contains('pf-theme-dark'))
            }}
            variant="plain"
            icon={light ? <SunIcon /> : <MoonIcon />}
            style={{ ...props.style }}
        />
    )
}
