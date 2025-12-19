import sys
import os

# Clear any existing imports
for mod in list(sys.modules.keys()):
    if 'dashboard' in mod:
        del sys.modules[mod]

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

# Import and inspect
from apps.dashboard.views import dashboard_stats
import inspect

print("=" * 80)
print("ACTUAL LOADED CODE:")
print("=" * 80)
source = inspect.getsource(dashboard_stats)
print(source[:1000])  # First 1000 characters

# Check for the bad code
if 'Workflow.objects.filter(is_deleted' in source:
    print("\n❌ PROBLEM: Old code is still loaded!")
    print("The file is correct, but Python cached the old version.")
else:
    print("\n✅ Code looks correct!")