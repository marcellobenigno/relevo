# Generated by Django 2.0.3 on 2018-07-20 18:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_auto_20180720_1532'),
    ]

    operations = [
        migrations.AddField(
            model_name='dem',
            name='filename',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
