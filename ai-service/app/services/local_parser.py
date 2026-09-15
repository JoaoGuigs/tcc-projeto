import re
import unicodedata
from datetime import date, datetime, timedelta

from app.models.schemas import AgendamentoExtraido

WEEKDAYS = {
    "segunda": 0, "segunda-feira": 0, "terca": 1, "terca-feira": 1,
    "quarta": 2, "quarta-feira": 2, "quinta": 3, "quinta-feira": 3,
    "sexta": 4, "sexta-feira": 4, "sabado": 5, "domingo": 6,
}


def _normalize(value: str) -> str:
    return "".join(char for char in unicodedata.normalize("NFD", value.lower()) if unicodedata.category(char) != "Mn")


def _extract_date(normalized: str, today: date) -> date | None:
    iso = re.search(r"\b(20\d{2})-(\d{2})-(\d{2})\b", normalized)
    if iso:
        try:
            return date(*map(int, iso.groups()))
        except ValueError:
            return None
    br = re.search(r"\b(\d{1,2})/(\d{1,2})/(20\d{2})\b", normalized)
    if br:
        day, month, year = map(int, br.groups())
        try:
            return date(year, month, day)
        except ValueError:
            return None
    if re.search(r"\bhoje\b", normalized):
        return today
    if re.search(r"\bamanha\b", normalized):
        return today + timedelta(days=1)
    for label, weekday in WEEKDAYS.items():
        if re.search(rf"\b{re.escape(label)}\b", normalized):
            delta = (weekday - today.weekday()) % 7 or 7
            if "semana que vem" in normalized:
                delta += 7 if delta <= 7 else 0
            return today + timedelta(days=delta)
    return None


def _extract_time(normalized: str) -> str | None:
    match = re.search(r"\b([01]?\d|2[0-3])(?:h|:)([0-5]\d)?\b", normalized)
    if not match:
        match = re.search(r"\b(?:as|a)\s+([01]?\d|2[0-3])(?:\s*horas?)?\b", normalized)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2) or 0) if len(match.groups()) > 1 else 0
    if "da tarde" in normalized and hour < 12:
        hour += 12
    return f"{hour:02d}:{minute:02d}"


def _extract_name(message: str) -> str | None:
    value = re.sub(r"^(paciente|agendar|agenda|marcar|cancela|cancelar)\s+", "", message.strip(), flags=re.I)
    value = re.sub(r"\b(hoje|amanh[ãa]|semana que vem|segunda(?:-feira)?|terça(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sábado|sabado|domingo)\b", " ", value, flags=re.I)
    value = re.sub(r"\b20\d{2}-\d{2}-\d{2}\b|\b\d{1,2}/\d{1,2}/20\d{2}\b", " ", value)
    value = re.sub(r"\b(?:às|as|a)?\s*\d{1,2}(?:h|:)\d{0,2}\b|\b(?:às|as|a)\s+\d{1,2}(?:\s*horas?)?\b", " ", value, flags=re.I)
    value = re.sub(r"\b(da manhã|da manha|da tarde|da noite|para|de)\b", " ", value, flags=re.I)
    value = " ".join(value.split()).strip(" ,.-")
    return value.title() if len(value) >= 2 else None


def parse_local(message: str, now: datetime | None = None) -> AgendamentoExtraido | None:
    normalized = _normalize(message)
    if re.search(r"\b(cancela|cancelar)\b", normalized):
        intent = "cancelar"
    elif re.search(r"\b(paciente|agendar|agenda|marcar)\b", normalized):
        intent = "agendar"
    else:
        return None

    today = (now or datetime.now()).date()
    parsed_date = _extract_date(normalized, today)
    parsed_time = _extract_time(normalized)
    name = _extract_name(message)
    if not (parsed_date and parsed_time and name):
        return None
    return AgendamentoExtraido(intencao=intent, paciente=name, data=parsed_date.isoformat(), hora=parsed_time)
