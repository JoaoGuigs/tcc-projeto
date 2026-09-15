import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

from groq import Groq

from app.models.schemas import AgendamentoExtraido

_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

_SYSTEM_PROMPT = """
Você é um assistente de agendamento de uma clínica de fisioterapia.
Hoje é {data_hora_atual} (fuso horário America/Sao_Paulo).

Sua única tarefa é extrair informações de mensagens enviadas pela fisioterapeuta e retornar
EXATAMENTE um objeto JSON com as seguintes chaves:

- intencao: "agendar" | "cancelar" | "desconhecido"
- paciente: nome do paciente como string, ou null se não identificado
- data: data no formato YYYY-MM-DD, ou null se não identificada
  * Ao calcular dias da semana relativos ("segunda", "terça"...), use SEMPRE a próxima
    ocorrência a partir de hoje (não inclua o dia atual se já passou).
  * "semana que vem segunda" = segunda da semana seguinte.
  * "hoje" = data de hoje.
  * "amanhã" = data de amanhã.
- hora: horário no formato HH:MM (24h), ou null se não identificado
  * "14h" = "14:00", "14:30" = "14:30", "2 da tarde" = "14:00"

Retorne SOMENTE o JSON, sem explicações, sem markdown, sem blocos de código.

Exemplos:
Entrada: "paciente rogerio segunda 14h"
Saída: {{"intencao": "agendar", "paciente": "Rogério", "data": "2026-06-15", "hora": "14:00"}}

Entrada: "cancela joao amanha 9h"
Saída: {{"intencao": "cancelar", "paciente": "João", "data": "2026-06-11", "hora": "09:00"}}
""".strip()


def _build_system_prompt() -> str:
    now = datetime.now(ZoneInfo("America/Sao_Paulo"))
    dias_semana = ["segunda-feira", "terça-feira", "quarta-feira",
                   "quinta-feira", "sexta-feira", "sábado", "domingo"]
    data_hora_formatada = (
        f"{dias_semana[now.weekday()]}, {now.strftime('%d/%m/%Y')} às {now.strftime('%H:%M')}"
    )
    return _SYSTEM_PROMPT.format(data_hora_atual=data_hora_formatada)


def parse_mensagem(mensagem: str) -> AgendamentoExtraido:
    """Envia a mensagem para o Groq e retorna os dados extraídos."""
    resposta = _client.chat.completions.create(
        model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        messages=[
            {"role": "system", "content": _build_system_prompt()},
            {"role": "user", "content": mensagem},
        ],
        temperature=0,
        max_tokens=200,
        response_format={"type": "json_object"},
    )

    conteudo = resposta.choices[0].message.content or "{}"
    dados = json.loads(conteudo)

    return AgendamentoExtraido(
        intencao=dados.get("intencao", "desconhecido"),
        paciente=dados.get("paciente"),
        data=dados.get("data"),
        hora=dados.get("hora"),
    )
