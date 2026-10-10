import sys

with open("api/app/models.py", "r") as f:
    content = f.read()

# I need to add content_hash and source_id to Record.
# Wait, let's just grep the definition of Record.
