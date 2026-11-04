#!/usr/bin/env bash
# Tạo CA riêng + chứng chỉ server (Backend) + chứng chỉ client (Agent) để thử mTLS.
# CHỈ dùng cho môi trường thử nghiệm. Khóa riêng không được đưa lên GitHub.
set -euo pipefail
OUT="${1:-certs}"
mkdir -p "$OUT" && cd "$OUT"

openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=AR-IMMS Test CA" -keyout ca.key -out ca.crt 2>/dev/null

issue() { # $1=tên $2=CN $3=extendedKeyUsage $4=SAN
  openssl req -newkey rsa:2048 -nodes -subj "/CN=$2" -keyout "$1.key" -out "$1.csr" 2>/dev/null
  printf "subjectAltName=%s\nextendedKeyUsage=%s\n" "$4" "$3" > "$1.ext"
  openssl x509 -req -in "$1.csr" -CA ca.crt -CAkey ca.key -CAcreateserial -days 365 -extfile "$1.ext" -out "$1.crt" 2>/dev/null
  rm -f "$1.csr" "$1.ext"
}
issue server localhost serverAuth "DNS:localhost,DNS:backend,IP:127.0.0.1"
issue agent agent-01 clientAuth "DNS:agent-01"
rm -f ca.srl
echo "Đã tạo chứng chỉ trong $(pwd): ca.crt server.{crt,key} agent.{crt,key}"
