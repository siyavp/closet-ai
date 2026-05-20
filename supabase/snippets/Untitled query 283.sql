create table profiles (
  id uuid references auth.users(id) primary key,
  name text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);