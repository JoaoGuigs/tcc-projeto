from pydantic import BaseModel, Field
from typing import Literal


class ParseRequest(BaseModel):
    mensagem: str = Field(min_length=1, max_length=500)


class AgendamentoExtraido(BaseModel):
    intencao: Literal["agendar", "cancelar", "desconhecido"]
    paciente: str | None = Field(default=None, max_length=120)
    data: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    hora: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    erro: str | None = None
