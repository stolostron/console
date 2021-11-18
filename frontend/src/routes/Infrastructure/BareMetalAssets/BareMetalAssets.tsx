/* Copyright Contributors to the Open Cluster Management project */
import { Redirect, Route, Switch } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import BareMetalAssetsPage from './BareMetalAssetsPage'
import CreateBareMetalAssetPage from './CreateBareMetalAsset'

export default function BareMetalAssets() {
    return (
        <Switch>
            <Route exact path={NavigationPath.editBareMetalAsset} component={CreateBareMetalAssetPage} />
            <Route exact path={NavigationPath.createBareMetalAsset} component={CreateBareMetalAssetPage} />
            <Route path={NavigationPath.bareMetalAssets} component={BareMetalAssetsPage} />
            <Route path="*">
                <Redirect to={NavigationPath.clusters} />
            </Route>
        </Switch>
    )
}
