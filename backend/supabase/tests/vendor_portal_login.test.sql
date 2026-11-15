-- Vendor portal passwords live in Vault, and only the service role can set,
-- clear or read them (migration 20261115100000_vendor_portal_login).
-- Runs in one transaction that rolls back.

begin;

select plan(24);

-- 1. COLUMNS

select has_column(
    'public', 'vendor_accounts', 'portal_login_email',
    'vendor_accounts has portal_login_email'
);

select has_column(
    'public', 'vendor_accounts', 'portal_password_secret_id',
    'vendor_accounts has portal_password_secret_id'
);

-- 2. FIXTURES

insert into public.properties (property_id, property_name, street, city, state, zip_code)
values (
    '00000000-0000-4000-8000-0000000000a1',
    'Test Property', '1 Main St', 'Dallas', 'TX', '75201'
);

insert into public.vendors (vendor_id, vendor_name)
values ('00000000-0000-4000-8000-0000000000b1', 'Test Vendor');

insert into public.vendor_accounts (
    account_id, property_id, vendor_id, account_number, account_type,
    payment_method, portal_url, portal_login_email
)
values (
    '00000000-0000-4000-8000-0000000000c1',
    '00000000-0000-4000-8000-0000000000a1',
    '00000000-0000-4000-8000-0000000000b1',
    'ACC-1', 'water', 'ach', 'https://portal.example', 'ap@example.com'
);

-- 3. SET, REPLACE, READ, CLEAR

select is(
    (select portal_password_secret_id from public.vendor_accounts
     where account_id = '00000000-0000-4000-8000-0000000000c1'),
    null,
    'a new account has no password'
);

select results_eq(
    $$ select * from public.get_vendor_account_portal_login(
        '00000000-0000-4000-8000-0000000000c1') $$,
    $$ values ('https://portal.example'::text, 'ap@example.com'::text, null::text) $$,
    'reading a login without a password gives a null password'
);

select lives_ok(
    $$ select public.set_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1', 'first-pass') $$,
    'setting a password works'
);

select isnt(
    (select portal_password_secret_id from public.vendor_accounts
     where account_id = '00000000-0000-4000-8000-0000000000c1'),
    null,
    'the account points at its Vault secret'
);

select is(
    (select s.decrypted_secret
     from vault.decrypted_secrets as s
     join public.vendor_accounts as a on a.portal_password_secret_id = s.id
     where a.account_id = '00000000-0000-4000-8000-0000000000c1'),
    'first-pass',
    'the password is in Vault'
);

select is(
    (select count(*)::int
     from public.vendor_accounts as a
     where a::text like '%first-pass%'),
    0,
    'the account row never holds the password'
);

select is(
    (select count(*)::int
     from vault.secrets
     where secret like '%first-pass%'),
    0,
    'Vault stores the password encrypted'
);

create temporary table first_secret on commit drop as
select portal_password_secret_id as id
from public.vendor_accounts
where account_id = '00000000-0000-4000-8000-0000000000c1';

select lives_ok(
    $$ select public.set_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1', 'second-pass') $$,
    'replacing a password works'
);

select is(
    (select portal_password_secret_id from public.vendor_accounts
     where account_id = '00000000-0000-4000-8000-0000000000c1'),
    (select id from first_secret),
    'replacing keeps the same Vault secret'
);

select results_eq(
    $$ select * from public.get_vendor_account_portal_login(
        '00000000-0000-4000-8000-0000000000c1') $$,
    $$ values ('https://portal.example'::text, 'ap@example.com'::text, 'second-pass'::text) $$,
    'reading the login gives the new password'
);

select lives_ok(
    $$ select public.clear_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1') $$,
    'clearing a password works'
);

select is(
    (select portal_password_secret_id from public.vendor_accounts
     where account_id = '00000000-0000-4000-8000-0000000000c1'),
    null,
    'clearing nulls the secret id'
);

select is(
    (select count(*)::int from vault.secrets where id = (select id from first_secret)),
    0,
    'clearing deletes the Vault secret'
);

select lives_ok(
    $$ select public.clear_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1') $$,
    'clearing twice is harmless'
);

-- 4. BAD INPUT

select throws_ok(
    $$ select public.set_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1', '') $$,
    '22023',
    null,
    'an empty password is refused'
);

select throws_ok(
    $$ select public.set_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000ff', 'pass') $$,
    'P0002',
    null,
    'setting a password on an unknown account fails'
);

select is_empty(
    $$ select * from public.get_vendor_account_portal_login(
        '00000000-0000-4000-8000-0000000000ff') $$,
    'reading an unknown account gives no row'
);

-- 5. DELETING THE ACCOUNT DELETES ITS SECRET

select public.set_vendor_account_portal_password(
    '00000000-0000-4000-8000-0000000000c1', 'third-pass'
);

create temporary table third_secret on commit drop as
select portal_password_secret_id as id
from public.vendor_accounts
where account_id = '00000000-0000-4000-8000-0000000000c1';

delete from public.vendor_accounts
where account_id = '00000000-0000-4000-8000-0000000000c1';

select is(
    (select count(*)::int from vault.secrets where id = (select id from third_secret)),
    0,
    'deleting an account deletes its Vault secret'
);

-- 6. ONLY THE SERVICE ROLE MAY CALL THE FUNCTIONS

set local role authenticated;

select throws_ok(
    $$ select public.get_vendor_account_portal_login(
        '00000000-0000-4000-8000-0000000000c1') $$,
    '42501',
    null,
    'a signed-in user cannot read a portal login'
);

select throws_ok(
    $$ select public.set_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1', 'pass') $$,
    '42501',
    null,
    'a signed-in user cannot set a portal password'
);

reset role;
set local role anon;

select throws_ok(
    $$ select public.clear_vendor_account_portal_password(
        '00000000-0000-4000-8000-0000000000c1') $$,
    '42501',
    null,
    'an anonymous user cannot clear a portal password'
);

reset role;
set local role service_role;

select lives_ok(
    $$ select public.get_vendor_account_portal_login(
        '00000000-0000-4000-8000-0000000000c1') $$,
    'the service role can read a portal login'
);

reset role;

select * from finish();

rollback;
