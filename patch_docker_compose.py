import yaml

with open("docker-compose.yml", "r") as f:
    config = yaml.safe_load(f)

# Define the 9 mocks
mocks = [
    ("mock-kaveri", "fhir", "Kaveri Multispeciality", 8001),
    ("mock-sunrise", "hl7", "Sunrise Heart", 8002),
    ("mock-metro", "csv", "Metro Diagnostics", 8003),
    ("mock-sanjeevani", "folder", "Sanjeevani Clinic", 8004),
    ("mock-carefirst", "json", "CareFirst Pharmacy", 8005),
    ("mock-lotus", "fhir", "Lotus Women", 8006),
    ("mock-bharat", "hl7", "Bharat ER", 8007),
    ("mock-apex", "json", "Apex Imaging", 8008),
    ("mock-greenfield", "spreadsheet", "Greenfield PHC", 8009)
]

for name, sys_type, org_name, port in mocks:
    config["services"][name] = {
        "build": "./mock_systems",
        "container_name": name,
        "environment": {
            "SYSTEM_TYPE": sys_type,
            "ORG_NAME": org_name,
            "DATA_DIR": "/data"
        },
        "ports": [f"{port}:80"],
        "volumes": [f"./mock_data/{name}:/data"]
    }

with open("docker-compose.yml", "w") as f:
    yaml.dump(config, f, sort_keys=False)
