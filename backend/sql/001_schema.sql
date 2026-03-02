-- 001_schema.sql
-- Initial schema for shadcn-admin backend skeleton.
-- Architecture baseline: Spring WebFlux + MyBatis + MySQL, no Redis.

create table if not exists sys_department (
  id bigint primary key auto_increment,
  parent_id bigint null,
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
  id bigint primary key auto_increment,
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
  id bigint primary key auto_increment,
  parent_id bigint null,
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
  id bigint primary key auto_increment,
  username varchar(64) not null,
  real_name varchar(64) not null,
  email varchar(128) not null,
  phone varchar(32) null,
  department_id bigint null,
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
  user_id bigint not null,
  role_id bigint not null,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  primary key (user_id, role_id),
  key idx_sys_user_role_role (role_id)
);

create table if not exists sys_role_menu (
  role_id bigint not null,
  menu_id bigint not null,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  primary key (role_id, menu_id),
  key idx_sys_role_menu_menu (menu_id)
);

create table if not exists sys_role_dept (
  role_id bigint not null,
  dept_id bigint not null,
  created_by varchar(64) not null default 'system',
  created_at datetime not null default current_timestamp,
  primary key (role_id, dept_id),
  key idx_sys_role_dept_dept (dept_id)
);
create table if not exists sys_operation_log (
  id bigint primary key auto_increment,
  username varchar(64) not null,
  action varchar(255) not null,
  ip varchar(64) null,
  status varchar(16) not null,
  created_at datetime not null default current_timestamp,
  key idx_sys_operation_log_username (username),
  key idx_sys_operation_log_created_at (created_at)
);

create table if not exists sys_login_log (
  id bigint primary key auto_increment,
  username varchar(64) not null,
  ip varchar(64) null,
  status varchar(16) not null,
  created_at datetime not null default current_timestamp,
  key idx_sys_login_log_username (username),
  key idx_sys_login_log_created_at (created_at)
);

create table if not exists sys_job (
  id bigint primary key auto_increment,
  name varchar(128) not null,
  job_group varchar(64) not null default 'DEFAULT',
  invoke_target varchar(255) not null,
  cron_expression varchar(128) not null,
  misfire_policy varchar(32) not null default 'default',
  concurrent_flag tinyint(1) not null default 1,
  status varchar(16) not null default 'running',
  remark varchar(255) null,
  created_at datetime not null default current_timestamp,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  last_execute_time datetime null,
  next_execute_time datetime null,
  key idx_sys_job_status (status)
);

create table if not exists wms_warehouse (
  id bigint primary key auto_increment,
  name varchar(64) not null,
  description varchar(255) null,
  status varchar(16) not null default 'enabled',
  created_at datetime not null default current_timestamp,
  updated_at datetime not null default current_timestamp on update current_timestamp,
  unique key uk_wms_warehouse_name (name),
  key idx_wms_warehouse_status (status)
);

