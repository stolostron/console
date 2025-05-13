import { selector } from 'recoil'
import { accessControlState } from '../atoms'
import { AccessControl } from '../resources/access-control'

export const filteredAccessControlState = selector<AccessControl[]>({
    key: 'filteredAccessControlState',
    get: ({ get }) => {
        const all = get(accessControlState)
        const filters = ["kubevirt.io:view", "kubevirt.io:edit", "kubevirt.io:edit"]
        return all.filter((ac) =>
            ac.spec.roleBindings?.some((rb) =>
                filters.includes(rb.roleRef.name)
            )
        )
    }
})