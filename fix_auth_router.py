with open("api/app/routers/auth_router.py", "r") as f:
    content = f.read()

content = content.replace("from app.deps import SessionDep", "from app.deps import SessionDep, CurrentUser")

with open("api/app/routers/auth_router.py", "w") as f:
    f.write(content)
