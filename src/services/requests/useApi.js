import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  registerPublicApi,
  getItemsApi,
  getItemByIdApi,
  createItemApi,
  updateItemApi,
  deleteItemApi,
  getAttendeesApi,
  getAttendeeByIdApi,
  exportAttendeesApi,
  getMeApi,
} from "../api/api";

// ============================================
// PUBLIC HOOKS
// ============================================

export const usePublicRegister = () => {
  return useMutation({
    mutationFn: registerPublicApi,
  });
};

// ============================================
// AUTH - PROFILE
// ============================================

export const useGetMe = (hashMe) => {
  return useQuery({
    queryKey: ["me", hashMe],
    queryFn: () => getMeApi(hashMe),
  });
};

// ============================================
// ITEMS - CRUD HOOKS TEMPLATE
// Duplicate this pattern for any new resource.
// ============================================

export const useGetItems = (params) => {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => getItemsApi(params),
  });
};

export const useGetItemById = (id) => {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => getItemByIdApi(id),
    enabled: !!id,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item"] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};

// ============================================
// ATTENDEES HOOKS
// Params: page, limit, sortBy, sortOrder, eventId,
//         transactionId, category, procId, search
// Response shape: { data: { attendees: [], pagination: { page, limit, total, ... } } }
// ============================================

export const useGetAttendees = (params) => {
  return useQuery({
    queryKey: ["attendees", params],
    queryFn: () => getAttendeesApi(params),
  });
};

export const useGetAttendeeById = (id) => {
  return useQuery({
    queryKey: ["attendee", id],
    queryFn: () => getAttendeeByIdApi(id),
    enabled: !!id,
  });
};

// Returns full attendee list without pagination (for CSV/Excel export)
export const useExportAttendees = () => {
  return useMutation({
    mutationFn: exportAttendeesApi,
  });
};
