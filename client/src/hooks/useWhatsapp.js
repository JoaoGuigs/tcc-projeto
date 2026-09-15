import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export const whatsappKeys = {
  conversas: ["whatsapp", "conversas"],
  conversa: (numero) => ["whatsapp", "conversa", numero],
  status: ["whatsapp", "status"],
};

export function useWhatsappConversas() {
  return useQuery({
    queryKey: whatsappKeys.conversas,
    queryFn: async () => (await api.get("/whatsapp/conversas")).data,
    refetchInterval: 10_000,
  });
}

export function useWhatsappConversa(numero) {
  return useQuery({
    queryKey: whatsappKeys.conversa(numero),
    queryFn: async () => (await api.get(`/whatsapp/conversas/${numero}`)).data,
    enabled: Boolean(numero),
    refetchInterval: 10_000,
  });
}

export function useWhatsappStatus() {
  return useQuery({
    queryKey: whatsappKeys.status,
    queryFn: async () => (await api.get("/whatsapp/status")).data,
    refetchInterval: 60_000,
  });
}

export function useSendWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/whatsapp/enviar", payload)).data,
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: whatsappKeys.conversas });
      queryClient.invalidateQueries({ queryKey: whatsappKeys.conversa(payload.numero) });
    },
  });
}

export function useMarcarConversaLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (numero) => (await api.post(`/whatsapp/conversas/${numero}/lidas`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: whatsappKeys.conversas }),
  });
}
