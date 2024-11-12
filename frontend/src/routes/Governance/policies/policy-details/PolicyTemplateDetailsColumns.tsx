/* Copyright Contributors to the Open Cluster Management project */
import { Badge, LabelGroup, Skeleton } from '@patternfly/react-core'
import { ListItems } from '../../../../ui-components'
import { generatePath, Link } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { TFunction } from 'react-i18next'
import { ReactNode } from 'react'
import { collectKinds } from '../../common/util'
import { Grid as MuiGrid } from '@mui/material'

interface IKinds {
  apiGroups: string[]
  kinds: string[]
}
// Any resources that are related to Vapb then add these rows
export const addRowsForHasVapb = (
  cols: ListItems[],
  hasVapb: boolean,
  loading: boolean,
  vapbItems: any[] | null | undefined,
  apiGroup: string,
  clusterName: string,
  name: string
): ListItems[] => {
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

  return cols
}

export const addRowsForVapb = (cols: ListItems[], template: any, clusterName: string, kind: string): ListItems[] => {
  if (kind !== 'ValidatingAdmissionPolicyBinding') {
    return cols
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

  return cols
}

export const addRowsForOperatorPolicy = (cols: ListItems[], template: any, kind: string, t: TFunction): ListItems[] => {
  if (kind !== 'OperatorPolicy') {
    return cols
  }

  let value = '-'

  for (const condition of template?.status?.conditions ?? []) {
    if (condition?.type === 'Compliant') {
      value = condition?.message ?? '-'
      break
    }
  }

  cols.push({ key: t('Message'), value: value })

  return cols
}

export const addRowsForKyverno = (cols: ListItems[], template: any, apiGroup: string, t: TFunction): ListItems[] => {
  if (template?.spec?.rules && apiGroup === 'kyverno.io') {
    return [
      ...cols.slice(0, 2),
      {
        key: t('Rules'),
        value: kyvernoMatchesBadges(template?.spec?.rules),
      },
      ...cols.slice(2),
    ]
  }

  return cols
}

export const addRowsForGatekeeperConstraint = (
  cols: ListItems[],
  template: any,
  apiGroup: string,
  t: TFunction
): ListItems[] => {
  if (template?.spec?.match?.kinds && apiGroup === 'constraints.gatekeeper.sh') {
    return [
      ...cols.slice(0, 2),
      {
        key: t('Matches'),
        value: matchesBadges(template?.spec?.match?.kinds as IKinds[]),
      },
      ...cols.slice(2),
    ]
  }
  return cols
}

const kyvernoMatchesBadges = (rules: any[]): ReactNode => {
  return (
    <MuiGrid container style={{ gap: 16 }} direction="column">
      {rules.map((r) => {
        const kinds: string[] = collectKinds(r)
        return (
          <MuiGrid item xs="auto" key={r.name} container direction="column" style={{ gap: 8 }}>
            <MuiGrid item>{r.name}</MuiGrid>
            <MuiGrid item style={{ paddingLeft: 16, width: 'fit-content' }} direction="column" container>
              <LabelGroup
                categoryName="Controls"
                key={r.name + '-controls'}
                style={{ alignItems: 'center' }}
                numLabels={10}
              >
                {r.validate && <Badge isRead>Validate</Badge>}
                {r.mutate && <Badge isRead>Mutate</Badge>}
                {r.generate && <Badge isRead>Generate</Badge>}
                {r.verifyImages && <Badge isRead>verifyImages</Badge>}
              </LabelGroup>
              <LabelGroup
                categoryName="Matches"
                key={r.name + '-matches'}
                style={{ alignItems: 'center' }}
                numLabels={10}
              >
                {kinds.map((kind: string) => (
                  <Badge isRead key={`${r.name}/${kind}`}>
                    {kind}
                  </Badge>
                ))}
              </LabelGroup>
            </MuiGrid>
          </MuiGrid>
        )
      })}
    </MuiGrid>
  )
}

const matchesBadges = (kinds: IKinds[]): ReactNode => {
  return (
    <MuiGrid container style={{ maxWidth: '500px', gap: 8 }}>
      {kinds.map((kinds) => {
        return kinds.kinds.map((k) => {
          if (!kinds.apiGroups || kinds.apiGroups.length == 0) {
            return (
              <div key={k}>
                <Badge isRead key={k}>
                  {k}
                </Badge>
              </div>
            )
          }

          return kinds.apiGroups.map((apigroup) => {
            return (
              <div key={`${apigroup}/${k}`}>
                <Badge isRead key={`${apigroup}/${k}`}>
                  {apigroup ? `${apigroup}/${k}` : k}
                </Badge>
              </div>
            )
          })
        })
      })}
    </MuiGrid>
  )
}
