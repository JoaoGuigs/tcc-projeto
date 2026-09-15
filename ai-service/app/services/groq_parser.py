import os
from datetime import datetime
from zoneinfo import ZoneInfo

from groq import AsyncGroq

from app.models.schemas import AgendamentoExtraido
from app.services.local_parser import parse_local

_client = None


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY não configurada para o fallback de IA.")
        _client = AsyncGroq(api_key=api_key, timeout=8.0)
    return _client


def _system_prompt() -> str:
    now = datetime.now(ZoneInfo("America/Sao_Paulo"))
    return f"""Você extrai dados de agendamento de uma clínica de fisioterapia.
Agora é {now.isoformat()} no fuso America/Sao_Paulo.
Calcule datas relativas a partir desse instante. Para um dia da semana, escolha a próxima ocorrência.
Retorne intenção, nome do paciente, data YYYY-MM-DD e hora HH:MM. Use null quando não identificar um campo."""


async def parse_mensagem(mensagem: str) -> AgendamentoExtraido:
    local = parse_local(mensagem, datetime.now(ZoneInfo("America/Sao_Paulo")))
    if local:
        return local

    response = await _get_client().chat.completions.create(
        model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
        messages=[{"role": "system", "content": _system_prompt()}, {"role": "user", "content": mensagem}],
        temperature=0,
        max_tokens=150,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "agendamento_extraido",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "intencao": {"type": "string", "enum": ["agendar", "cancelar", "desconhecido"]},
                        "paciente": {"type": ["string", "null"]},
                        "data": {"type": ["string", "null"]},
                        "hora": {"type": ["string", "null"]},
                        "erro": {"type": ["string", "null"]},
                    },
                    "required": ["intencao", "paciente", "data", "hora", "erro"],
                    "additionalProperties": False,
                },
            },
        },
    )
    content = response.choices[0].message.content or "{}"
    return AgendamentoExtraido.model_validate_json(content)
