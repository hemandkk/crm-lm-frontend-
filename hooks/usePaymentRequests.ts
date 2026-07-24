import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentRequestService } from "@/services/paymentRequestService";
import { queryKeys } from "@/lib/queryClient";
import { extractApiError } from "@/lib/api";
import type {
  PaymentRequestCreate,
  PaymentRequestFilters,
  PaymentRequestFulfill,
} from "@/types";

export function usePaymentRequests(
  filters: PaymentRequestFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.paymentRequests.list(filters),
    queryFn: () => paymentRequestService.list(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePaymentRequest(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.paymentRequests.detail(id),
    queryFn: () => paymentRequestService.get(id),
    enabled: enabled && !!id,
  });
}

export function useCreatePaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentRequestCreate) =>
      paymentRequestService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.paymentRequests.all });
      toast.success("Payment request submitted");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useFulfillPaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PaymentRequestFulfill;
    }) => paymentRequestService.fulfill(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.paymentRequests.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.paymentRequests.all });
      toast.success("Payment marked as done");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

export function useVerifyPaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentRequestService.verify(id),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.paymentRequests.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.paymentRequests.all });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      toast.success("Payment verified — expense created");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}
