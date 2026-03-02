-- 002_wms_warehouse_menu.sql
-- Add WMS warehouse management menus and bind to admin role.

insert into sys_menu (parent_id, type, name, code, path, icon, sort, visible, status, version)
select null, 'directory', '仓储管理', 'wms', '/wms', 'Package', 40, 'show', 'enabled', 0
where not exists (select 1 from sys_menu where code = 'wms');

insert into sys_menu (parent_id, type, name, code, path, icon, sort, visible, status, version)
select p.id, 'menu', '仓库管理', 'wms:warehouses', '/wms/warehouses', 'Database', 10, 'show', 'enabled', 0
from sys_menu p
where p.code = 'wms'
  and not exists (select 1 from sys_menu where code = 'wms:warehouses');

insert into sys_menu (parent_id, type, name, code, path, icon, sort, visible, status, version)
select p.id, 'button', '新增仓库', 'wms:warehouses:create', null, null, 1, 'hide', 'enabled', 0
from sys_menu p
where p.code = 'wms:warehouses'
  and not exists (select 1 from sys_menu where code = 'wms:warehouses:create');

insert into sys_menu (parent_id, type, name, code, path, icon, sort, visible, status, version)
select p.id, 'button', '编辑仓库', 'wms:warehouses:edit', null, null, 2, 'hide', 'enabled', 0
from sys_menu p
where p.code = 'wms:warehouses'
  and not exists (select 1 from sys_menu where code = 'wms:warehouses:edit');

insert into sys_role_menu (role_id, menu_id, created_by)
select r.id, m.id, 'system'
from sys_role r
join sys_menu m on m.code in ('wms', 'wms:warehouses', 'wms:warehouses:create', 'wms:warehouses:edit')
where r.code = 'admin'
  and not exists (
    select 1 from sys_role_menu rm where rm.role_id = r.id and rm.menu_id = m.id
  );
