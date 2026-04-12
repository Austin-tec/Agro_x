from backend.app import create_app
app = create_app('development')
print('App ready:', app is not None)
print('USE_SUPABASE=', app.config.get('USE_SUPABASE'))
