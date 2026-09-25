// Copyright Contributors to the Open Cluster Management project

package oauth_test

import (
	"context"
	"testing"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"

	"github.com/stolostron/console/backend/internal/oauth"
)

var oauthAccessTokenGVR = schema.GroupVersionResource{
	Group:    "oauth.openshift.io",
	Version:  "v1",
	Resource: "oauthaccesstokens",
}

func oauthAccessTokenObject(name string) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "oauth.openshift.io",
		Version: "v1",
		Kind:    "OAuthAccessToken",
	})
	obj.SetName(name)
	return obj
}

func oauthAccessTokenClient(objects ...runtime.Object) *fake.FakeDynamicClient {
	return fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		oauthAccessTokenGVR: "OAuthAccessTokenList",
	}, objects...)
}

func TestRevokeOAuthAccessToken_DeletesToken(t *testing.T) {
	raw := "abcdefghijklmnopqrstuvwxyz012345"
	bearer := "sha256~" + raw
	wantName := oauth.AccessTokenName(bearer)
	client := oauthAccessTokenClient(oauthAccessTokenObject(wantName))
	if err := oauth.RevokeOAuthAccessToken(context.Background(), client, wantName); err != nil {
		t.Fatal(err)
	}
	_, err := client.Resource(oauthAccessTokenGVR).Get(context.Background(), wantName, metav1.GetOptions{})
	if !apierrors.IsNotFound(err) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestRevokeOAuthAccessToken_PlainTokenName(t *testing.T) {
	name := "plain-token"
	client := oauthAccessTokenClient(oauthAccessTokenObject(name))
	if err := oauth.RevokeOAuthAccessToken(context.Background(), client, name); err != nil {
		t.Fatal(err)
	}
	_, err := client.Resource(oauthAccessTokenGVR).Get(context.Background(), name, metav1.GetOptions{})
	if !apierrors.IsNotFound(err) {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestRevokeOAuthAccessToken_NotFoundOK(t *testing.T) {
	client := oauthAccessTokenClient()
	if err := oauth.RevokeOAuthAccessToken(context.Background(), client, "missing"); err != nil {
		t.Fatal(err)
	}
}

func TestRevokeOAuthAccessToken_NilClient(t *testing.T) {
	err := oauth.RevokeOAuthAccessToken(context.Background(), nil, "token")
	if err == nil {
		t.Fatal("expected error")
	}
}
