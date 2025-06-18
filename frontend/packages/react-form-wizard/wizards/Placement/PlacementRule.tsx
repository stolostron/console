import { Fragment } from 'react'
import { EditMode, WizKeyValue, WizArrayInput, WizTextInput } from '../../src'
import { useEditMode } from '../../src/contexts/EditModeContext'
import { useItem } from '../../src/contexts/ItemContext'
import { IResource } from '../../src/common/resource'
import { IPlacementRule, PlacementRuleKind, PlacementRuleType } from '../common/resources/IPlacementRule'
import { useLabelValuesMap } from '../common/useLabelValuesMap'
import { isValidKubernetesResourceName } from '../common/validation'
import { MatchExpression, MatchExpressionCollapsed } from './MatchExpression'

export function PlacementRules(props: { clusters: IResource[] }) {
    const editMode = useEditMode()
    return (
        <WizArrayInput
            id="placement-rules"
            label="Placement rules"
            labelHelp="Placement rules determine which clusters a resources will be applied."
            path={null}
            isSection
            // hidden={() => !props.placementRuleCount }
            filter={(resource) => resource.kind === PlacementRuleKind}
            placeholder="Add placement rule"
            collapsedContent="metadata.name"
            collapsedPlaceholder="Expand to enter placement rule"
            newValue={{
                ...PlacementRuleType,
                metadata: {},
                spec: { clusterConditions: [{ status: 'True', type: 'ManagedClusterConditionAvailable' }] },
            }}
            defaultCollapsed={editMode !== EditMode.Create}
        >
            <PlacementRule clusters={props.clusters} />
        </WizArrayInput>
    )
}

export function PlacementRule(props: { clusters: IResource[]; hideName?: boolean }) {
    const editMode = useEditMode()
    const labelValuesMap = useLabelValuesMap(props.clusters)
    const placementRule = useItem() as IPlacementRule
    const inputLabel = 'Label expressions'
    const addLabel = 'Add label expression'
    return (
        <Fragment>
            {!props.hideName && (
                <WizTextInput
                    id="name"
                    path="metadata.name"
                    label="Name"
                    required
                    readonly={placementRule.metadata?.uid !== undefined}
                    helperText="The name of the placement rule should match the placement rule name in a placement binding so that it is bound to a policy or policy set. The placement rule name must be unique to the namespace."
                    validation={isValidKubernetesResourceName}
                />
            )}
            <WizKeyValue
                label="Label selectors"
                path={`spec.clusterSelector.matchLabels`}
                labelHelp="A label selector allows selection of clusters using cluster labels. A cluster must match all label selectors and label expressions to be selected."
                placeholder="Add cluster label selector"
                hidden={() => placementRule.spec?.clusterSelector?.matchLabels === undefined}
            />
            <WizArrayInput
                id="label-expressions"
                label={inputLabel}
                path="spec.clusterSelector.matchExpressions"
                labelHelp="A label expressions allow selection of clusters using cluster labels. A cluster must match all label selectors and label expressions to be selected."
                placeholder={addLabel}
                collapsedContent={<MatchExpressionCollapsed />}
                newValue={{ key: '', operator: 'In', values: [] }}
                defaultCollapsed={editMode !== EditMode.Create}
                helperText="A placement without any label selectors or label expressions will select all clusters."
            >
                <MatchExpression labelValuesMap={labelValuesMap} />
            </WizArrayInput>
        </Fragment>
    )
}
