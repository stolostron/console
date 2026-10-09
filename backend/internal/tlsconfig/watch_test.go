// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"context"
	"crypto/tls"
	"errors"
	"testing"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8swatch "k8s.io/apimachinery/pkg/watch"
)

func apiServerObj(profileType, rv string, custom map[string]any) *unstructured.Unstructured {
	profile := map[string]any{"type": profileType}
	if custom != nil {
		profile["custom"] = custom
	}
	return &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "config.openshift.io/v1",
		"kind":       "APIServer",
		"metadata":   map[string]any{"name": "cluster", "resourceVersion": rv},
		"spec":       map[string]any{"tlsSecurityProfile": profile},
	}}
}

type stubLW struct {
	list    *unstructured.UnstructuredList
	listErr error
	watcher k8swatch.Interface
	watchCh chan struct{}
}

func (s *stubLW) List(context.Context) (*unstructured.UnstructuredList, error) {
	if s.listErr != nil {
		return nil, s.listErr
	}
	return s.list, nil
}

func (s *stubLW) Watch(context.Context, string) (k8swatch.Interface, error) {
	if s.watchCh != nil {
		close(s.watchCh)
		s.watchCh = nil
	}
	if s.watcher == nil {
		return nil, errors.New("no watcher")
	}
	return s.watcher, nil
}

func waitMin(t *testing.T, r *Reloader, want uint16) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if r.Settings().MinVersion == want {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("MinVersion 0x%x want 0x%x", r.Settings().MinVersion, want)
}

func TestProfileFromUnstructured(t *testing.T) {
	p, ok := profileFromUnstructured(apiServerObj("Modern", "1", nil))
	if !ok || p.Type != "Modern" {
		t.Fatalf("got %+v ok=%v", p, ok)
	}
	p, ok = profileFromUnstructured(apiServerObj("Custom", "1", map[string]any{
		"minTLSVersion": "VersionTLS12",
		"ciphers":       []any{"ECDHE-RSA-AES128-GCM-SHA256"},
		"groups":        []any{"X25519"},
	}))
	if !ok || p.Type != "Custom" || p.Custom == nil || p.Custom.MinTLSVersion != "VersionTLS12" {
		t.Fatalf("custom %+v", p)
	}
	if len(p.Custom.Ciphers) != 1 || p.Custom.Groups[0] != "X25519" {
		t.Fatalf("custom slices %+v", p.Custom)
	}
	if _, ok := profileFromUnstructured(&unstructured.Unstructured{Object: map[string]any{"spec": map[string]any{}}}); ok {
		t.Fatal("missing profile should be false")
	}
}

func TestWatchAppliesListThenModified(t *testing.T) {
	list := &unstructured.UnstructuredList{}
	list.SetResourceVersion("10")
	list.Items = []unstructured.Unstructured{*apiServerObj("Intermediate", "10", nil)}
	fw := k8swatch.NewFake()
	started := make(chan struct{})
	stub := &stubLW{list: list, watcher: fw, watchCh: started}
	r := NewReloader()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go runWatch(ctx, stub, r)
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("watch not started")
	}

	waitMin(t, r, tls.VersionTLS12)
	fw.Modify(apiServerObj("Modern", "11", nil))
	waitMin(t, r, tls.VersionTLS13)
	before := r.Settings()
	fw.Action(k8swatch.Bookmark, apiServerObj("Modern", "12", nil))
	time.Sleep(50 * time.Millisecond)
	if !settingsEqual(before, r.Settings()) {
		t.Fatal("BOOKMARK should not change settings")
	}
	fw.Modify(apiServerObj("Intermediate", "13", nil))
	waitMin(t, r, tls.VersionTLS12)
}

func TestWatchForbiddenDoesNotPanic(t *testing.T) {
	old := afterError
	afterError = func() time.Duration { return time.Millisecond }
	defer func() { afterError = old }()

	stub := &stubLW{
		listErr: apierrors.NewForbidden(
			schema.GroupResource{Group: "config.openshift.io", Resource: "apiservers"},
			"cluster",
			errors.New("denied"),
		),
	}
	r := NewReloader()
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	runWatch(ctx, stub, r)
	if r.Settings().MinVersion != tls.VersionTLS12 {
		t.Fatal("should stay Intermediate")
	}
}

func TestWatchNotFoundDoesNotPanic(t *testing.T) {
	old := afterError
	afterError = func() time.Duration { return time.Millisecond }
	defer func() { afterError = old }()

	stub := &stubLW{
		listErr: apierrors.NewNotFound(schema.GroupResource{Group: "config.openshift.io", Resource: "apiservers"}, "cluster"),
	}
	r := NewReloader()
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	runWatch(ctx, stub, r)
}

func TestWatchErrorEventRetries(t *testing.T) {
	old := afterError
	afterError = func() time.Duration { return time.Millisecond }
	defer func() { afterError = old }()

	list := &unstructured.UnstructuredList{}
	list.SetResourceVersion("1")
	list.Items = []unstructured.Unstructured{*apiServerObj("Intermediate", "1", nil)}
	fw := k8swatch.NewFake()
	started := make(chan struct{})
	stub := &stubLW{list: list, watcher: fw, watchCh: started}
	r := NewReloader()
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	go runWatch(ctx, stub, r)
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("watch not started")
	}
	waitMin(t, r, tls.VersionTLS12)
	fw.Error(&metav1.Status{Message: "too old resource version"})
	<-ctx.Done()
}

func TestRetryDelayInRange(t *testing.T) {
	for i := 0; i < 20; i++ {
		d := retryDelay()
		if d < retryBase || d >= retryBase+retryJitter {
			t.Fatalf("retryDelay %v outside [%v,%v)", d, retryBase, retryBase+retryJitter)
		}
	}
}

func TestIsImmediateRetry(t *testing.T) {
	if !isImmediateRetry(errors.New("too old resource version: 1")) {
		t.Fatal("expected immediate retry")
	}
	if isImmediateRetry(errors.New("connection refused")) {
		t.Fatal("generic error is not immediate")
	}
}

func TestWatchAPIServerNilClient(t *testing.T) {
	WatchAPIServer(context.Background(), nil, NewReloader())
}
