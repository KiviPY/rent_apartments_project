from rest_framework import serializers
from housing.models import Renting
from django.core.mail import send_mail

def send_booking_email(booking):
    """booking - это просто экземпляр записи в базе данных, где хранится: какая квартира забронирована, кем и в каком статусе.
    Например: booking.apartment.title --> "Cozy Studio in Leipzig", booking.user.username --> # "kyrylo"
"""
    owner = booking.apartment.user  # это владелец квартиры
    to_email = owner.email
    subject = f"{booking.user.username} is interested in your apartment {booking.apartment.title}" # Theme of mail
    message = f"""Hello {owner.username}, 
               
    f"{booking.user.username} wants to rent your apartment {booking.apartment.title}. He/She wrote you a message.
    
    IMPORTANT:

    Now status is {booking.apartment.status}.If apartment is already rented change it please
    
    Available statuses for users:
        1. Rented
        2. Cancelled
        3. Pending (now by this user)
    """
    send_mail(subject, message, 'noreply@yourapp.com', [to_email], fail_silently=False)


class RentingStatusSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    apartment = serializers.CharField(source='apartment.title', read_only=True)

    class Meta:
        model = Renting
        fields = ['id', 'status', 'user', 'apartment', 'created_at']
        read_only_fields = ['created_at']




class RentingApartmentsSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    apartment_title = serializers.CharField(source='apartment.title', read_only=True)

    class Meta:
        model = Renting
        fields = ['id', 'user', 'apartment', 'apartment_title', 'status', 'created_at']
        read_only_fields = ['apartment', 'user', 'status', 'created_at']