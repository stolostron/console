// Copyright Contributors to the Open Cluster Management project

package oauth

import (
	"context"
	"fmt"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

var oauthAccessTokenGVR = schema.GroupVersionResource{
	Group:    "oauth.openshift.io",
	Version:  "v1",
	Resource: "oauthaccesstokens",
}

// RevokeOAuthAccessToken deletes an OAuthAccessToken with gracePeriodSeconds=0.
func RevokeOAuthAccessToken(ctx context.Context, client dynamic.Interface, tokenName string) error {
	if client == nil {
		return fmt.Errorf("kubernetes dynamic client is required")
	}
	grace := int64(0)
	err := client.Resource(oauthAccessTokenGVR).Delete(ctx, tokenName, metav1.DeleteOptions{
		GracePeriodSeconds: &grace,
	})
	if apierrors.IsNotFound(err) {
		return nil
	}
	return err
}
