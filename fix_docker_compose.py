import re

with open("docker-compose.yml", "r") as f:
    text = f.read()

# The text from mock-kaveri downwards should be moved to before "volumes:"
parts = text.split("volumes:\n  pgdata:")
if len(parts) == 2:
    base = parts[0]
    rest = parts[1]
    
    # Split the mocks out of the bottom of rest
    rest_lines = rest.split("\n")
    mock_start_idx = 0
    for i, line in enumerate(rest_lines):
        if "mock-kaveri:" in line:
            mock_start_idx = i - 1 # include the empty line above
            break
            
    if mock_start_idx > 0:
        actual_volumes = "\n".join(rest_lines[:mock_start_idx])
        mocks_yaml = "\n".join(rest_lines[mock_start_idx:])
        
        # New composed string
        new_yaml = base + mocks_yaml + "\nvolumes:\n  pgdata:" + actual_volumes
        with open("docker-compose.yml", "w") as f:
            f.write(new_yaml)
