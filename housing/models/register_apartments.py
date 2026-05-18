from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import ManyToManyField
from django_countries.fields import CountryField


from django.conf import settings


# Create your models here.


class RegisterApartments(models.Model):

    # -------------------- BASE INFO --------------------
    title = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    country = CountryField(blank_label='Choose country')
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=300)
    house_number = models.PositiveIntegerField(default=0, null=True, blank=True)
    postal_code = models.CharField(max_length=20)

    # +- maybe for map
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # -------------------- PROPERTY TYPE --------------------
    PROPERTY_TYPE_CHOICES = [
        ('Apartment', 'Apartment'),
        ('House', 'House'),
        ('Studio', 'Studio'),
        ('Room', 'Room'),
    ]

    property_type = models.CharField(max_length=9, choices=PROPERTY_TYPE_CHOICES, default='AP')

    # -------------------- PRICE & RENT --------------------
    MIN_RENT_CHOICES = [
        (i, f"{i} month" if i == 1 else f"{i} months")
        for i in range(1, 25)
    ] + [
        (999, "More than 24 months")
    ]

    min_rent_duration = models.IntegerField(choices=MIN_RENT_CHOICES, default=1)
    max_rent_duration = models.IntegerField(choices=MIN_RENT_CHOICES, null=True, blank=True)

    price_per_month = models.PositiveIntegerField(default=1)
    currency = models.CharField(max_length=5, default='EUR')

    # -------------------- CAPACITY --------------------
    max_residents = models.PositiveIntegerField(default=1)
    bedrooms = models.PositiveIntegerField(default=1)
    bathrooms = models.PositiveIntegerField(default=1)
    size_of_property = models.PositiveIntegerField(help_text="Size in m²")

    # -------------------- BASIC FEATURES --------------------
    heating = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    balcony = models.BooleanField(default=False)
    terrace = models.BooleanField(default=False)

    # -------------------- RULES --------------------
    pets = models.BooleanField(default=False)
    smoking = models.BooleanField(default=False)
    good_for_couples = models.BooleanField(default=False)
    musical_instruments = models.BooleanField(default=False)
    small_kids = models.BooleanField(default=False)
    is_furnished = models.BooleanField(default=False)

    # -------------------- STATUS --------------------
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    # -------------------- ANALYTICS --------------------
    views_count = models.PositiveIntegerField(default=0)
    average_rating = models.FloatField(default=0)
    reviews_count = models.PositiveIntegerField(default=0)

    # -------------------- MEDIA --------------------
    main_image = models.ImageField(upload_to='apartments/', null=True, blank=True)

    # -------------------- RELATIONS --------------------
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='apartments')

    # -------------------- TIME --------------------
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # -------------------- LOGIC --------------------
    def clean(self):
        super().clean()

        # Check of rental terms
        if self.max_rent_duration and self.min_rent_duration > self.max_rent_duration:
            raise ValidationError("Min rent cannot be greater than max rent")

    def __str__(self):
        return f"{self.title} - {self.city}"

    class Meta:
        indexes = [
            models.Index(fields=['city']),
            models.Index(fields=['price_per_month']),
            models.Index(fields=['created_at']),
        ]

        db_table = 'apartments'