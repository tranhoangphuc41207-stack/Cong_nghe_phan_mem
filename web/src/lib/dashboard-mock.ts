import { Server } from "@/types";

// Dữ liệu giả để làm giao diện. Khi có API thật thì thay bằng dữ liệu từ API.
export const mockServers: Server[] = [
  {
    id: "1", name: "srv-web-01", ip: "192.168.1.11", location: "Rack A1",
    status: "ONLINE", cpu: 35, ram: 60, network: 120,
    containers: [
      { name: "nginx", image: "nginx:1.27", status: "RUNNING" },
      { name: "frontend", image: "node:24-slim", status: "RUNNING" },
    ],
  },
  {
    id: "2", name: "srv-db-01", ip: "192.168.1.12", location: "Rack A1",
    status: "WARNING", cpu: 88, ram: 91, network: 80,
    containers: [
      { name: "postgres", image: "postgres:16", status: "RUNNING" },
      { name: "redis", image: "redis:7", status: "RUNNING" },
      { name: "backup-job", image: "alpine:3.20", status: "STOPPED" },
    ],
  },
  {
    id: "3", name: "srv-app-02", ip: "192.168.1.13", location: "Rack A2",
    status: "OFFLINE", cpu: 0, ram: 0, network: 0,
    containers: [
      { name: "api-service", image: "node:24-slim", status: "STOPPED" },
    ],
  },
  {
    id: "4", name: "srv-cache-01", ip: "192.168.1.14", location: "Rack A2",
    status: "ONLINE", cpu: 22, ram: 45, network: 60,
    containers: [{ name: "redis", image: "redis:7", status: "RUNNING" }],
  },
  {
    id: "5", name: "srv-mon-01", ip: "192.168.1.15", location: "Rack B1",
    status: "ONLINE", cpu: 55, ram: 70, network: 95,
    containers: [
      { name: "prometheus", image: "prom/prometheus", status: "RUNNING" },
      { name: "grafana", image: "grafana/grafana", status: "RUNNING" },
      { name: "node-exporter", image: "prom/node-exporter", status: "RUNNING" },
    ],
  },
];