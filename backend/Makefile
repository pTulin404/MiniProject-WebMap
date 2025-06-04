DC = docker compose

run: 
	$(DC) up --build -d

clean: 
	$(DC) down -v --rmi all

rebuild-demo-app: 
	docker compose build demo-app

restart-prometheus: 
	$(DC) restart prometheus

restart: 
	$(DC) restart

rebuild:
	$(DC) down -v --rmi all
	make run

ps: 
	$(DC) ps