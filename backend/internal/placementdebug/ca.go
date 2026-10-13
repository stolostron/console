// Copyright Contributors to the Open Cluster Management project

package placementdebug

import (
	"context"
	"errors"
	"sync"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"

	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	hubNamespace  = "open-cluster-management-hub"
	configMapName = "ca-bundle-configmap"
	caBundleKey   = "ca-bundle.crt"
)

// CAWatch lists and watches the OCM placement CA ConfigMap.
type CAWatch struct {
	Kube kubernetes.Interface

	mu sync.RWMutex
	ca []byte
}

// Get returns the current CA PEM, or nil when the bundle is missing.
func (c *CAWatch) Get() []byte {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	if len(c.ca) == 0 {
		return nil
	}
	out := make([]byte, len(c.ca))
	copy(out, c.ca)
	return out
}

func (c *CAWatch) set(ca []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.ca = append([]byte(nil), ca...)
}

// Start runs list+watch until ctx is canceled.
func (c *CAWatch) Start(ctx context.Context) {
	if c == nil || c.Kube == nil {
		return
	}
	go c.loop(ctx)
}

func (c *CAWatch) loop(ctx context.Context) {
	for ctx.Err() == nil {
		rv, err := c.list(ctx)
		if err != nil {
			c.handleErr(ctx, err)
			continue
		}
		if err = c.watch(ctx, rv); err != nil && ctx.Err() == nil {
			c.handleErr(ctx, err)
		}
	}
}

func (c *CAWatch) list(ctx context.Context) (string, error) {
	list, err := c.Kube.CoreV1().ConfigMaps(hubNamespace).List(ctx, metav1.ListOptions{
		FieldSelector: "metadata.name=" + configMapName,
	})
	if err != nil {
		return "", err
	}
	ca := []byte(nil)
	for i := range list.Items {
		if list.Items[i].Name != configMapName {
			continue
		}
		ca = []byte(list.Items[i].Data[caBundleKey])
		break
	}
	if len(ca) == 0 {
		if c.Get() != nil {
			applog.Logger().Info("placement debug CA bundle removed")
		}
		c.set(nil)
	} else {
		c.set(ca)
		applog.Logger().Info("placement debug CA bundle updated")
	}
	return list.ResourceVersion, nil
}

func (c *CAWatch) watch(ctx context.Context, resourceVersion string) error {
	w, err := c.Kube.CoreV1().ConfigMaps(hubNamespace).Watch(ctx, metav1.ListOptions{
		FieldSelector:   "metadata.name=" + configMapName,
		ResourceVersion: resourceVersion,
		Watch:           true,
	})
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
				return nil
			}
			switch ev.Type {
			case watch.Added, watch.Modified:
				cm, _ := ev.Object.(*corev1.ConfigMap)
				if cm == nil || cm.Name != configMapName {
					continue
				}
				ca := []byte(cm.Data[caBundleKey])
				if len(ca) == 0 {
					continue
				}
				c.set(ca)
				applog.Logger().Info("placement debug CA bundle updated")
			case watch.Deleted:
				cm, _ := ev.Object.(*corev1.ConfigMap)
				if cm != nil && cm.Name != configMapName {
					continue
				}
				if c.Get() != nil {
					applog.Logger().Info("placement debug CA bundle removed")
				}
				c.set(nil)
			case watch.Error:
				return errWatch
			}
		}
	}
}

var errWatch = errors.New("placement debug CA watch error event")

func (c *CAWatch) handleErr(ctx context.Context, err error) {
	applog.Logger().Error("placement debug CA watch", "error", err)
	timer := time.NewTimer(60*time.Second + time.Duration(time.Now().UnixNano()%10_000)*time.Millisecond)
	defer timer.Stop()
	select {
	case <-ctx.Done():
	case <-timer.C:
	}
}
