/* Copyright Contributors to the Open Cluster Management project */
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

export function initTheme(){
    // Do nothing
}

export function toggleTheme() {
    if (document.documentElement.classList.contains('pf-theme-dark')) {
        document.documentElement.classList.remove('pf-theme-dark')
        localStorage.setItem('theme', 'light')
    } else {
        document.documentElement.classList.add('pf-theme-dark')
        localStorage.setItem('theme', 'dark')
    }
}
