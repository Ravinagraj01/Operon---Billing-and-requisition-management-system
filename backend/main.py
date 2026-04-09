from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, users, requisitions, approvals, comments, notifications, dashboard
from seed import seed_data

# Create FastAPI app
app = FastAPI(
    title="Procura API",
    version="1.0.0",
    description="Intelligent requisition pipeline and approvals management system"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(users.router, tags=["Users"])
app.include_router(requisitions.router, tags=["Requisitions"])
app.include_router(approvals.router, tags=["Approvals"])
app.include_router(comments.router, tags=["Comments"])
app.include_router(notifications.router, tags=["Notifications"])
app.include_router(dashboard.router, tags=["Dashboard"])

@app.on_event("startup")
def startup_event():
    # Create database tables
    Base.metadata.create_all(bind=engine)
    # Seed initial data
    seed_data()
    print("Procura API started successfully")

@app.get("/")
def root():
    return {
        "message": "Procura API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }
