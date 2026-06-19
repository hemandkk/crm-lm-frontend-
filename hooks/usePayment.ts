// hooks/usePayments.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { prospectService } from "@/services/prospectService";
import { queryKeys } from "@/lib/queryClient";
import { extractApiError } from "@/lib/api";
import type {
  ProspectCreate,
  ProspectUpdate,
  ProspectFilters,
  ProspectStage,
} from "@/types";

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create payment");
      return res.json() as Promise<PaymentOut>;
    },
    onSuccess: (data, variables) => {
      // Phase 2: If there's a receipt file, upload it separately
      const receipt = variables.get("receipt") as File;
      const paymentId = data.id;

      if (receipt && receipt.size > 0) {
        const receiptForm = new FormData();
        receiptForm.append("receipt", receipt);

        return fetch(`/api/payments/${paymentId}/receipt`, {
          method: "POST",
          body: receiptForm,
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};
