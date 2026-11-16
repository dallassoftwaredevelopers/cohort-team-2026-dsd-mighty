-- Recreate the signup trigger.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill any Auth users missing an app_users profile.
INSERT INTO public.app_users (
    user_id,
    full_name,
    email,
    status
)
SELECT
    u.id,
    public.app_user_full_name(u.email, u.raw_user_meta_data),
    u.email,
    'inactive'
FROM auth.users u
LEFT JOIN public.app_users p
    ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;