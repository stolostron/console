// Copyright Contributors to the Open Cluster Management project

package auth

import (
	"context"
	"testing"

	authv1 "k8s.io/api/authentication/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/config"
)

func TestKubeReviewerReview(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "tokenreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, &authv1.TokenReview{
			Status: authv1.TokenReviewStatus{
				Authenticated: true,
				User:          authv1.UserInfo{Username: "tester"},
			},
		}, nil
	})
	kr := &kubeReviewer{client: client}
	got, err := kr.Review(context.Background(), "tok")
	if err != nil {
		t.Fatal(err)
	}
	if !got.Authenticated || got.Username != "tester" {
		t.Fatalf("got %+v", got)
	}
}

func TestNewTokenReviewer(t *testing.T) {
	reviewer, err := NewTokenReviewer(
		&config.Config{ClusterAPIURL: "https://hub.example"},
		ServiceAccount{Token: "sa"},
	)
	if err != nil {
		t.Fatal(err)
	}
	if reviewer == nil {
		t.Fatal("expected reviewer")
	}
}
