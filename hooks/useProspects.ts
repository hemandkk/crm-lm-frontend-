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

// ─── List prospects ───────────────────────────────────────────────────────
export function useProspects(filters: ProspectFilters = {}) {
  return useQuery({
    queryKey: queryKeys.prospects.list(filters),
    queryFn: () => prospectService.list(filters),
    placeholderData: keepPreviousData,
  });
}

// ─── Single prospect ──────────────────────────────────────────────────────
export function useProspect(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospects.detail(id),
    queryFn: () => prospectService.get(id),
    enabled: enabled && !!id,
  });
}

// ─── Prospect timeline ────────────────────────────────────────────────────
export function useProspectTimeline(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospects.timeline(id),
    queryFn: () => prospectService.getTimeline(id),
    enabled: enabled && !!id,
  });
}

// ─── Prospect documents ───────────────────────────────────────────────────
export function useProspectDocuments(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.prospects.documents(id),
    queryFn: () => prospectService.getDocuments(id),
    enabled: enabled && !!id,
  });
}

// ─── Create prospect ──────────────────────────────────────────────────────
export function useCreateProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProspectCreate) => prospectService.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: queryKeys.prospects.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.employee() });
      toast.success(`Prospect ${created.prospectId} created`);
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Update prospect ──────────────────────────────────────────────────────
export function useUpdateProspect(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProspectUpdate) => prospectService.update(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.prospects.detail(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.prospects.all });
      toast.success("Prospect updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Update stage ─────────────────────────────────────────────────────────
export function useUpdateProspectStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ProspectStage }) =>
      prospectService.updateStage(id, stage),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.prospects.detail(updated.id), updated);
      // Invalidate list so stage filter counts update
      qc.invalidateQueries({ queryKey: queryKeys.prospects.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.employee() });
      toast.success(`Moved to ${updated.stage}`);
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Mark exam status ─────────────────────────────────────────────────────
export function useMarkExamStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      field,
      value,
    }: {
      id: string;
      field: "examAttended" | "examCertified";
      value: boolean;
    }) => prospectService.markExam(id, field, value),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.prospects.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.prospects.all });
      toast.success("Exam status updated");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Upload document ──────────────────────────────────────────────────────
export function useUploadDocument(prospectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docType, file }: { docType: string; file: File }) =>
      prospectService.uploadDocument(prospectId, docType, file),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: queryKeys.prospects.documents(prospectId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.prospects.detail(prospectId),
      });
      toast.success("Document uploaded");
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}

// ─── Bulk import ──────────────────────────────────────────────────────────
export function useBulkImportProspects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => prospectService.bulkImport(file),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.prospects.all });
      toast.success(
        `Imported ${result.imported} prospects${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ""}`
      );
    },
    onError: (error) => toast.error(extractApiError(error)),
  });
}
