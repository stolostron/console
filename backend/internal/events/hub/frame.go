// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"strconv"
)

// FormatSSE is the Node createEventString frame: id + data JSON + blank line.
func FormatSSE(id string, data []byte) []byte {
	buf := make([]byte, 0, 4+len(id)+6+len(data)+2)
	buf = append(buf, "id:"...)
	buf = append(buf, id...)
	buf = append(buf, "\ndata:"...)
	buf = append(buf, data...)
	buf = append(buf, "\n\n"...)
	return buf
}

func pingFrame() []byte {
	return []byte(":\n\n")
}

func nextIDString(n uint64) string {
	return strconv.FormatUint(n, 10)
}
