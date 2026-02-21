from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProblemCodeViewSet, SupportTicketViewSet

router = DefaultRouter()
router.register(r'problem-codes', ProblemCodeViewSet, basename='problemcode')
router.register(r'tickets', SupportTicketViewSet, basename='supportticket')

urlpatterns = [
    path('', include(router.urls)),
]
