// Copyright Contributors to the Open Cluster Management project

package aggregate

import "strings"

func (e *Engine) nextAppPageChunk(chunks *[]pageChunk, remoteKey string) *pageChunk {
	if len(*chunks) == 0 {
		b := e.cache[remoteKey]
		var applications []App
		if b.Resources != nil {
			applications = b.Resources
		} else if b.ResourceMap != nil {
			for _, list := range b.ResourceMap {
				applications = append(applications, list...)
			}
		}
		if len(applications) > 0 {
			a, z := int('a'), int('0')
			sz := 26 + 10
			freq := make([]int, sz)
			for _, app := range applications {
				name := app.Transform.Name
				if name == "" {
					continue
				}
				ltr := int(name[0])
				index := ltr - a
				if ltr < a {
					index = ltr - z + 26
				}
				if index >= 0 && index < sz {
					freq[index]++
				}
			}
			current := pageChunk{Keys: []string{}}
			limit := e.searchLimit()
			for inx, n := range freq {
				ch := byte(inx + a)
				if inx >= 26 {
					ch = byte(inx + z - 26)
				}
				current.Keys = append(current.Keys, string([]byte{ch})+"*")
				current.Limit += n
				next := 0
				if inx+1 < sz {
					next = freq[inx+1]
				}
				if current.Limit+next > limit {
					*chunks = append(*chunks, current)
					current = pageChunk{Keys: []string{}}
				}
			}
			if current.Limit == 0 && len(*chunks) == 1 {
				*chunks = nil
			} else if len(*chunks) > 0 {
				*chunks = append(*chunks, current)
			}
		}
		if len(*chunks) > 0 {
			b.Resources = nil
			needMap := b.ResourceMap == nil
			if !needMap {
				for _, ch := range *chunks {
					if _, ok := b.ResourceMap[joinKeys(ch.Keys)]; !ok {
						needMap = true
						break
					}
				}
			}
			if needMap {
				b.ResourceMap = map[string][]App{}
				for _, ch := range *chunks {
					b.ResourceMap[joinKeys(ch.Keys)] = []App{}
				}
				reverse := map[byte][]App{}
				for key, list := range b.ResourceMap {
					for _, k := range strings.Split(key, ",") {
						if k != "" {
							reverse[k[0]] = list
						}
					}
				}
				for _, app := range applications {
					if app.Transform.Name == "" {
						continue
					}
					ch := app.Transform.Name[0]
					reverse[ch] = append(reverse[ch], app)
				}
			}
		} else if b.Resources != nil {
			b.Resources = applications
			b.ResourceMap = nil
			return nil
		}
	}
	if len(*chunks) == 0 {
		return nil
	}
	ch := (*chunks)[0]
	*chunks = (*chunks)[1:]
	return &ch
}

func joinKeys(keys []string) string {
	if len(keys) == 0 {
		return ""
	}
	out := keys[0]
	for i := 1; i < len(keys); i++ {
		out += "," + keys[i]
	}
	return out
}

func (e *Engine) cacheRemoteApps(statusMap map[string]StatusMap, remote []map[string]any, chunk *pageChunk, remoteKey string) {
	resources := e.transform(remote, statusMap, true, nil, nil, nil)
	if chunk == nil {
		e.cache[remoteKey].Resources = resources
		return
	}
	if e.cache[remoteKey].ResourceMap == nil {
		e.cache[remoteKey].ResourceMap = map[string][]App{}
	}
	e.cache[remoteKey].ResourceMap[joinKeys(chunk.Keys)] = resources
}
