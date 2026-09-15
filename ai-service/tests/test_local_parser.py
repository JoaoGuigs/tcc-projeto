from datetime import datetime

from app.services.local_parser import parse_local


NOW = datetime(2026, 9, 14, 10, 0)  # segunda-feira


def test_agenda_amanha_sem_chamar_modelo():
    result = parse_local("paciente João da Silva amanhã 14h", NOW)
    assert result is not None
    assert result.model_dump() == {
        "intencao": "agendar", "paciente": "João Da Silva",
        "data": "2026-09-15", "hora": "14:00", "erro": None,
    }


def test_cancela_proxima_segunda():
    result = parse_local("cancela Maria Souza segunda 09:30", NOW)
    assert result is not None
    assert result.intencao == "cancelar"
    assert result.data == "2026-09-21"
    assert result.hora == "09:30"


def test_data_absoluta_brasileira():
    result = parse_local("agendar Carlos Lima 20/09/2026 às 8h", NOW)
    assert result is not None
    assert result.data == "2026-09-20"
    assert result.hora == "08:00"


def test_mensagem_ambigua_usa_fallback():
    assert parse_local("pode ver um horário para a Ana?", NOW) is None
