from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import init_db, SessionLocal
from app.routes import objects, inspections, dashboard, import_data, reports, admin, auth, media, repair_works
from app import models
from app.auth import get_password_hash

load_dotenv()


def create_default_admin():
    """Create default admin user if not exists."""
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(
            models.User.username == "admin"
        ).first()
        
        if not admin_user:
            admin_user = models.User(
                username="admin",
                email="admin@integrityos.kz",
                password_hash=get_password_hash("admin123"),
                full_name="Администратор",
                role=models.UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created (username: admin, password: admin123)")
    except Exception as e:
        print(f"Error creating default admin: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing IntegrityOS Backend...")
    init_db()
    print("Database initialized")
    create_default_admin()
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
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(objects.router, prefix="/api/objects", tags=["Objects"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["Inspections"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(import_data.router, prefix="/api/import", tags=["Import"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(repair_works.router, prefix="/api/works", tags=["Repair Works"])


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
