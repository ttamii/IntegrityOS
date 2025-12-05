from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import init_db
from app.routes import objects, inspections, dashboard, import_data, reports, admin

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing IntegrityOS Backend...")
    init_db()
    print("Database initialized")
    yield
    # Shutdown
    print("Shutting down IntegrityOS Backend...")


app = FastAPI(
    title="IntegrityOS API",
    description="API для платформы визуализации и анализа данных обследований трубопроводов",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(objects.router, prefix="/api/objects", tags=["Objects"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["Inspections"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(import_data.router, prefix="/api/import", tags=["Import"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {
        "message": "IntegrityOS API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
