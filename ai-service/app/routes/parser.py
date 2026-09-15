from fastapi import APIRouter, HTTPException

from app.models.schemas import AgendamentoExtraido, ParseRequest
from app.services.groq_parser import parse_mensagem

router = APIRouter(prefix="/parse", tags=["parser"])


@router.post("/", response_model=AgendamentoExtraido)
async def parse(body: ParseRequest) -> AgendamentoExtraido:
    """Recebe texto livre e retorna os dados de agendamento extraídos pela IA."""
    if not body.mensagem or not body.mensagem.strip():
        raise HTTPException(status_code=400, detail="Campo 'mensagem' é obrigatório.")

    return parse_mensagem(body.mensagem.strip())
