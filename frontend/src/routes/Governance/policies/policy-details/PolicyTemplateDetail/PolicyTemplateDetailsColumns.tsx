/* Copyright Contributors to the Open Cluster Management project */
import { Skeleton } from '@patternfly/react-core'
import { ListItems } from '../../../../../ui-components'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../../NavigationPath'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'
// Any resources that are related to Vapb then add these rows
export const addRowsForHasVapb = (
  cols: ListItems[],
  hasVapb: boolean,
  loading: boolean,
  vapbItems: any[] | null | undefined,
  apiGroup: string,
  clusterName: string,
  name: string
) => {
  if (!hasVapb) {
    return cols
  }
  // Loading to fetch VAPB
  if (!vapbItems) {
    cols.push({
      key: 'Validating Admission Policy Binding',
      value: <Skeleton width="100%" screenreaderText="Fetching ValidatingAdmissionPolicyBinding" />,
    })
  } else if (vapbItems && vapbItems.length > 0 && !loading) {
    const vapbName = apiGroup === 'constraints.gatekeeper.sh' ? `gatekeeper-${name}` : name + '-binding'
    cols.push({
      key: 'Validating Admission Policy Binding',
      value: (
        <Link
          to={generatePath(NavigationPath.discoveredPolicyDetails, {
            clusterName,
            apiVersion: 'v1',
            apiGroup: 'admissionregistration.k8s.io',
            kind: 'ValidatingAdmissionPolicyBinding',
            templateName: vapbName,
            templateNamespace: null,
          })}
          target="_blank"
        >
          {vapbName} <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
        </Link>
      ),
    })
  } else if (vapbItems && vapbItems.length == 0 && !loading) {
    cols.push({
      key: 'Validating Admission Policy Binding',
      value: '-',
    })
  }
}

export const addRowsForVapb = (cols: ListItems[], template: any, clusterName: string, kind: string) => {
  if (kind !== 'ValidatingAdmissionPolicyBinding') {
    return
  }
  // Add a row forValidatingAdmissionPolicy
  if (!template) {
    cols.push({
      key: 'Validating Admission Policy',
      value: <Skeleton width="100%" screenreaderText="Fetching ValidatingAdmissionPolicyBinding" />,
    })
  } else {
    const policyName = template?.spec?.policyName
    if (policyName) {
      cols.push({
        key: 'Validating Admission Policy',
        value: (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`${NavigationPath.resourceYAML}?cluster=${clusterName}&kind=ValidatingAdmissionPolicy&apiversion=v1&name=${policyName}`}
          >
            {policyName}
            <ExternalLinkAltIcon style={{ verticalAlign: '-0.125em', marginLeft: '8px' }} />
          </a>
        ),
      })
    } else {
      cols.push({
        key: 'Validating Admission Policy',
        value: '-',
      })
    }
  }
}

export const addRowsForOperatorPolicy = (cols: ListItems[], template: any, kind: string, t: TFunction) => {
  if (kind !== 'OperatorPolicy') {
    return
  }

  let value = '-'

  for (const condition of template?.status?.conditions ?? []) {
    if (condition?.type === 'Compliant') {
      value = condition?.message ?? '-'
      break
    }
  }

  cols.push({ key: t('Message'), value: value })
}
