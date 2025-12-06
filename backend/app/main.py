from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import init_db, SessionLocal
from app.routes import objects, inspections, dashboard, import_data, reports, admin, auth, media, repair_works, notifications
from app import models
from app.auth import get_password_hash

load_dotenv()


def create_default_users():
    """Create default users for all roles if not exist."""
    db = SessionLocal()
    try:
        default_users = [
            {
                "username": "admin",
                "email": "admin@integrityos.kz",
                "password": "admin123",
                "full_name": "Администратор",
                "role": models.UserRole.ADMIN
            },
            {
                "username": "inspector",
                "email": "inspector@integrityos.kz",
                "password": "inspector123",
                "full_name": "Иванов Петр Сергеевич",
                "role": models.UserRole.INSPECTOR
            },
            {
                "username": "analyst",
                "email": "analyst@integrityos.kz",
                "password": "analyst123",
                "full_name": "Сидорова Анна Михайловна",
                "role": models.UserRole.ANALYST
            },
            {
                "username": "guest",
                "email": "guest@integrityos.kz",
                "password": "guest123",
                "full_name": "Гость",
                "role": models.UserRole.GUEST
            }
        ]
        
        created_count = 0
        for user_data in default_users:
            existing = db.query(models.User).filter(
                models.User.username == user_data["username"]
            ).first()
            
            if not existing:
                new_user = models.User(
                    username=user_data["username"],
                    email=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    is_active=True
                )
                db.add(new_user)
                created_count += 1
        
        if created_count > 0:
            db.commit()
            print(f"Created {created_count} default users")
            print("Test accounts:")
            print("  admin / admin123 - Администратор")
            print("  inspector / inspector123 - Инспектор")
            print("  analyst / analyst123 - Аналитик")
            print("  guest / guest123 - Гость")
    except Exception as e:
        print(f"Error creating default users: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing IntegrityOS Backend...")
    init_db()
    print("Database initialized")
    create_default_users()
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
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


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
