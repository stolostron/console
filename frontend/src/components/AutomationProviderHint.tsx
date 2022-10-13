/* Copyright Contributors to the Open Cluster Management project */
import { makeStyles } from '@material-ui/styles'
import { Hint } from '@patternfly/react-core'
import { useMemo } from 'react'
import { useSharedAtoms, useRecoilValue } from '../shared-recoil'
import { useTranslation } from '../lib/acm-i18next'
import { getOperatorError } from '../lib/error-output'
import { isAnsibleOperatorInstalled } from '../resources'

export function AutomationProviderHint() {
    const { subscriptionOperatorsState } = useSharedAtoms()
    const subscriptionOperators = useRecoilValue(subscriptionOperatorsState)

    const { t } = useTranslation()

    const isOperatorInstalled = useMemo(
        () => isAnsibleOperatorInstalled(subscriptionOperators),
        [subscriptionOperators]
    )

    const useStyles = makeStyles({
        hint: {
            margin: '16px 0px 24px 0px',
            fontSize: 'smaller',
        },
    })
    const classes = useStyles()

    return (
        <>{!isOperatorInstalled && <Hint className={classes.hint}>{getOperatorError(isOperatorInstalled, t)}</Hint>}</>
    )
}
