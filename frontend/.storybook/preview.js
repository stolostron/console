/* Copyright Contributors to the Open Cluster Management project */
export const parameters = {
  layout: 'fullscreen',
  backgrounds: {
    default: 'pf-grey',
    values: [
      {
        name: 'pf-grey',
        value: '#f0f0f0',
      },
    ],
  },
}

import '@patternfly/react-core/dist/styles/base.css'
import React, { Suspense, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../src/lib/i18n.ts'

// wrap stories in the I18nextProvider component
const withI18next = (Story, context) => {
  const { locale } = context.globals

  // When the locale global changes
  // Set the new locale in i18n
  useEffect(() => {
    i18n.changeLanguage(locale)
  }, [locale])

  return (
    // This catches the suspense from components not yet ready (still loading translations)
    // Alternative: set useSuspense to false on i18next.options.react when initializing i18next
    <Suspense fallback={<div>loading translations...</div>}>
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    </Suspense>
  )
}

export const decorators = [
  (Story) => (
    <div style={{ height: '100vh' }}>
      <Story />
    </div>
  ),
  withI18next,
]

// Create a global variable called locale in storybook
// and add a menu in the toolbar to change your locale
export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', title: 'English' },
        { value: 'zh', title: 'Chinese (simplified)' },
        { value: 'ja', title: 'Japanese' },
        { value: 'ko', title: 'Korean' },
      ],
      showName: true,
    },
  },
}
