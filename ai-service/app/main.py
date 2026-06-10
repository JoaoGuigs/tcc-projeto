from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI

from app.routes.parser import router as parser_router

app = FastAPI(
    title="PhysioClinic AI Service",
    description="Microserviço de parsing de mensagens WhatsApp para agendamentos.",
    version="1.0.0",
)

app.include_router(parser_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
