from rest_framework import serializers
from housing.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    apartment = serializers.CharField(source='apartment.title', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'user', 'apartment']