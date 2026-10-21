import { AppUser } from "@/types";

// Dữ liệu giả để làm giao diện. Khi có API thật thì thay bằng dữ liệu từ API.
export const mockUsers: AppUser[] = [
  { id: "1", username: "admin", fullName: "Quản trị viên", role: "ADMIN", active: true },
  { id: "2", username: "operator", fullName: "Nguyễn Văn Vận", role: "OPERATOR", active: true },
  { id: "3", username: "tech01", fullName: "Trần Kỹ Thuật", role: "TECHNICIAN", active: true },
  { id: "4", username: "tech02", fullName: "Lê Bảo Trì", role: "TECHNICIAN", active: false },
];