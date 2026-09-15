// Copyright Contributors to the Open Cluster Management project

package vmproxy

import (
	"context"
	"encoding/json"
	"io"
	"math"
	"net/http"
	"strings"

	applog "github.com/stolostron/console/backend/internal/log"
)

type usageMetrics struct {
	Requested    int `json:"requested"`
	Usage        int `json:"usage"`
	UsagePercent int `json:"usagePercent"`
}

type vmiUsage struct {
	PodName     string       `json:"podName"`
	VmiName     string       `json:"vmiName"`
	ClusterName string       `json:"clusterName"`
	Namespace   string       `json:"namespace"`
	CPU         usageMetrics `json:"cpu"`
	Memory      usageMetrics `json:"memory"`
	Storage     usageMetrics `json:"storage"`
}

type usageResponse struct {
	CPU       int        `json:"cpu"`
	Memory    int        `json:"memory"`
	Storage   int        `json:"storage"`
	VmisUsage []vmiUsage `json:"vmisUsage"`
}

type podMetricsList struct {
	Items []podMetric `json:"items"`
}

type podMetric struct {
	Metadata struct {
		Name   string            `json:"name"`
		Labels map[string]string `json:"labels"`
	} `json:"metadata"`
	Containers []struct {
		Usage struct {
			CPU    string `json:"cpu"`
			Memory string `json:"memory"`
		} `json:"usage"`
	} `json:"containers"`
}

type podListType struct {
	Items []podType `json:"items"`
}

type podType struct {
	Metadata struct {
		Name string `json:"name"`
	} `json:"metadata"`
	Spec struct {
		Containers []struct {
			Resources struct {
				Requests struct {
					CPU    string `json:"cpu"`
					Memory string `json:"memory"`
				} `json:"requests"`
			} `json:"resources"`
		} `json:"containers"`
	} `json:"spec"`
}

type filesystemType struct {
	Items []struct {
		TotalBytes float64 `json:"totalBytes"`
		UsedBytes  float64 `json:"usedBytes"`
	} `json:"items"`
}

func (h *Handler) usage(w http.ResponseWriter, r *http.Request, token, path string) {
	cluster, namespace, ok := parseUsagePath(path)
	if !ok || cluster == "" || namespace == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error":"Cluster name and namespace are required"}`))
		return
	}
	base, err := h.proxyBase(r.Context())
	if err != nil {
		applog.Logger().Error("Failed to get aggregated VM usage", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	result, err := h.aggregateUsage(r.Context(), base, cluster, namespace, token)
	if err != nil {
		applog.Logger().Error("Failed to get aggregated VM usage", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	enc, _ := json.Marshal(result)
	_, _ = w.Write(enc)
}

func parseUsagePath(path string) (cluster, namespace string, ok bool) {
	const prefix = "/vmResourceUsage/cluster/"
	if !strings.HasPrefix(path, prefix) {
		return "", "", false
	}
	rest := strings.TrimPrefix(path, prefix)
	nsIdx := strings.Index(rest, "/namespace/")
	if nsIdx < 0 {
		return "", "", false
	}
	cluster = rest[:nsIdx]
	namespace = strings.Trim(rest[nsIdx+len("/namespace/"):], "/")
	return cluster, namespace, true
}

func (h *Handler) aggregateUsage(ctx context.Context, base, cluster, namespace, token string) (*usageResponse, error) {
	label := "kubevirt.io=virt-launcher"
	metricsURL := base + "/" + cluster + "/apis/metrics.k8s.io/v1beta1/namespaces/" + namespace + "/pods?labelSelector=" + label
	podsURL := base + "/" + cluster + "/api/v1/namespaces/" + namespace + "/pods?labelSelector=" + label

	var metrics podMetricsList
	var pods podListType
	if err := h.getJSON(ctx, metricsURL, token, &metrics); err != nil {
		return nil, err
	}
	if err := h.getJSON(ctx, podsURL, token, &pods); err != nil {
		return nil, err
	}

	podMap := map[string]podType{}
	for _, p := range pods.Items {
		podMap[p.Metadata.Name] = p
	}

	out := &usageResponse{VmisUsage: []vmiUsage{}}
	for _, metric := range metrics.Items {
		pod, found := podMap[metric.Metadata.Name]
		u, err := h.singleVmiUsage(ctx, base, cluster, namespace, token, metric, pod, found)
		if err != nil {
			applog.Logger().Error("Failed to process a VM metric", "error", err)
			continue
		}
		if u == nil {
			continue
		}
		out.VmisUsage = append(out.VmisUsage, *u)
		out.CPU += u.CPU.Usage
		out.Memory += u.Memory.Usage
		out.Storage += u.Storage.Usage
	}
	return out, nil
}

func (h *Handler) singleVmiUsage(ctx context.Context, base, cluster, namespace, token string, metric podMetric, pod podType, found bool) (*vmiUsage, error) {
	vmiName := metric.Metadata.Labels["vm.kubevirt.io/name"]
	if !found || vmiName == "" {
		return nil, nil
	}
	var podRequestedCPU, podRequestedMemory float64
	for _, c := range pod.Spec.Containers {
		cpu, err := toMillicores(c.Resources.Requests.CPU)
		if err != nil {
			return nil, err
		}
		mem, err := toMebibytes(c.Resources.Requests.Memory)
		if err != nil {
			return nil, err
		}
		podRequestedCPU += cpu
		podRequestedMemory += mem
	}
	var podCPU, podMem float64
	for _, c := range metric.Containers {
		podCPU += convertNanocoresToMillicores(c.Usage.CPU)
		podMem += convertKibibytesToMebibytes(c.Usage.Memory)
	}

	fsURL := base + "/" + cluster + "/apis/subresources.kubevirt.io/v1/namespaces/" + namespace + "/virtualmachineinstances/" + vmiName + "/filesystemlist"
	var fs filesystemType
	if err := h.getJSON(ctx, fsURL, token, &fs); err != nil {
		return nil, err
	}
	var storageUsed, storageTotal float64
	for _, item := range fs.Items {
		storageUsed += convertBytesToGibibytes(item.UsedBytes)
		storageTotal += convertBytesToGibibytes(item.TotalBytes)
	}
	return &vmiUsage{
		PodName:     pod.Metadata.Name,
		VmiName:     vmiName,
		ClusterName: cluster,
		Namespace:   namespace,
		CPU: usageMetrics{
			Requested:    int(math.Round(podRequestedCPU)),
			Usage:        int(math.Round(podCPU)),
			UsagePercent: calUsagePercent(podCPU, podRequestedCPU),
		},
		Memory: usageMetrics{
			Requested:    int(math.Round(podRequestedMemory)),
			Usage:        int(math.Round(podMem)),
			UsagePercent: calUsagePercent(podMem, podRequestedMemory),
		},
		Storage: usageMetrics{
			Requested:    int(math.Round(storageTotal)),
			Usage:        int(math.Round(storageUsed)),
			UsagePercent: calUsagePercent(storageUsed, storageTotal),
		},
	}, nil
}

func (h *Handler) getJSON(ctx context.Context, rawURL, token string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	resp, err := h.addonClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(body, dest)
}
