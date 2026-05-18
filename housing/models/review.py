from django.conf import settings
from django.db import models
from .register_apartments import RegisterApartments
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    apartment = models.ForeignKey(RegisterApartments, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MaxValueValidator(5), MinValueValidator(0)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('apartment', 'user')  # 1 отзыв на квартиру

    def __str__(self):
        return f"{self.user} -> {self.apartment} -> ({self.rating})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # подсчёт рейтинга квартиры
        apartment = self.apartment
        reviews = apartment.reviews.all()

        apartment.reviews_count = reviews.count()
        apartment.average_rating = sum(r.rating for r in reviews) / reviews.count()

        apartment.save()