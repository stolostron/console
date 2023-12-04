/* Copyright Contributors to the Open Cluster Management project */
import { PropsWithChildren, useCallback, useContext, useState } from 'react'
import { Checkbox, Split, SplitItem, Stack, StackItem, Text, TextContent, TextVariants } from '@patternfly/react-core'
import { useSharedSelectors } from '../shared-recoil'
import { SupportedOperator, useOperatorCheck } from '../lib/operatorCheck'
import { AcmAlert, AcmButton, AcmModal } from '../ui-components'
import { Trans, useTranslation } from '../lib/acm-i18next'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { DOC_LINKS } from '../lib/doc-util'
import { PluginContext } from '../lib/PluginContext'

const SUPPRESS_MESSAGE_PREFIX = 'acm-not-ready-suppress-'

export const ACMNotReadyWarning = (props: PropsWithChildren<{}>) => {
  const { t } = useTranslation()
  const { acmOperatorSubscriptionsValue } = useSharedSelectors()
  const acmOperator = useOperatorCheck(SupportedOperator.acm, acmOperatorSubscriptionsValue)
  const { isACMAvailable } = useContext(PluginContext)

  let suppress = false
  const localStorageKey = `${SUPPRESS_MESSAGE_PREFIX}${acmOperator.version}`
  if (acmOperator.installed) {
    if (isACMAvailable) {
      localStorage.removeItem(localStorageKey)
    } else {
      suppress = 'true' === localStorage.getItem(localStorageKey)
    }
  }

  const [dismissed, setDismissed] = useState(false)
  const [suppressed, setSuppressed] = useState(false)
  const dismiss = useCallback(() => {
    if (suppressed) {
      localStorage.setItem(localStorageKey, 'true')
    }
    setDismissed(true)
  }, [localStorageKey, suppressed])

  const showWarning = !isACMAvailable && acmOperator.installed && !dismissed && !suppress

  return showWarning ? (
    <AcmModal
      title="Red Hat Advanced Cluster Management for Kubernetes is not ready"
      titleIconVariant="warning"
      position="top"
      isOpen
      onClose={dismiss}
      variant="large"
      actions={[
        <AcmButton key="dismiss" variant="warning" onClick={dismiss}>
          {t('Dismiss')}
        </AcmButton>,
      ]}
    >
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text component={TextVariants.p}>
              <Trans i18nKey="acm.plugin.not.ready" components={{ bold: <strong /> }} />
            </Text>
            <Text component={TextVariants.p}>
              <Trans
                i18nKey="acm.plugin.not.ready.tips"
                components={{ code: <span style={{ fontFamily: 'monospace' }} /> }}
              />
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <Split hasGutter>
            <SplitItem>
              <AcmButton
                variant="secondary"
                component="a"
                href={`/k8s/ns/open-cluster-management/operators.coreos.com~v1alpha1~ClusterServiceVersion/${acmOperator.version}/operator.open-cluster-management.io~v1~MultiClusterHub`}
                target="_blank"
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
              >
                {t('View MultiClusterHubs')}
              </AcmButton>
            </SplitItem>
            <SplitItem>
              <AcmButton
                variant="secondary"
                component="a"
                href="/k8s/cluster/operator.openshift.io~v1~Console/cluster/console-plugins"
                target="_blank"
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
              >
                {t('View console plugins')}
              </AcmButton>
            </SplitItem>
            <SplitItem>
              <AcmButton
                variant="link"
                component="a"
                href={DOC_LINKS.ACCESSING_CONSOLE}
                target="_blank"
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
              >
                {t('View documentation')}
              </AcmButton>
            </SplitItem>
          </Split>
        </StackItem>
        <StackItem>
          <TextContent>
            <Text component={TextVariants.p}>
              <Trans i18nKey="mce.dependency.of.acm" components={{ bold: <strong /> }} />
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <AcmAlert
            isInline
            noClose
            variant="warning"
            title={t('mce.kac.unsupported.title')}
            message={<Trans i18nKey="mce.kac.unsupported.description" components={{ bold: <strong /> }} />}
          />
        </StackItem>
        <StackItem>
          <Checkbox
            id="suppress"
            label={t('Do not show this message again')}
            isChecked={suppressed}
            onChange={setSuppressed}
          />
        </StackItem>
      </Stack>
    </AcmModal>
  ) : (
    <>{props.children}</>
  )
}
