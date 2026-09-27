from fastapi.testclient import TestClient

from app.main import app
from app.middleware.rate_limit import reset_rate_limit

client = TestClient(app)


def setup_function(_):
    reset_rate_limit()


def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_parse_vazio_400():
    response = client.post("/parse/", json={"mensagem": "   "})
    assert response.status_code == 400


def test_parse_local_sem_groq():
    response = client.post("/parse/", json={"mensagem": "paciente João da Silva amanhã 14h"})
    assert response.status_code == 200
    body = response.json()
    assert body["intencao"] == "agendar"
    assert body["hora"] == "14:00"


def test_parse_mensagem_longa_422():
    response = client.post("/parse/", json={"mensagem": "x" * 501})
    assert response.status_code == 422


def test_parse_rate_limit_429():
    for _ in range(30):
        response = client.post("/parse/", json={"mensagem": "paciente João da Silva amanhã 14h"})
        assert response.status_code == 200
    limited = client.post("/parse/", json={"mensagem": "paciente João da Silva amanhã 14h"})
    assert limited.status_code == 429
