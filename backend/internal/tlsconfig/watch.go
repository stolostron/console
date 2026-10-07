// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"context"
	"errors"
	"math/rand/v2"
	"strings"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8swatch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic"

	applog "github.com/stolostron/console/backend/internal/log"
)

var apiServerGVR = schema.GroupVersionResource{
	Group:    "config.openshift.io",
	Version:  "v1",
	Resource: "apiservers",
}

const fieldSelector = "metadata.name=cluster"

const (
	retryBase   = 60 * time.Second
	retryJitter = 10 * time.Second
)

func retryDelay() time.Duration {
	return retryBase + time.Duration(rand.IntN(int(retryJitter/time.Second)))*time.Second
}

var afterError = retryDelay

type listerWatcher interface {
	List(ctx context.Context) (*unstructured.UnstructuredList, error)
	Watch(ctx context.Context, resourceVersion string) (k8swatch.Interface, error)
}

type dynamicSource struct {
	client dynamic.Interface
}

func (s dynamicSource) List(ctx context.Context) (*unstructured.UnstructuredList, error) {
	return s.client.Resource(apiServerGVR).List(ctx, metav1.ListOptions{FieldSelector: fieldSelector})
}

func (s dynamicSource) Watch(ctx context.Context, resourceVersion string) (k8swatch.Interface, error) {
	return s.client.Resource(apiServerGVR).Watch(ctx, metav1.ListOptions{
		FieldSelector:       fieldSelector,
		ResourceVersion:     resourceVersion,
		AllowWatchBookmarks: true,
	})
}

// WatchAPIServer lists/watches config.openshift.io/v1 APIServer "cluster" and
// applies tlsSecurityProfile to r. Blocks until ctx is done.
func WatchAPIServer(ctx context.Context, dyn dynamic.Interface, r *Reloader) {
	if dyn == nil {
		return
	}
	runWatch(ctx, dynamicSource{client: dyn}, r)
}

func runWatch(ctx context.Context, src listerWatcher, r *Reloader) {
	for {
		if ctx.Err() != nil {
			return
		}
		rv, err := listAndApply(ctx, src, r)
		if err != nil {
			if !handleWatchError(ctx, err) {
				return
			}
			continue
		}
		if err := watchUntil(ctx, src, r, rv); err != nil {
			if ctx.Err() != nil {
				return
			}
			if isImmediateRetry(err) {
				continue
			}
			if !handleWatchError(ctx, err) {
				return
			}
		}
	}
}

func listAndApply(ctx context.Context, src listerWatcher, r *Reloader) (string, error) {
	list, err := src.List(ctx)
	if err != nil {
		return "", err
	}
	for i := range list.Items {
		if p, ok := profileFromUnstructured(&list.Items[i]); ok {
			r.Apply(FromProfile(p))
			break
		}
	}
	return list.GetResourceVersion(), nil
}

func watchUntil(ctx context.Context, src listerWatcher, r *Reloader, resourceVersion string) error {
	w, err := src.Watch(ctx, resourceVersion)
	if err != nil {
		return err
	}
	defer w.Stop()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case ev, ok := <-w.ResultChan():
			if !ok {
				return errors.New("TLS profile watch closed")
			}
			switch ev.Type {
			case k8swatch.Added, k8swatch.Modified:
				obj, ok := ev.Object.(*unstructured.Unstructured)
				if !ok {
					continue
				}
				if p, ok := profileFromUnstructured(obj); ok {
					r.Apply(FromProfile(p))
				}
			case k8swatch.Bookmark:
			case k8swatch.Error:
				return watchErrorEvent(ev)
			}
		}
	}
}

func watchErrorEvent(ev k8swatch.Event) error {
	if st, ok := ev.Object.(*metav1.Status); ok && st.Message != "" {
		return errors.New(st.Message)
	}
	if err, ok := ev.Object.(error); ok {
		return err
	}
	return errors.New("TLS profile watch error event")
}

func handleWatchError(ctx context.Context, err error) bool {
	switch {
	case apierrors.IsForbidden(err):
		applog.Logger().Error("TLS profile watch", "status", "Forbidden")
	case apierrors.IsNotFound(err):
		applog.Logger().Debug("TLS profile watch", "status", "Not found")
	default:
		applog.Logger().Error("TLS profile watch error", "error", err.Error())
	}
	t := time.NewTimer(afterError())
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}

func isImmediateRetry(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "too old resource version") ||
		apierrors.IsResourceExpired(err) ||
		apierrors.IsGone(err)
}

func profileFromUnstructured(obj *unstructured.Unstructured) (SecurityProfile, bool) {
	if obj == nil {
		return SecurityProfile{}, false
	}
	raw, found, err := unstructured.NestedMap(obj.Object, "spec", "tlsSecurityProfile")
	if err != nil || !found {
		return SecurityProfile{}, false
	}
	p := SecurityProfile{}
	if t, _, _ := unstructured.NestedString(raw, "type"); t != "" {
		p.Type = t
	}
	if custom, ok, _ := unstructured.NestedMap(raw, "custom"); ok && custom != nil {
		cs := &CustomSpec{}
		cs.MinTLSVersion, _, _ = unstructured.NestedString(custom, "minTLSVersion")
		cs.Ciphers, _, _ = unstructured.NestedStringSlice(custom, "ciphers")
		cs.Groups, _, _ = unstructured.NestedStringSlice(custom, "groups")
		p.Custom = cs
	}
	return p, true
}
