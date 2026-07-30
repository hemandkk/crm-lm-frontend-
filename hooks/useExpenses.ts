import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { expenseService } from "@/services/expenseService";
import { queryKeys } from "@/lib/queryClient";
import { extractApiError } from "@/lib/api";
import type { ExpenseCreate, ExpenseFilters, ExpenseUpdate } from "@/types";

export function useExpenses(filters: ExpenseFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: () => expenseService.list(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useExpense(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => expenseService.get(id),
    enabled: enabled && !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseCreate) => expenseService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Expense recorded");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseUpdate) => expenseService.update(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.expenses.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Expense updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Expense deleted");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useExportExpenses() {
  return useMutation({
    mutationFn: (filters: ExpenseFilters & { format?: "xlsx" | "csv" }) =>
      expenseService.export(filters),
    onSuccess: () => toast.success("Export downloaded"),
    onError: (error) => toast.error(extractApiError(error)),
  });
}
