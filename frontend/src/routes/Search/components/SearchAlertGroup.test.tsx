/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { Fragment, useContext } from 'react'
import { AcmPage, AcmPageContent, AcmPageHeader } from '../../../ui-components'
import { SearchAlertContext, SearchAlertGroup, SearchAlertGroupProvider } from './SearchAlertGroup'

describe('SearchAlertGroupProvider', () => {
  test('SearchAlertGroup should add alert correctly', async () => {
    function Content() {
      const { addSearchAlert, removeSearchAlert } = useContext(SearchAlertContext)
      addSearchAlert({ key: '1', title: 'Alert 1' })
      addSearchAlert({ key: '2', title: 'Alert 2' })
      removeSearchAlert('2')
      return <Fragment />
    }

    const { getByText } = render(
      <AcmPage header={<AcmPageHeader title="Title" />}>
        <AcmPageContent id="page">
          <SearchAlertGroupProvider>
            <SearchAlertGroup />
          </SearchAlertGroupProvider>
          <Content />
        </AcmPageContent>
      </AcmPage>
    )
    waitFor(() => expect(getByText('Alert 1')).toBeInTheDocument())
    waitFor(() => expect(getByText('Alert 2')).not.toBeInTheDocument())
  })
})
