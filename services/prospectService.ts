import { api } from "@/lib/api";
import type {
  Prospect,
  ProspectCreate,
  ProspectUpdate,
  ProspectFilters,
  ProspectStage,
  TimelineEvent,
  Document,
  PaginatedResponse,
} from "@/types";

export const prospectService = {
  list: async (
    filters: ProspectFilters = {},
  ): Promise<PaginatedResponse<Prospect>> => {
    const res = await api.get<PaginatedResponse<Prospect>>("/prospects", {
      params: filters,
    });
    return res.data;
  },

  get: async (id: string): Promise<Prospect> => {
    const res = await api.get<Prospect>(`/prospects/${id}`);
    return res.data;
  },

  create: async (data: ProspectCreate): Promise<Prospect> => {
    const res = await api.post<Prospect>("/prospects", data);
    return res.data;
  },

  update: async (id: string, data: ProspectUpdate): Promise<Prospect> => {
    const res = await api.put<Prospect>(`/prospects/${id}`, data);
    return res.data;
  },

  updateStage: async (id: string, stage: ProspectStage): Promise<Prospect> => {
    const res = await api.patch<Prospect>(`/prospects/${id}/stage`, { stage });
    return res.data;
  },

  markExam: async (
    id: string,
    field: "examAttended" | "examCertified",
    value: boolean,
  ): Promise<Prospect> => {
    const res = await api.patch<Prospect>(`/prospects/${id}/exam`, {
      [field]: value,
    });
    return res.data;
  },
  markCertifiy: async (
    id: string,
    field: "examAttended" | "examCertified",
    value: boolean,
  ): Promise<Prospect> => {
    const res = await api.patch<Prospect>(`/prospects/${id}/certify`, {
      [field]: value,
    });
    return res.data;
  },

  getTimeline: async (id: string): Promise<TimelineEvent[]> => {
    const res = await api.get<TimelineEvent[]>(`/prospects/${id}/timeline`);
    return res.data;
  },

  getDocuments: async (id: string): Promise<Document[]> => {
    const res = await api.get<Document[]>(`/prospects/${id}/documents`);
    return res.data;
  },

  uploadDocument: async (
    id: string,
    docType: string,
    file: File,
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    const res = await api.post<Document>(
      `/prospects/${id}/documents`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  bulkImport: async (
    file: File,
  ): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ imported: number; errors: string[] }>(
      "/prospects/bulk-import",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },
};
