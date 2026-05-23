# DocStorage

Платформа для поиска и хранения технической документации.

## Стек

| Контейнер | Технологии |
|-----------|-----------|
| **frontend** | React 18, Vite, React Router v6 |
| **backend** | PHP 8.3, Symfony 7, LexikJWT, Doctrine ORM |
| **scraper** | Python 3.12, FastAPI, Scrapy, MeiliSearch SDK, Pandoc |
| **meilisearch** | MeiliSearch v1.7 |
| **postgres** | PostgreSQL 16 |

## Запуск

```bash
chmod +x setup.sh && ./setup.sh
```

После запуска:
- Фронтенд: http://localhost:5173
- API: http://localhost:8000/api
- MeiliSearch: http://localhost:7700
- Scraper: http://localhost:8001/docs

## Первый админ

```bash
# 1. Зарегистрируйтесь через UI
# 2. Повысьте до админа:
docker exec docstorage_backend php bin/console doctrine:query:sql \
  "UPDATE users SET roles='[\"ROLE_ADMIN\"]' WHERE username='ВАШ_ЛОГИН'"
```

## Структура

```
docstorage/
├── docker-compose.yml
├── setup.sh
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css  # Design tokens (CSS variables)
│   │   ├── api/client.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   └── pages/     # 15 страниц
├── backend/           # Symfony 7
│   ├── src/
│   │   ├── Controller/ # 8 контроллеров
│   │   └── Entity/     # 6 сущностей
│   └── config/
└── scraper/           # FastAPI
    └── app/
        ├── main.py
        └── routers/   # scrape, logs, export
```
