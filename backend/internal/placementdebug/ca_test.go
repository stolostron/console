// Copyright Contributors to the Open Cluster Management project

package placementdebug

import (
	"context"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestCAWatchLoadsBundle(t *testing.T) {
	pem := "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"
	kube := fake.NewSimpleClientset(&corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: configMapName, Namespace: hubNamespace},
		Data:       map[string]string{caBundleKey: pem},
	})
	w := &CAWatch{Kube: kube}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	w.Start(ctx)
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if string(w.Get()) == pem {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("got %q", w.Get())
}

func TestCAWatchMissingIsNil(t *testing.T) {
	w := &CAWatch{Kube: fake.NewSimpleClientset()}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	w.Start(ctx)
	deadline := time.Now().Add(200 * time.Millisecond)
	for time.Now().Before(deadline) {
		if w.Get() != nil {
			t.Fatalf("got %q", w.Get())
		}
		time.Sleep(10 * time.Millisecond)
	}
}
