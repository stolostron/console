/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'

import userEvent from '@testing-library/user-event'
import { AcmLogWindow } from './AcmLogWindow'

describe('AcmLogWindow', () => {
  const onSwitchContainerClick = jest.fn()
  const LogWindow = () => (
    <AcmLogWindow
      id={'log-window'}
      cluster={'clusterName'}
      namespace={'namespaceName'}
      initialContainer={'container1'}
      containers={['container1', 'container2']}
      onSwitchContainer={onSwitchContainerClick}
      logs={
        'Testing log lines1\nTesting log lines2\nTesting log lines3\nTesting log lines4\nTesting log lines5\nTesting log lines6\nTesting log lines7\nTesting log lines8\nTesting log lines9\nTesting log lines10\nTesting log lines11\nTesting log lines12\nTesting log lines13\nTesting log lines14\nTesting log lines15\nTesting log lines16\nTesting log lines17\nTesting log lines18\nTesting log lines19\nTesting log lines20\nTesting log lines21\nTesting log lines22\nTesting log lines23\nTesting log lines24\nTesting log lines25\nTesting log lines26\nTesting log lines27\nTesting log lines28\nTesting log lines29\n'
      }
    />
  )

  test('renders', () => {
    const { getByTestId } = render(<LogWindow />)
    expect(getByTestId('log-window-lines-container').textContent).toContain('Testing log lines1')
  })

  test('Handles switching container click', () => {
    const { getByText } = render(<LogWindow />)
    expect(getByText('container1')).toBeInTheDocument()
    userEvent.click(getByText('container1'))
    expect(getByText('container2')).toBeInTheDocument()
    userEvent.click(getByText('container2'))
    expect(onSwitchContainerClick).toHaveBeenCalled()
  })
})
