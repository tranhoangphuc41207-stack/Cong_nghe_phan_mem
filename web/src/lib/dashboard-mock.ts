import { Server } from "@/types";

// Dữ liệu giả để làm giao diện. Khi có API thật thì thay bằng dữ liệu từ API.
export const mockServers: Server[] = [
  { id: "1", name: "srv-web-01", ip: "192.168.1.11", location: "Rack A1", status: "ONLINE", cpu: 35, ram: 60, network: 120 },
  { id: "2", name: "srv-db-01", ip: "192.168.1.12", location: "Rack A1", status: "WARNING", cpu: 88, ram: 91, network: 80 },
  { id: "3", name: "srv-app-02", ip: "192.168.1.13", location: "Rack A2", status: "OFFLINE", cpu: 0, ram: 0, network: 0 },
  { id: "4", name: "srv-cache-01", ip: "192.168.1.14", location: "Rack A2", status: "ONLINE", cpu: 22, ram: 45, network: 60 },
  { id: "5", name: "srv-mon-01", ip: "192.168.1.15", location: "Rack B1", status: "ONLINE", cpu: 55, ram: 70, network: 95 },
];