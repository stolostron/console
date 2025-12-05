/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { IdentityProvider, OAuth } from '../oauth'

/**
 * get oauth IDPs
 * @returns the list of IDPs for the only expected oauth element
 */
export const useGetIdentityProviders = (): IdentityProvider[] => {
  const { oauthState } = useSharedAtoms()
  const oauth: OAuth[] = useRecoilValue(oauthState)
  return oauth.length ? oauth[0].spec.identityProviders : []
}
