create extension if not exists pgcrypto;

create table if not exists roles (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id bigserial primary key,
  email text not null unique,
  display_name text not null,
  auth_provider text not null default 'google',
  auth_subject text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id bigint not null references users(id) on delete cascade,
  role_id bigint not null references roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists warehouses (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists suppliers (
  id bigserial primary key,
  name text not null unique,
  contact_name text,
  email text,
  phone text,
  lead_time_days integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists locations (
  id bigserial primary key,
  warehouse_id bigint not null references warehouses(id) on delete cascade,
  parent_location_id bigint references locations(id) on delete set null,
  location_type text not null,
  code text not null,
  name text,
  barcode_value text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (warehouse_id, code)
);

create table if not exists consumables (
  id bigserial primary key,
  sku text not null unique,
  name text not null unique,
  normalized_name text not null unique,
  unit_type text not null,
  unit_quantity numeric(14,3) not null default 0,
  unit_price numeric(14,2) not null default 0,
  qty_per_pack numeric(14,3) not null default 0,
  production_time_days integer,
  transit_time_text text,
  min_order_qty numeric(14,3) not null default 0,
  quantity_on_order numeric(14,3) not null default 0,
  estimated_delivery_date date,
  supplier_id bigint references suppliers(id) on delete set null,
  contact_for_reorder text,
  notes text,
  tags text[] not null default '{}',
  stock_status text not null default 'ok',
  ordered boolean not null default false,
  default_reorder_point numeric(14,3) not null default 0,
  default_reorder_qty numeric(14,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists barcode_records (
  id bigserial primary key,
  barcode_value text not null unique,
  barcode_format text not null default 'code128',
  entity_type text not null,
  entity_id bigint not null,
  is_primary boolean not null default true,
  generated_at timestamptz not null default now(),
  printed_at timestamptz
);

create table if not exists stock_balances (
  consumable_id bigint not null references consumables(id) on delete cascade,
  location_id bigint not null references locations(id) on delete cascade,
  qty_on_hand numeric(14,3) not null default 0,
  qty_reserved numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(),
  last_movement_id bigint,
  primary key (consumable_id, location_id)
);

create table if not exists stock_movements (
  id bigserial primary key,
  movement_type text not null,
  reference_no text,
  source text not null default 'manual',
  notes text,
  performed_by_user_id bigint references users(id) on delete set null,
  occurred_at timestamptz not null default now(),
  transfer_group_id uuid,
  import_batch_id bigint,
  created_at timestamptz not null default now()
);

create table if not exists stock_movement_lines (
  id bigserial primary key,
  movement_id bigint not null references stock_movements(id) on delete cascade,
  consumable_id bigint not null references consumables(id) on delete cascade,
  location_id bigint not null references locations(id) on delete cascade,
  qty_delta numeric(14,3) not null,
  qty_before numeric(14,3),
  qty_after numeric(14,3),
  counted_qty numeric(14,3),
  unit_cost numeric(14,2)
);

create table if not exists reorder_rules (
  id bigserial primary key,
  consumable_id bigint not null references consumables(id) on delete cascade,
  location_id bigint references locations(id) on delete cascade,
  min_qty numeric(14,3) not null,
  target_qty numeric(14,3) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (consumable_id, location_id)
);

create table if not exists reorder_alerts (
  id bigserial primary key,
  consumable_id bigint not null references consumables(id) on delete cascade,
  location_id bigint references locations(id) on delete cascade,
  current_qty numeric(14,3) not null,
  threshold_qty numeric(14,3) not null,
  suggested_order_qty numeric(14,3) not null,
  status text not null default 'open',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id bigint references users(id) on delete set null
);

create table if not exists import_batches (
  id bigserial primary key,
  import_type text not null,
  filename text not null,
  status text not null default 'uploaded',
  uploaded_by_user_id bigint references users(id) on delete set null,
  row_count integer not null default 0,
  error_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists import_rows (
  id bigserial primary key,
  import_batch_id bigint not null references import_batches(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  status text not null default 'pending',
  error_message text,
  entity_type text,
  entity_id bigint,
  created_at timestamptz not null default now()
);

create table if not exists weekly_stock_checks (
  id bigserial primary key,
  consumable_id bigint not null references consumables(id) on delete cascade,
  location_id bigint references locations(id) on delete set null,
  check_date date not null,
  counted_qty numeric(14,3) not null,
  entered_by_user_id bigint references users(id) on delete set null,
  import_batch_id bigint references import_batches(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (consumable_id, location_id, check_date)
);

create table if not exists audit_events (
  id bigserial primary key,
  entity_type text not null,
  entity_id bigint not null,
  action text not null,
  changed_by_user_id bigint references users(id) on delete set null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_locations_parent on locations(parent_location_id);
create index if not exists idx_stock_balances_location on stock_balances(location_id, qty_on_hand);
create index if not exists idx_stock_movements_occurred_at on stock_movements(occurred_at desc);
create index if not exists idx_stock_movement_lines_lookup on stock_movement_lines(consumable_id, location_id);
create index if not exists idx_weekly_stock_checks_date on weekly_stock_checks(check_date desc, consumable_id);
create index if not exists idx_reorder_alerts_status on reorder_alerts(status, detected_at desc);
create index if not exists idx_import_rows_batch on import_rows(import_batch_id, row_number);
create index if not exists idx_audit_events_entity on audit_events(entity_type, entity_id, created_at desc);

insert into roles (name)
values ('admin'), ('warehouse_manager'), ('operator'), ('viewer')
on conflict (name) do nothing;

insert into warehouses (code, name)
values ('UNIT1', 'Unit 1'), ('UNIT3', 'Unit 3'), ('UNIT4', 'Unit 4')
on conflict (code) do nothing;
