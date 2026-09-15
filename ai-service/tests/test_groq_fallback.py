from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

from app.services.groq_parser import parse_mensagem
from app.services.local_parser import parse_local


NOW = datetime(2026, 9, 14, 10, 0)


@pytest.mark.asyncio
async def test_parse_mensagem_usa_parser_local_sem_groq():
    with patch("app.services.groq_parser.parse_local", return_value=parse_local("paciente João da Silva amanhã 14h", NOW)), \
         patch("app.services.groq_parser._get_client") as get_client:
        result = await parse_mensagem("paciente João da Silva amanhã 14h")
        get_client.assert_not_called()
        assert result.intencao == "agendar"
        assert result.hora == "14:00"


@pytest.mark.asyncio
async def test_parse_mensagem_ambigua_cai_no_fallback_groq():
    class Choice:
        def __init__(self):
            self.message = type("Msg", (), {"content": '{"intencao":"desconhecido","paciente":null,"data":null,"hora":null,"erro":"ambigua"}'})()

    class Response:
        choices = [Choice()]

    client = type("Client", (), {})()
    client.chat = type("Chat", (), {})()
    client.chat.completions = type("Completions", (), {})()
    client.chat.completions.create = AsyncMock(return_value=Response())

    with patch("app.services.groq_parser.parse_local", return_value=None), \
         patch("app.services.groq_parser._get_client", return_value=client):
        result = await parse_mensagem("pode ver um horário para a Ana?")
        client.chat.completions.create.assert_awaited_once()
        assert result.intencao == "desconhecido"
        assert parse_local("pode ver um horário para a Ana?", NOW) is None
