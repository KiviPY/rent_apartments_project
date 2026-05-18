from rest_framework import serializers

from housing.models import RegisterApartments, ApartmentImage



class ApartmentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApartmentImage
        fields = '__all__'
        read_only_fields = ('apartment',)


class RegisterApartmentsSerializer(serializers.ModelSerializer):
    images = ApartmentImageSerializer(many=True, read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = RegisterApartments
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'views_count', 'average_rating', 'reviews_count',)