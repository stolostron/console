/* Copyright Contributors to the Open Cluster Management project */
import { css } from '@emotion/css'

export const body = css({
  position: 'relative',
  top: '-35px',
  padding: '0 8px',
  '& section': {
    paddingTop: 'var(--pf-t--global--spacer--lg)',
  },
})

export const sectionSeparator = css({
  borderBottom: '1px solid #D2D2D2',
  margin: '0 -2rem 1rem -2rem',
  paddingTop: '2rem',
})

export const titleText = css({
  paddingBottom: 'var(--pf-t--global--spacer--xl)',
  '& h4': {
    color: 'var(--pf-t--global--text--color--200)',
  },
})

export const donutContainer = css({
  maxWidth: '450px',
  paddingBottom: 'var(--pf-t--global--spacer--md)',
  marginLeft: '-4rem',
})

export const tableTitle = css({
  paddingBottom: 'var(--pf-t--global--spacer--md)',
})

export const backAction = css({
  paddingBottom: 'var(--pf-t--global--spacer--lg)',
})

export const subDetailComponents = css({
  paddingBottom: 'var(--pf-t--global--spacer--xl)',
  '& small': {
    color: 'inherit',
    paddingBottom: 'var(--pf-t--global--spacer--sm)',
  },
})

export const riskSubDetail = css({
  paddingLeft: 'var(--pf-t--global--spacer--lg)',
  '& p': {
    fontSize: 'var(--pf-t--global--font--size--xs)',
    color: '#5A6872',
  },
})
