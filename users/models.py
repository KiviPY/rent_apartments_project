from django.contrib.auth.models import AbstractUser
from django.db import models
from django_countries.fields import CountryField

# Create your models here.

from phonenumber_field.modelfields import PhoneNumberField
from django.core.exceptions import ValidationError
from django.utils import timezone

def validate_birth_date(value):
    if value > timezone.now().date():
        raise ValidationError("Your birth date cannot be in the future.")

class User(AbstractUser):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('NA', 'Prefer not to answer'),
    ]
    email = models.EmailField(unique=True)
    birth_date = models.DateField(validators=[validate_birth_date], blank=True, null=True)
    phone_number = PhoneNumberField(default='', unique=True)  # международный телефон
    gender = models.CharField(max_length=5, choices=GENDER_CHOICES, null=True, blank=True)
    nationality = CountryField(blank_label='Choose country', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'