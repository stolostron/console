/* Copyright Contributors to the Open Cluster Management project */
import { Card } from '@patternfly/react-core'
import { AcmDonutChart, colorThemes } from '../../../ui-components'
import { useMemo } from 'react'
import { useRecoilState, useSharedAtoms } from '../../../shared-recoil'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'

export function PolicySetViolationsCard() {
    const violations = usePolicySetViolations()
    return (
        <ViolationsCard
            title="Policy set violations"
            description="Overview of policy set violations"
            noncompliant={violations.noncompliant}
            compliant={violations.compliant}
            unknown={violations.unknown}
        />
    )
}

function usePolicySetViolations() {
    const { policySetsState } = useSharedAtoms()
    const [policySets] = useRecoilState(policySetsState)
    const violations = useMemo(() => {
        let compliant = 0
        let noncompliant = 0
        let unknown = 0
        for (const policySet of policySets) {
            switch (policySet.status?.compliant) {
                case 'Compliant':
                    compliant++
                    break
                case 'NonCompliant':
                    noncompliant++
                    break
                default:
                    unknown++
                    break
            }
        }
        return { noncompliant, compliant, unknown }
    }, [policySets])
    return violations
}

export function ViolationsCard(props: {
    title: string
    description: string
    noncompliant: number
    compliant: number
    unknown?: number
}) {
    const { t } = useTranslation()
    return (
        <Card>
            <AcmDonutChart
                title={props.title}
                description={props.description}
                donutLabel={{
                    title: props.noncompliant.toString(),
                    subTitle: t('Violation', { count: props.noncompliant }),
                }}
                data={[
                    {
                        key: t('violation', { count: props.noncompliant }),
                        value: props.noncompliant,
                        isPrimary: true,
                        link: props.noncompliant > 0 ? `${NavigationPath.policySets}?violation=violation` : undefined,
                    },
                    {
                        key: 'without violations',
                        value: props.compliant,
                        link: props.compliant > 0 ? `${NavigationPath.policySets}?violation=no-violation` : undefined,
                    },
                ]}
                colorScale={colorThemes.failureSuccess}
            />
        </Card>
    )
}
