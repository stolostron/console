/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'

export const body = css({
  position: 'relative',
  top: '-35px',
  padding: '0 8px',
  '& section': {
    paddingTop: 'var(--pf-global--spacer--lg)',
  },
})

export const sectionSeparator = css({
  borderBottom: '1px solid #D2D2D2',
  margin: '0 -2rem 1rem -2rem',
  paddingTop: '2rem',
})

export const titleText = css({
  paddingBottom: 'var(--pf-global--spacer--xl)',
  '& h4': {
    color: 'var(--pf-global--Color--200)',
  },
})

export const donutContainer = css({
  maxWidth: '450px',
  paddingBottom: 'var(--pf-global--spacer--md)',
  marginLeft: '-4rem',
})

export const tableTitle = css({
  paddingBottom: 'var(--pf-global--spacer--md)',
})

export const backAction = css({
  paddingBottom: 'var(--pf-global--spacer--lg)',
})

export const subDetailComponents = css({
  paddingBottom: 'var(--pf-global--spacer--xl)',
  '& small': {
    color: 'inherit',
    paddingBottom: 'var(--pf-global--spacer--sm)',
  },
})

export const riskSubDetail = css({
  paddingLeft: 'var(--pf-global--spacer--lg)',
  '& p': {
    fontSize: 'var(--pf-global--FontSize--xs)',
    color: '#5A6872',
  },
})
