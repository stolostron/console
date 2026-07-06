/* Copyright Contributors to the Open Cluster Management project */

import { Content, ContentVariants } from '@patternfly/react-core'

import { DOC_LINKS } from '../../../../../../../lib/doc-util'
import DownloadAndOSSelection from './DownloadAndOSSelection'
import { useTranslation } from '~/lib/acm-i18next'

export const StepDownloadROSAClI = () => {
  const [t] = useTranslation()
  return (
    <div style={{ marginTop: '20px' }}>
      <Content component="h5">
        {t('Download and install the ROSA and AWS command line tools (CLI) and add it to your <code>PATH</code>.')}
      </Content>
      <Content component="ol">
        <Content component="li" className="pf-v6-u-mb-lg">
          <Content component={ContentVariants.p}>{t('Download the latest version of the ROSA CLI')}</Content>
          <div className="pf-v6-u-mt-md">
            <DownloadAndOSSelection />
          </div>
          <Content component="p" className="pf-v6-u-mt-lg">
            <a target="_blank" rel="noreferrer" href={DOC_LINKS.ROSA_CLI_DOCS}>
              {t('Help with ROSA CLI setup')}
            </a>
          </Content>
        </Content>
        <Content component="li">
          <Content component={ContentVariants.p}>{t('Download, setup and configure the AWS CLI version 2')}</Content>
          <Content component={ContentVariants.p} className="pf-v6-u-mt-lg">
            {t('Learn more about')}{' '}
            <a target="_blank" rel="noreferrer" href={DOC_LINKS.AWS_CLI}>
              {t('installing')}
            </a>{' '}
            {t('and')}{' '}
            <a target="_blank" rel="noreferrer" href={DOC_LINKS.AWS_CLI_CONFIGURATION_INSTRUCTIONS}>
              {t('configuring')}
            </a>{' '}
            {t('the AWS CLI.')}
          </Content>
        </Content>
      </Content>
    </div>
  )
}
