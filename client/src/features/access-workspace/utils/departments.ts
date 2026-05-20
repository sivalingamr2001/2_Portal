import type { Department } from "../types"

export function getDepartmentName(departments: Department[], id: number) {
  return departments.find((dept) => dept.deptId === id)?.name ?? ""
}
