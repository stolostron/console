/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { makeStyles } from '@mui/styles'
import { Chip, ChipGroup } from '@patternfly/react-core'
import { Fragment } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { AcmModal } from '../../../../../ui-components'

const useStyles = makeStyles({
  root: {
    '& h1, h2': {
      fontFamily: 'RedHatDisplay',
    },
    '& hr': {
      width: 'calc(100% + 50px)',
      margin: '1.2rem -25px',
    },
    '& div > p:first-child': {
      marginBottom: '1rem',
    },
    '& ul': {
      marginInlineStart: '2rem',
      listStyle: 'unset',
      '& li': {
        marginBottom: '0.5rem',
      },
    },
  },
  exampleRow: {
    display: 'flex',
    alignItems: 'center',
    '& p': {
      paddingLeft: '1rem',
      fontSize: 'var(	--pf-global--FontSize--sm)',
    },
    '& > span': {
      margin: '0.4rem 0 !important',
      fontSize: 'var(--pf-global--FontSize--xs)',
      backgroundColor: 'var(--pf-global--palette--blue-50)',
      color: 'var(--pf-global--info-color--200)',
    },
  },
})
export const SearchInfoModal = (props: any) => {
  const { t } = useTranslation()
  const classes = useStyles()
  return (
    <Fragment>
      <AcmModal
        className={classes.root}
        title={t('Search guide')}
        width={'50%'}
        onClose={props.onClose}
        isOpen={props.isOpen}
      >
        <div>
          <h2>{t('Use keywords or property filters to search for resources.')}</h2>
        </div>
        <hr />
        <div>
          <p>{t('To search for a keyword, type the word in the search box.')}</p>
          <div className={classes.exampleRow}>
            <ChipGroup>
              <Chip isReadOnly>{t('Type')}</Chip>
            </ChipGroup>
            <p>OpenShift</p>
          </div>
          <div className={classes.exampleRow}>
            <ChipGroup>
              <Chip isReadOnly>{t('Show')}</Chip>
            </ChipGroup>
            <p>{t('A list of resources that contain the keyword "OpenShift" in any field.')}</p>
          </div>
        </div>
        <hr />
        <div>
          <p>
            {t(
              'To search for resources with a given property value, type or select the property name from the autocomplete list. Then type or select the value for the selected property filter.'
            )}
          </p>
          <div className={classes.exampleRow}>
            <ChipGroup>
              <Chip isReadOnly>{t('Type')}</Chip>
            </ChipGroup>
            <p>status:failed,pending</p>
          </div>
          <div className={classes.exampleRow}>
            <ChipGroup>
              <Chip isReadOnly>{t('Show')}</Chip>
            </ChipGroup>
            <p>{t('Resources with "failed" or "pending" status.')}</p>
          </div>
        </div>
        <hr />
        <div>
          <p>{t('Additional information:')}</p>
          <ul>
            <li>{t('You can include any combination of filters and keywords to make your search more specific.')}</li>
            <li>
              {t(
                'You can apply multiple values to the same property filter. First, type or select the filter name, then select the value. Both values combine into a single filter.'
              )}
            </li>
            <li>
              {t(
                'You can include an operator (<=, >=, !=, !, =, <, >) before a value selection to enhance your search. The search: name:!resourceName, would return all resources not named resourceName.'
              )}
            </li>
          </ul>
        </div>
      </AcmModal>
    </Fragment>
  )
}
