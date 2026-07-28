.PHONY: help up down init build logs exec dev start rebuild add-pm2 start-pm2 stop-pm2 restart-pm2 restart-prod ps pm2-ps kill-port clean

SERVICE_NAME=bot-service
SERVICE_PORT=8600

help:
	@echo "Available commands:"
	@echo ""
	@echo "  Basic:"
	@echo "    make init       - Initialize and start services"
	@echo "    make up         - Start services"
	@echo "    make down       - Stop services"
	@echo "    make rebuild    - Rebuild Docker image"
	@echo "    make clean      - Clean up (remove containers, logs)"
	@echo ""
	@echo "  Development:"
	@echo "    make dev        - Start development mode (live reload)"
	@echo "    make build      - Build TypeScript to JavaScript"
	@echo "    make start      - Run production build"
	@echo "    make logs       - View service Docker logs"
	@echo "    make exec       - Open shell in container"
	@echo "    make ps         - View running containers"
	@echo ""
	@echo "  Production (PM2):"
	@echo "    make add-pm2    - Install PM2 globally in container"
	@echo "    make start-pm2  - Start service with PM2"
	@echo "    make stop-pm2   - Stop PM2 service"
	@echo "    make restart-pm2- Restart PM2 service"
	@echo "    make restart-prod- Full production restart (stop & restart)"
	@echo "    make pm2-logs   - View PM2 logs"
	@echo "    make pm2-ps     - View PM2 processes"
	@echo "    make kill-port  - Kill process using port $(SERVICE_PORT)"

init: up
	@echo "✓ Bot service initialized"

up:
	docker compose up -d
	@echo "✓ Services started"

down:
	docker compose down
	@echo "✓ Services stopped"

exec:
	docker compose exec $(SERVICE_NAME) sh

dev:
	docker compose up -d && docker compose exec $(SERVICE_NAME) sh -c "yarn dev"

build:
	docker compose exec $(SERVICE_NAME) sh -c "yarn build"
	@echo "✓ Build completed"

start:
	docker compose exec $(SERVICE_NAME) sh -c "yarn start"

rebuild:
	docker compose down
	docker compose up -d --build
	@echo "✓ Services rebuilt and started"

# PM2 Production Commands
add-pm2:
	docker compose exec $(SERVICE_NAME) sh -c "yarn global add pm2"
	@echo "✓ PM2 installed"

start-pm2:
	docker compose exec $(SERVICE_NAME) sh -c "pm2 start \"yarn start\" --name $(SERVICE_NAME)"
	@echo "✓ PM2 started"

stop-pm2:
	docker compose exec $(SERVICE_NAME) pm2 stop all || true
	$(MAKE) kill-port

restart-pm2:
	docker compose exec $(SERVICE_NAME) pm2 restart all
	@echo "✓ PM2 restarted"

restart-prod: stop-pm2 restart-pm2
	@echo "✓ Production restarted"

logs:
	docker compose exec $(SERVICE_NAME) pm2 log

ps:
	docker compose ps

pm2-ps:
	docker compose exec $(SERVICE_NAME) pm2 list

kill-port:
	docker compose exec $(SERVICE_NAME) sh -c "\
	PID=\$$(netstat -ltnp 2>/dev/null | grep -w ':$(SERVICE_PORT)' | tr -s ' ' | cut -d' ' -f7 | cut -d'/' -f1); \
	if [ -n \"\$$PID\" ] && kill -0 \$$PID 2>/dev/null; then kill -9 \$$PID; fi"

clean:
	docker compose down
	rm -rf out/
	@echo "✓ Cleaned up"
