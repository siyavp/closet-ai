-- Clothing items table
create table clothing_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  image_url text not null,
  name text,
  category text,
  color text,
  tags text[],
  ai_description text,
  created_at timestamp with time zone default now()
);

-- Outfits table
create table outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  item_ids uuid[],
  occasion text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Enable row level security
alter table clothing_items enable row level security;
alter table outfits enable row level security;

-- Policies so users only see their own data
create policy "Users can manage their own clothing"
  on clothing_items for all
  using (auth.uid() = user_id);

create policy "Users can manage their own outfits"
  on outfits for all
  using (auth.uid() = user_id);