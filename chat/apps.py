from django.apps import AppConfig


class ChatConfig(AppConfig):
    name = 'chat'

# TODO данные пользователя после выхода с аккаунта не сохраняются, можно войти, но данные типа телефона и даты рождения обнуляются