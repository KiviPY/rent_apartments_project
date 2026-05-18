from django.conf import settings
from django.db import models
from .register_apartments import RegisterApartments


class Renting(models.Model):

    apartment = models.ForeignKey(RegisterApartments, on_delete=models.CASCADE, related_name='renting')
    status = models.CharField(max_length=10, choices=[('pending','Pending'),('rented','Rented'),('cancelled','Cancelled')], default='pending')

    # link on custom user
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='renting')
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.user.username} want to rent {self.apartment.title}"

    class Meta:
        db_table = 'renting'