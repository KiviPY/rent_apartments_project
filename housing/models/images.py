from django.db import models
from .register_apartments import RegisterApartments


# Create your models here.

class ApartmentImage(models.Model):
    apartment = models.ForeignKey(RegisterApartments, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='apartments/')

    def __str__(self):
        return f"Image for {self.apartment.title}"

    class Meta:
        db_table = 'images'
