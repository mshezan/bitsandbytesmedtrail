.PHONY: demo up down clean generate

demo: clean down up generate

up:
	docker compose up -d --build

down:
	docker compose down -v

clean:
	rm -rf mock_data/*

generate:
	docker compose exec api python /mock_systems/generate.py --scale full --reset
