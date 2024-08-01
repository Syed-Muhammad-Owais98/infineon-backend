# Create and start the containers without running seeds
up:
	docker-compose pull
	docker volume prune -f
	docker-compose up --build
# Down the docker containers
down:
	docker-compose down -v --remove-orphans && docker volume prune -f

# Run the seed script
run-seed:
	docker exec -i rtf_postgres-app psql -U user1 -d post_db < ./seed.sql

# Run everything: Start containers, run migrations, and run seed
init-db:
	make up
	make down
	make run-seed
