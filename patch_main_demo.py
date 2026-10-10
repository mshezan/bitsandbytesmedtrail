with open("api/app/main.py", "r") as f:
    content = f.read()

content = content.replace(
    "from app.routers import ingestion_router, auth_router",
    "from app.routers import ingestion_router, auth_router, demo_router"
)

content = content.replace(
    "app.include_router(ingestion_router.router)",
    "app.include_router(ingestion_router.router)\napp.include_router(demo_router.router)"
)

with open("api/app/main.py", "w") as f:
    f.write(content)
