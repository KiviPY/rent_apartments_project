from django_countries.serializer_fields import CountryField
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import User


class UserSerializer(serializers.ModelSerializer):
    nationality = CountryField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'birth_date',
            'phone_number',
            'gender',
            'nationality'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_password(self, value):
        # проверяет пароль через все валидаторы из base.py
        validate_password(value, user=self.instance)
        return value


    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user