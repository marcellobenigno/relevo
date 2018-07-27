from django.contrib.gis.db import models
from django.urls import reverse


class ProfileManager(models.Manager):

    def get(self, road_pk):
        sql = """
          WITH points AS (
              SELECT
                id,
                ST_Length(geom :: GEOGRAPHY)/20.0 length,
                ST_LineInterpolatePoint(geom, id / 20.0) geom
              FROM generate_series(0, 20) id,
                (SELECT (ST_Dump(geom)).geom
                 FROM roads
                 WHERE id = {}) foo)
              SELECT
                points.id,
                ST_X(geom) x,
                ST_Y(geom) y,
                length,
                ST_Value(rast, geom) :: INTEGER elev
              FROM points, dem
              WHERE ST_Intersects(rast, geom)
              """.format(road_pk)
        return super(ProfileManager, self).get_queryset().raw(sql)


class DEM(models.Model):
    rast = models.RasterField()
    filename = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'dem'

    objects = models.Manager()

    profile = ProfileManager()


class Road(models.Model):
    code = models.CharField('código', max_length=50, null=True, blank=True)
    comp_2d = models.DecimalField('comprimento 2D', max_digits=8, decimal_places=2, blank=True, null=True)
    comp_3d = models.DecimalField('comprimento 3D', max_digits=8, decimal_places=2, blank=True, null=True)
    geom = models.MultiLineStringField('geom', srid=4326)

    def __str__(self):
        return "{}".format(self.code)

    def get_absolute_url(self):
        return reverse('core:detail', args=[str(self.id)])

    @property
    def get_code(self):
        if self.code is not None:
            return self.code
        return ''

    @property
    def len_2d(self):
        return "{:.2f}".format(self.comp_2d / 1000).replace('.', ',')

    @property
    def len_3d(self):
        return "{:.2f}".format(self.comp_3d / 1000).replace('.', ',')

    @property
    def popup_content(self):
        popup = "<strong>Trecho: </strong>{} km<br>".format(self.get_code)
        popup += "<strong>Comprimento 2D: </strong>{} km<br>".format(self.len_2d)
        popup += "<strong>Comprimento 3D: </strong>{} km<br>".format(self.len_3d)
        popup += "<a href='{}'>+ informações</a>".format(self.get_absolute_url())
        return popup

    class Meta:
        db_table = 'roads'
