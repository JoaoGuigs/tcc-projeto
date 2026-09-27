import os

from fastapi import APIRouter, Header, HTTPException, Request

from app.middleware.rate_limit import check_parse_rate_limit
from app.models.schemas import AgendamentoExtraido, ParseRequest
from app.services.groq_parser import parse_mensagem

router = APIRouter(prefix="/parse", tags=["parser"])


def _check_api_key(x_api_key: str | None) -> None:
    expected = os.getenv("AI_SERVICE_KEY")
    if not expected:
        return
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Não autorizado.")


@router.post("/", response_model=AgendamentoExtraido)
async def parse(request: Request, body: ParseRequest, x_api_key: str | None = Header(default=None)) -> AgendamentoExtraido:
    """Recebe texto livre e retorna os dados de agendamento extraídos pela IA."""
    check_parse_rate_limit(request)
    _check_api_key(x_api_key)
    if not body.mensagem or not body.mensagem.strip():
        raise HTTPException(status_code=400, detail="Campo 'mensagem' é obrigatório.")

    return await parse_mensagem(body.mensagem.strip())
