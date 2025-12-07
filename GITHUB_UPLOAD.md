# Инструкция по загрузке IntegrityOS в GitHub

## Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на https://github.com
2. Нажмите на кнопку **"New"** или **"+"** → **"New repository"**
3. Заполните данные:
   - **Repository name**: `IntegrityOS` (или любое другое название)
   - **Description**: `MVP платформы для анализа данных обследований трубопроводов`
   - **Visibility**: Public (или Private, если хотите)
   - **НЕ** ставьте галочки на "Add README", "Add .gitignore", "Choose a license" (у нас уже все есть)
4. Нажмите **"Create repository"**

## Шаг 2: Подключите локальный репозиторий к GitHub

После создания репозитория GitHub покажет вам команды. Используйте следующие команды в терминале:

```bash
# Перейдите в директорию проекта
cd "d:\Integrity OS"

# Добавьте удаленный репозиторий (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/IntegrityOS.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите код на GitHub
git push -u origin main
```

## Шаг 3: Проверьте загрузку

1. Обновите страницу вашего репозитория на GitHub
2. Вы должны увидеть все файлы проекта
3. README.md автоматически отобразится на главной странице

## Альтернативный способ (если возникнут проблемы)

Если у вас настроена SSH аутентификация:

```bash
git remote add origin git@github.com:YOUR_USERNAME/IntegrityOS.git
git branch -M main
git push -u origin main
```

## Что делать, если нужен токен доступа

Если GitHub запросит логин и пароль, вам нужно создать Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Выберите scope: `repo` (полный доступ к репозиториям)
4. Скопируйте токен
5. Используйте токен вместо пароля при push

## После загрузки

Ваш репозиторий будет содержать:
- Весь исходный код (backend + frontend)
- Docker конфигурацию
- Подробный README.md с инструкциями
- .gitignore (секретные файлы не попадут в репозиторий)

## Дополнительные команды Git

```bash
# Проверить статус
git status

# Посмотреть удаленные репозитории
git remote -v

# Добавить новые изменения
git add .
git commit -m "Описание изменений"
git push

# Посмотреть историю коммитов
git log --oneline
```

## Рекомендации для README на GitHub

README.md уже создан и содержит:
- Описание проекта
- Инструкции по установке
- Технологический стек
- Скриншоты (можно добавить позже)

Можете добавить badges в начало README:
```markdown
![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-teal)
```

## Что НЕ попадет в GitHub (благодаря .gitignore)

- `.env` файлы (секретные ключи)
- `node_modules/` (зависимости)
- `__pycache__/` (Python кеш)
- База данных
- Логи

Вместо этого есть `.env.example` файлы для примера.

---

**Готово!** После выполнения этих шагов ваш проект будет доступен на GitHub и вы сможете поделиться ссылкой с организаторами хакатона!
