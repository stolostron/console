import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, GetWrapper } from './Resource'

export interface ManagedClusterAddOn extends IResource {
    apiVersion: string
    kind: 'ManagedClusterAddOn'
    metadata: V1ObjectMeta
    spec: {
    }
    status: {
        conditions: {
            lastTransitionTime: string
            message: string
            reason: string
            status: string
            type: string
        }[]
        addOnMeta: {
            displayName: string
            description: string
        }
        addOnConfiguration: {
            crdName: string
            crName: string
        }
    }
}

export const managedClusterAddOns = resourceMethods<ManagedClusterAddOn>({
    path: '/apis/addon.open-cluster-management.io/v1alpha1',
    plural: 'managedclusteraddons',
})

export function ManagedClusterAddOns(namespace: string) {
    const restFunc = ()=>{ return managedClusterAddOns.listNamespace(namespace)}
    return GetWrapper<ManagedClusterAddOn[]>(restFunc)
}

export function GetMCA(namespace: string) {
    const originalList = managedClusterAddOns.listNamespace(namespace)
    console.log("originallist:",originalList)



    // originalList = originalList.items.map((addon) => {
    //     const { metadata, status: { conditions, relatedObjects, addOnMeta } } = addon;
    //     const crd = _.get(relatedObjects, '[0]', {});
    
    //     // Order of precedence:
    //     // degraded=true
    //     // progressing=true
    //     // available=true
    //     // all conditions are false = progressing
    //     // available=false = unavailable
    //     // default = unknown
    //     const isDegraded = conditions.find(({ type, status }) => type === 'Degraded' && status === 'True') || false;
    //     const isProgressing = conditions.find(({ type, status }) => type === 'Progressing' && status === 'True') || false;
    //     const isAvailable = conditions.find(({ type, status }) => type === 'Available' && status === 'True') || false;
    //     const allFalseCondition = conditions.every(({ status }) => status !== 'True') ? { type: 'Progressing' } : false;
    //     const isNotAvailable = conditions.find(({ type, status }) => type === 'Available' && status === 'False') || false;
    //     if (isNotAvailable) {
    //       isNotAvailable.type = 'Unavailable';
    //     }
    //     const status = isDegraded || isProgressing || isAvailable || allFalseCondition || isNotAvailable || { type: 'Unknown' };
    //     const description = _.get(addOnMeta, 'description', '');
    //     return { metadata, status, addOnResource: { ...crd, description } };
    //   });
}


