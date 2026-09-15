import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export const convenioKeys = { all: ["convenios"] };

export function useConvenios() {
  return useQuery({ queryKey: convenioKeys.all, queryFn: async () => (await api.get("/convenios")).data });
}

export function useCreateConvenio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nome_convenio) => (await api.post("/convenios", { nome_convenio })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: convenioKeys.all }),
  });
}
