# Берём официальный Python образ
FROM python:3.13-slim

# Устанавливаем системные зависимости для MySQL
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

# Создаём папку для логов
RUN mkdir -p logs

# Порт на котором работает Daphne
EXPOSE 8000