// Copyright Contributors to the Open Cluster Management project

package placementdebug

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
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

func TestCAWatchGetNilReceiver(t *testing.T) {
	var w *CAWatch
	if w.Get() != nil {
		t.Fatal("expected nil")
	}
}

func TestCAWatchStartNil(t *testing.T) {
	var w *CAWatch
	w.Start(context.Background())
}

func TestCAWatchListWrongNameSkipped(t *testing.T) {
	kube := fake.NewSimpleClientset()
	w := &CAWatch{Kube: kube}
	kube.PrependReactor("list", "configmaps", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, &corev1.ConfigMapList{
			ListMeta: metav1.ListMeta{ResourceVersion: "9"},
			Items: []corev1.ConfigMap{{
				ObjectMeta: metav1.ObjectMeta{Name: "other", Namespace: hubNamespace},
			}},
		}, nil
	})
	rv, err := w.list(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if rv != "9" || w.Get() != nil {
		t.Fatalf("rv=%q ca=%v", rv, w.Get())
	}
}

func TestCAWatchListRemovesStaleBundle(t *testing.T) {
	pem := "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"
	cm := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: configMapName, Namespace: hubNamespace, ResourceVersion: "1"},
		Data:       map[string]string{caBundleKey: pem},
	}
	kube := fake.NewSimpleClientset(cm)
	w := &CAWatch{Kube: kube}
	if _, err := w.list(context.Background()); err != nil {
		t.Fatal(err)
	}
	if string(w.Get()) != pem {
		t.Fatal("expected initial bundle")
	}
	cm.Data = map[string]string{}
	_, err := kube.CoreV1().ConfigMaps(hubNamespace).Update(context.Background(), cm, metav1.UpdateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := w.list(context.Background()); err != nil {
		t.Fatal(err)
	}
	if w.Get() != nil {
		t.Fatalf("expected cleared bundle, got %q", w.Get())
	}
}

func TestCAWatchWatchModifiedAndDeleted(t *testing.T) {
	pem := "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"
	kube := fake.NewSimpleClientset(&corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: configMapName, Namespace: hubNamespace, ResourceVersion: "1"},
		Data:       map[string]string{caBundleKey: pem},
	})
	var watchOnce sync.Once
	watchReady := make(chan struct{})
	kube.PrependWatchReactor("configmaps", func(action ktesting.Action) (bool, watch.Interface, error) {
		w, err := kube.Tracker().Watch(action.GetResource(), action.GetNamespace())
		if err != nil {
			return true, nil, err
		}
		watchOnce.Do(func() { close(watchReady) })
		return true, w, nil
	})
	w := &CAWatch{Kube: kube}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	w.Start(ctx)
	waitForCA(t, w, pem)
	select {
	case <-watchReady:
	case <-time.After(2 * time.Second):
		t.Fatal("watch not registered before update")
	}

	updated := pem + "-rotated"
	_, err := kube.CoreV1().ConfigMaps(hubNamespace).Update(ctx, &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{Name: configMapName, Namespace: hubNamespace, ResourceVersion: "1"},
		Data:       map[string]string{caBundleKey: updated},
	}, metav1.UpdateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	waitForCA(t, w, updated)

	if err := kube.CoreV1().ConfigMaps(hubNamespace).Delete(ctx, configMapName, metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if w.Get() == nil {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("expected nil after delete, got %q", w.Get())
}

func TestCAWatchHandleErrCanceled(t *testing.T) {
	w := &CAWatch{}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	w.handleErr(ctx, errors.New("boom"))
}

func TestCAWatchListErrorThenCancel(t *testing.T) {
	kube := fake.NewSimpleClientset()
	kube.PrependReactor("list", "configmaps", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, fmt.Errorf("list failed")
	})
	w := &CAWatch{Kube: kube}
	ctx, cancel := context.WithCancel(context.Background())
	w.Start(ctx)
	time.Sleep(20 * time.Millisecond)
	cancel()
	time.Sleep(20 * time.Millisecond)
}

func TestCAWatchWatchBranches(t *testing.T) {
	pem := "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----"
	kube := fake.NewSimpleClientset()
	fw := watch.NewFake()
	kube.PrependWatchReactor("configmaps", func(ktesting.Action) (bool, watch.Interface, error) {
		return true, fw, nil
	})
	w := &CAWatch{Kube: kube}
	go func() {
		fw.Add(&corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: "other"}})
		fw.Modify(&corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: configMapName},
			Data:       map[string]string{},
		})
		fw.Modify(&corev1.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{Name: configMapName},
			Data:       map[string]string{caBundleKey: pem},
		})
		fw.Delete(&corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: configMapName}})
		fw.Error(&metav1.Status{Reason: "Expired"})
	}()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	if err := w.watch(ctx, "1"); err == nil {
		t.Fatal("expected watch error event")
	}
}

func waitForCA(t *testing.T, w *CAWatch, want string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if string(w.Get()) == want {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("got %q want %q", w.Get(), want)
}
