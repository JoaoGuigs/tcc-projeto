import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { queryKeys } from "../lib/queryKeys";

export const convenioKeys = { all: queryKeys.convenios };

export function useConvenios(enabled = true) {
  return useQuery({ queryKey: queryKeys.convenios, queryFn: async () => (await api.get("/convenios")).data, enabled });
}

export function useCreateConvenio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nome_convenio) => (await api.post("/convenios", { nome_convenio })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: convenioKeys.all }),
  });
}

export function useDeleteConvenio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/convenios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: convenioKeys.all }),
  });
}
