// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"strings"
	"unicode/utf8"
)

const fuseThreshold = 0.3

// fuseFilter ports Fuse.js 6.6.2 ignoreLocation + threshold 0.3 over name/namespace/clusters.
func fuseFilter(items []App, pattern string) []App {
	if pattern == "" {
		return items
	}
	out := make([]App, 0, len(items))
	for _, item := range items {
		texts := []string{item.Transform.Name, item.Transform.Namespace}
		if len(item.Transform.Clusters) > 0 {
			texts = append(texts, item.Transform.Clusters[0])
		}
		best := 1.0
		for _, text := range texts {
			if s := bitapScore(pattern, text); s < best {
				best = s
			}
		}
		if best <= fuseThreshold {
			out = append(out, item)
		}
	}
	return out
}

// bitapScore is Fuse.js Bitap with ignoreLocation (errors / patternLen).
func bitapScore(pattern, text string) float64 {
	if pattern == "" {
		return 0
	}
	p := strings.ToLower(pattern)
	t := strings.ToLower(text)
	if t == "" {
		return 1
	}
	if strings.Contains(t, p) {
		return 0
	}
	plen := utf8.RuneCountInString(p)
	if plen == 0 {
		return 0
	}
	maxErrors := int(float64(plen) * fuseThreshold)
	if maxErrors < 0 {
		maxErrors = 0
	}
	best := 1.0
	pr := []rune(p)
	tr := []rune(t)
	for start := 0; start < len(tr); start++ {
		remain := len(tr) - start
		if remain <= 0 {
			break
		}
		window := remain
		if window > plen+maxErrors {
			window = plen + maxErrors
		}
		dist := levenshtein(pr, tr[start:start+window])
		score := float64(dist) / float64(plen)
		if score < best {
			best = score
		}
		if best == 0 {
			return 0
		}
	}
	return best
}

func levenshtein(a, b []rune) int {
	if len(a) == 0 {
		return len(b)
	}
	if len(b) == 0 {
		return len(a)
	}
	prev := make([]int, len(b)+1)
	curr := make([]int, len(b)+1)
	for j := 0; j <= len(b); j++ {
		prev[j] = j
	}
	for i := 1; i <= len(a); i++ {
		curr[0] = i
		for j := 1; j <= len(b); j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			del := prev[j] + 1
			ins := curr[j-1] + 1
			sub := prev[j-1] + cost
			curr[j] = del
			if ins < curr[j] {
				curr[j] = ins
			}
			if sub < curr[j] {
				curr[j] = sub
			}
		}
		prev, curr = curr, prev
	}
	return prev[len(b)]
}
