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
	dist := substringDistance([]rune(p), []rune(t))
	score := float64(dist) / float64(plen)
	if score > 1 {
		score = 1
	}
	return score
}

// substringDistance is the minimum edit distance between a and any substring of b (Sellers).
func substringDistance(a, b []rune) int {
	prev := make([]int, len(b)+1) // row 0 all zeros: free start in b
	curr := make([]int, len(b)+1)
	for i := 1; i <= len(a); i++ {
		curr[0] = i
		for j := 1; j <= len(b); j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			curr[j] = min(prev[j]+1, curr[j-1]+1, prev[j-1]+cost)
		}
		prev, curr = curr, prev
	}
	best := prev[0]
	for _, v := range prev {
		best = min(best, v)
	}
	return best
}
