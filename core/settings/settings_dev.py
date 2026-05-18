from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# SQLite для локальной разработки
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# InMemory вместо Redis — не нужно запускать Redis локально
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Письма в консоль
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'