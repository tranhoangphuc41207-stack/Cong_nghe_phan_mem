import { Room } from "@/types";

// Dữ liệu giả. Tên rack phải trùng với trường "location" của máy chủ.
export const mockRooms: Room[] = [
  { id: "roomA", name: "Phòng máy A", racks: ["Rack A1", "Rack A2"] },
  { id: "roomB", name: "Phòng máy B", racks: ["Rack B1"] },
];