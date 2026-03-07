# DocHub — Агрегатор документации

Универсальный агрегатор технической документации с красивым UI, мгновенным поиском и возможностью добавлять свои заметки.

## Возможности

- **Поиск** по всем документациям (MeiliSearch, typo-tolerant)
- **Официальные доки** — React, Python, Django, PHP, Go, Rust и др.
- **Пользовательские заметки** — добавляй свои доки в Markdown
- **Красивый UI** — подсветка синтаксиса, автооглавление, тёмная тема
- **Многоформатность** — Markdown, MDX, reStructuredText, AsciiDoc, OpenAPI, HTML
- **Фильтрация** по языкам и фреймворкам

## Архитектура

```
Frontend (React)
    │
    │ REST API
    ▼
Backend (PHP / Symfony)
    │
    │ REST API
    ▼
Scraper / Processor (Python)
```
<img width="824" height="876" alt="image" src="https://github.com/user-attachments/assets/45034160-be13-4c2c-ba8b-47b8a717ef67" />

| Компонент | Стек                                                    |
|---|---------------------------------------------------------|
| Фронт | React, Vite, Tailwind, shadcn/ui, react-markdown, Shiki |
| Бэкенд | PHP, Symfony, API Platform, Doctrine ORM                |
| Скрейпер | Python, Scrapy, BeautifulSoup, Pandoc, markdownify      |
| БД | PostgreSQL                                              |
| Поиск | MeiliSearch                                             |

## Поддерживаемые форматы

| Формат | Конвертер | Покрытие |
|---|---|---|
| Markdown / GFM | `mistune` | React, Vue, Node.js, Go, Rust и др. |
| MDX | JSX-стриппер → MD | Docusaurus-проекты |
| reStructuredText | `docutils` | Python, Django, Flask |
| AsciiDoc | `pandoc` | Spring, Red Hat |
| OpenAPI / AsyncAPI | `prance` + `PyYAML` | REST/async API спецификации |
| HTML | `beautifulsoup4` + `markdownify` | MDN, PHP.net, любые сайты |

Все форматы конвертируются в **нормализованный Markdown**.

## Быстрый старт

```bash
docker compose up -d
```

| Сервис              | URL |
|---------------------|---|
| Фронт               | http://localhost:3000 |
| API                 | http://localhost:8000/api |
| MeiliSearch         | http://localhost:7700 |
## Структура проекта

```
dochub/
├── frontend/          # React + Vite
├── backend/           # PHP / Symfony
├── scraper/           # Python
├── docker-compose.yml
└── README.md
```

## Лицензия

MIT
