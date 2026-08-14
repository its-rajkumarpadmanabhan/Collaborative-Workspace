import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collab_workspace.settings')

app = Celery('collab_workspace')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
