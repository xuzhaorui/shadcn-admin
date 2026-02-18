-- 001_schema.sql
-- Initial schema for shadcn-admin backend skeleton.
-- Architecture baseline: Spring WebFlux + MyBatis + MySQL, no Redis.

create table if not exists sys_department (
  id varchar(64) primary key,
  parent_id varchar(64) null,
  name varchar(64) not null,
  code varchar(64) not null,
  sort int not null default 0,
  status varchar(16) not null default 'enabled',
  version bigint not null default 0,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  updated_by varchar(64) not null default 'system',
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_sys_department_code (code),
  key idx_sys_department_parent (parent_id)
);

create table if not exists sys_role (
  id varchar(64) primary key,
  code varchar(64) not null,
  name varchar(64) not null,
  status varchar(16) not null default 'enabled',
  data_scope varchar(32) not null default 'self',
  version bigint not null default 0,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  updated_by varchar(64) not null default 'system',
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_sys_role_code (code)
);

create table if not exists sys_menu (
  id varchar(64) primary key,
  parent_id varchar(64) null,
  type varchar(16) not null,
  name varchar(64) not null,
  code varchar(64) not null,
  path varchar(255) null,
  icon varchar(64) null,
  sort int not null default 0,
  visible varchar(16) not null default 'show',
  status varchar(16) not null default 'enabled',
  version bigint not null default 0,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  updated_by varchar(64) not null default 'system',
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_sys_menu_code (code),
  key idx_sys_menu_parent (parent_id)
);

create table if not exists sys_user (
  id varchar(64) primary key,
  username varchar(64) not null,
  real_name varchar(64) not null,
  email varchar(128) not null,
  phone varchar(32) null,
  department_id varchar(64) null,
  status varchar(16) not null default 'enabled',
  password_hash varchar(255) not null,
  version bigint not null default 0,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  updated_by varchar(64) not null default 'system',
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_sys_user_username (username),
  key idx_sys_user_department (department_id)
);

create table if not exists sys_user_role (
  user_id varchar(64) not null,
  role_id varchar(64) not null,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  primary key (user_id, role_id),
  key idx_sys_user_role_role (role_id)
);

create table if not exists sys_role_menu (
  role_id varchar(64) not null,
  menu_id varchar(64) not null,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  primary key (role_id, menu_id),
  key idx_sys_role_menu_menu (menu_id)
);

create table if not exists sys_role_dept (
  role_id varchar(64) not null,
  dept_id varchar(64) not null,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  primary key (role_id, dept_id),
  key idx_sys_role_dept_dept (dept_id)
);

create table if not exists sys_dict_type (
  id varchar(64) primary key,
  code varchar(64) not null,
  name varchar(64) not null,
  status varchar(16) not null default 'enabled',
  version bigint not null default 0,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  updated_by varchar(64) not null default 'system',
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_sys_dict_type_code (code)
);

create table if not exists sys_dict_item (
  id varchar(64) primary key,
  type_id varchar(64) not null,
  label varchar(64) not null,
  value varchar(64) not null,
  sort int not null default 0,
  status varchar(16) not null default 'enabled',
  version bigint not null default 0,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  updated_by varchar(64) not null default 'system',
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_sys_dict_item_type_value (type_id, value),
  key idx_sys_dict_item_type (type_id)
);

create table if not exists sys_operation_log (
  id varchar(64) primary key,
  username varchar(64) not null,
  action varchar(255) not null,
  ip varchar(64) null,
  status varchar(16) not null,
  created_at datetime not null default current_timestamp,
  key idx_sys_operation_log_username (username),
  key idx_sys_operation_log_created_at (created_at)
);

create table if not exists sys_login_log (
  id varchar(64) primary key,
  username varchar(64) not null,
  ip varchar(64) null,
  status varchar(16) not null,
  created_at datetime not null default current_timestamp,
  key idx_sys_login_log_username (username),
  key idx_sys_login_log_created_at (created_at)
);
