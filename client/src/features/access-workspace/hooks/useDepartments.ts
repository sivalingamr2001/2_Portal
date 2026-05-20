export function useDepartments() {
  return {
    departments: [],
    isLoading: false,
    error: null,
    refetch: () => undefined,
  }
}
