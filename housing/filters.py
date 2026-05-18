import django_filters
from django_filters import rest_framework as filters
from .models import RegisterApartments, Renting

class ApartmentFilter(filters.FilterSet):
    description = django_filters.CharFilter(field_name='description', lookup_expr='icontains', required=False)
    city = filters.CharFilter(field_name='city', lookup_expr='icontains', required=False)
    min_price = filters.NumberFilter(field_name='price_per_month', lookup_expr='gte', required=False)
    max_price = filters.NumberFilter(field_name='price_per_month', lookup_expr='lte', required=False)
    property_type = filters.CharFilter(field_name='property_type', lookup_expr='exact', required=False)
    min_rent_duration = filters.NumberFilter(field_name='min_rent_duration', lookup_expr='gte', required=False)
    max_rent_duration = filters.NumberFilter(field_name='max_rent_duration', lookup_expr='lte', required=False)
    min_residents = filters.NumberFilter(field_name='max_residents', lookup_expr='gte', required=False)
    min_bedrooms = filters.NumberFilter(field_name='bedrooms', lookup_expr='gte', required=False)
    min_bathrooms = filters.NumberFilter(field_name='bathrooms', lookup_expr='gte', required=False)
    min_size_of_property = filters.NumberFilter(field_name='size_of_property', lookup_expr='gte', required=False)
    has_heating = filters.BooleanFilter(field_name='heating', required=False)
    has_parking = django_filters.BooleanFilter(field_name='parking', required=False)
    has_balcony = django_filters.BooleanFilter(field_name='balcony', required=False)
    has_terrace = django_filters.BooleanFilter(field_name='terrace', required=False)
    permission_for_pets = filters.BooleanFilter(field_name='pets', required=False)
    permission_for_smoking = filters.BooleanFilter(field_name='smoking', required=False)
    is_good_for_couples = filters.BooleanFilter(field_name='good_for_couples', required=False)
    permission_for_musical_instruments = filters.BooleanFilter(field_name='musical_instruments', required=False)
    permission_for_small_kids = filters.BooleanFilter(field_name='small_kids', required=False)
    is_furnished = filters.BooleanFilter(field_name='is_furnished', required=False)
    min_average_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='gte', required=False)

    class Meta:
        model = RegisterApartments
        fields = []




class BookingFilter(filters.FilterSet):
    status = filters.CharFilter(field_name='status', lookup_expr='exact')

    class Meta:
        model = Renting
        fields = []