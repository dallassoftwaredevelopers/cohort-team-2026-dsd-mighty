-- Portal login for vendor accounts: the payment agent signs in to the
-- vendor's payment portal with it.
--
-- The email is a plain column. The password lives in Supabase Vault
-- (encrypted at rest); the account row keeps only the Vault secret id. Only
-- the functions below touch the secret, and only the service role (the
-- backend) may call them.

-- 1. COLUMNS

alter table public.vendor_accounts
    add column portal_login_email text,

    -- One secret per account. If the secret is deleted from Vault directly,
    -- the account reads as "no password set" instead of pointing at nothing.
    add column portal_password_secret_id uuid
        unique
        references vault.secrets(id) on delete set null;

-- 2. SET OR REPLACE THE PASSWORD

-- security definer: the function runs as its owner, who may write Vault;
-- the service role gets no direct Vault write access through it.
-- search_path = '': security definer functions must not resolve names
-- through a caller-controlled search path.

create function public.set_vendor_account_portal_password(
    p_account_id uuid,
    p_password text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_secret_id uuid;
begin
    if p_password is null or p_password = '' then
        raise exception 'portal password must not be empty'
            using errcode = '22023';
    end if;

    -- Lock the row so two writers cannot both create a secret for it.
    select portal_password_secret_id
    into v_secret_id
    from public.vendor_accounts
    where account_id = p_account_id
    for update;

    if not found then
        raise exception 'vendor account % not found', p_account_id
            using errcode = 'P0002';
    end if;

    if v_secret_id is null then
        v_secret_id := vault.create_secret(
            p_password,
            'vendor_account_portal_password:' || p_account_id::text,
            'Portal password for vendor account ' || p_account_id::text
        );

        update public.vendor_accounts
        set portal_password_secret_id = v_secret_id
        where account_id = p_account_id;
    else
        perform vault.update_secret(v_secret_id, p_password);
    end if;
end;
$$;

-- 3. CLEAR THE PASSWORD

create function public.clear_vendor_account_portal_password(
    p_account_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_secret_id uuid;
begin
    select portal_password_secret_id
    into v_secret_id
    from public.vendor_accounts
    where account_id = p_account_id
    for update;

    if not found then
        raise exception 'vendor account % not found', p_account_id
            using errcode = 'P0002';
    end if;

    if v_secret_id is not null then
        -- The foreign key's on delete set null clears the account's id.
        delete from vault.secrets where id = v_secret_id;
    end if;
end;
$$;

-- 4. READ THE LOGIN (payment agent only)

-- No row when the account does not exist; portal_password is null when none
-- is set.

create function public.get_vendor_account_portal_login(
    p_account_id uuid
)
returns table (
    portal_url text,
    portal_login_email text,
    portal_password text
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        a.portal_url,
        a.portal_login_email,
        s.decrypted_secret
    from public.vendor_accounts as a
    left join vault.decrypted_secrets as s
        on s.id = a.portal_password_secret_id
    where a.account_id = p_account_id;
$$;

-- 5. DELETE THE SECRET WITH ITS ACCOUNT

-- A deleted account must not leave its password behind in Vault.

create function public.delete_vendor_account_portal_password()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if old.portal_password_secret_id is not null then
        delete from vault.secrets where id = old.portal_password_secret_id;
    end if;

    return old;
end;
$$;

create trigger vendor_accounts_delete_portal_password
after delete on public.vendor_accounts
for each row
execute function public.delete_vendor_account_portal_password();

-- 6. ACCESS

-- Functions are executable by public by default, and Supabase's default
-- privileges also grant anon, authenticated and service_role. Only the
-- backend (service role) may call the three password functions; nobody calls
-- the trigger function directly.

revoke execute on function public.set_vendor_account_portal_password(uuid, text)
from public, anon, authenticated;

revoke execute on function public.clear_vendor_account_portal_password(uuid)
from public, anon, authenticated;

revoke execute on function public.get_vendor_account_portal_login(uuid)
from public, anon, authenticated;

revoke execute on function public.delete_vendor_account_portal_password()
from public, anon, authenticated, service_role;

grant execute on function public.set_vendor_account_portal_password(uuid, text)
to service_role;

grant execute on function public.clear_vendor_account_portal_password(uuid)
to service_role;

grant execute on function public.get_vendor_account_portal_login(uuid)
to service_role;
