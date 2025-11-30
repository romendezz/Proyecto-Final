from django.db import models

class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=6, decimal_places=2)
    stock = models.IntegerField(default=0)
    proveedor = models.CharField(max_length=100, blank=True, null=True)

    def str(self):
        return self.nombre
# Create your models here.
