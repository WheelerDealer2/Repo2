-- Switching to Australian dollars for listing fees.
alter table listing_payments alter column currency set default 'aud';
