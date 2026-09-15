from pydantic import BaseModel
from typing import Literal


class ParseRequest(BaseModel):
    mensagem: str


class AgendamentoExtraido(BaseModel):
    intencao: Literal["agendar", "cancelar", "desconhecido"]
    paciente: str | None = None
    data: str | None = None   # YYYY-MM-DD
    hora: str | None = None   # HH:MM
    erro: str | None = None
