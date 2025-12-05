# IntegrityOS MVP

![IntegrityOS](https://img.shields.io/badge/Status-MVP-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal)

**IntegrityOS** — платформа для визуализации, хранения и анализа данных обследований магистральных трубопроводов с ML-классификацией рисков.

## Возможности

- **Импорт данных** — загрузка CSV/XLSX файлов с валидацией
- **Интерактивная карта** — визуализация объектов и дефектов на карте Казахстана
- **Поиск и фильтрация** — по методам контроля, датам, типам дефектов
- **Аналитический дашборд** — статистика по методам, рискам, объектам
- **ML-классификация** — автоматическая оценка критичности дефектов (94.74% accuracy)
- **Генерация отчетов** — экспорт в HTML/PDF
- **Современный UI** — адаптивный интерфейс с темной темой

## Архитектура

```
IntegrityOS/
├── backend/          # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── routes/
│   │   └── services/
│   ├── scripts/
│   └── requirements.txt
├── frontend/         # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
├── data/            # CSV/XLSX файлы
├── models/          # ML модели
└── docker-compose.yml
```

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd "Integrity OS"
```

2. **Создайте файл .env:**
```bash
cp .env.example .env
```

3. **Запустите Docker Compose:**
```bash
docker-compose up -d
```

4. **Откройте приложение:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Вариант 2: Локальная установка

#### Backend

1. **Установите Python 3.11+**

2. **Создайте виртуальное окружение:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. **Установите зависимости:**
```bash
pip install -r requirements.txt
```

4. **Настройте PostgreSQL:**
```bash
# Создайте базу данных
createdb integrityos
```

5. **Запустите сервер:**
```bash
uvicorn app.main:app --reload
```

#### Frontend

1. **Установите Node.js 18+**

2. **Установите зависимости:**
```bash
cd frontend
npm install
```

3. **Запустите dev-сервер:**
```bash
npm run dev
```

## Генерация тестовых данных

```bash
cd backend
python scripts/data_generator.py
```

Это создаст синтетические данные для:
- 3 магистральных трубопровода (MT-01, MT-02, MT-03)
- ~100 объектов контроля
- ~500 диагностических записей

## Использование

### 1. Импорт данных

1. Перейдите в раздел "Импорт данных"
2. Загрузите CSV/XLSX файл
3. Проверьте маппинг колонок
4. Нажмите "Импортировать"

### 2. Просмотр на карте

1. Откройте "Карта"
2. Используйте фильтры для поиска объектов
3. Кликните на маркер для просмотра деталей

### 3. Аналитика

1. Перейдите в "Дашборд"
2. Просмотрите статистику по методам и рискам
3. Экспортируйте данные при необходимости

### 4. Генерация отчетов

1. Откройте "Отчеты"
2. Выберите период и фильтры
3. Сгенерируйте HTML или PDF отчет

## Технологический стек

### Backend
- **FastAPI** — современный веб-фреймворк
- **PostgreSQL** — реляционная база данных
- **SQLAlchemy** — ORM
- **Pandas** — обработка данных
- **Scikit-learn** — ML-классификация
- **ReportLab** — генерация PDF

### Frontend
- **React 18** — UI библиотека
- **TypeScript** — типизация
- **Vite** — сборщик
- **Tailwind CSS** — стилизация
- **Leaflet** — интерактивные карты
- **Recharts** — графики и диаграммы
- **Axios** — HTTP клиент

## Тестирование

### Backend тесты
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend тесты
```bash
cd frontend
npm run test
```

## API документация

После запуска backend, документация доступна по адресу:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Разработка

### Структура данных

#### Objects.csv
```csv
object_id,object_name,object_type,pipeline_id,lat,lon,year,material
1,"Кран подвесной","crane","MT-02",52.96,63.12,1961,"Ст3"
```

#### Diagnostics.csv
```csv
diag_id,object_id,method,date,temperature,humidity,illumination,defect_found,defect_description,quality_grade,param1,param2,param3,ml_label
1,1,"VIK","2023-05-15",22.5,65.0,500.0,true,"Коррозия",допустимо,2.5,10.0,5.0,medium
```

### Методы контроля
- **VIK** — Визуальный и измерительный контроль
- **PVK** — Пневматические испытания
- **MPK** — Магнитопорошковый контроль
- **UZK** — Ультразвуковой контроль
- **RGK** — Радиографический контроль
- **TVK** — Тепловизионный контроль
- **VIBRO** — Виброакустический контроль
- **MFL** — Магнитный контроль потоков рассеяния
- **TFI** — Трубная инспекция
- **GEO** — Геодезический контроль
- **UTWM** — Ультразвуковая толщинометрия

## Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## Лицензия

MIT License

## Авторы

Разработано для хакатона по анализу данных трубопроводов

## Известные проблемы

- ML-модель требует минимум 50 записей для обучения
- Импорт файлов >10MB может занять время
- Карта оптимизирована для <10,000 точек

## Поддержка

Если у вас возникли вопросы или проблемы, создайте Issue в GitHub.

---

**IntegrityOS** - Platform for pipeline integrity management
