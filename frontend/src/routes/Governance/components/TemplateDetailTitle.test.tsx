/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { waitForText } from '../../../lib/test-util'
import { TemplateDetailTitle } from './TemplateDetailTitle'

describe('TemplateDetailTitle components test', () => {
  test('Should render TemplateDetailTitle correctly', async () => {
    const { container } = render(
      <TemplateDetailTitle policyKind="ConfigurationPolicy" templateName="myTemplateName" compliant="Compliant" />
    )

    await waitForText('myTemplateName')
    await waitForText('CP')
    await waitForText('Compliant')
    expect(container.getElementsByClassName('pf-m-green').length).toBe(1)
  })
})
