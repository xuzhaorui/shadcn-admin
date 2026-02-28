package com.shadcn.admin.backend.modules.system.shared.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.shadcn.admin.backend.modules.system.departments.domain.DepartmentDO;
import com.shadcn.admin.backend.modules.system.departments.mapper.DepartmentMapper;
import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.dto.UserListQuery;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DataScopeResolverTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private DepartmentMapper departmentMapper;

    @InjectMocks
    private DataScopeResolver resolver;

    @Test
    void shouldBypassRestrictionWhenDataScopeIsAll() {
        when(userMapper.selectRoleDataScopesByUserId("u1")).thenReturn(List.of("all"));

        UserListQuery query = new UserListQuery();
        resolver.apply(query, "u1");

        assertFalse(Boolean.TRUE.equals(query.getDataScopeRestricted()));
        assertFalse(Boolean.TRUE.equals(query.getDataScopeAllowSelf()));
        assertEquals("u1", query.getDataScopeUserId());
        assertTrue(query.getDataScopeDeptIds() == null || query.getDataScopeDeptIds().isEmpty());
    }

    @Test
    void shouldRestrictToSelfWhenDataScopeIsSelf() {
        when(userMapper.selectRoleDataScopesByUserId("u1")).thenReturn(List.of("self"));

        UserListQuery query = new UserListQuery();
        resolver.apply(query, "u1");

        assertTrue(Boolean.TRUE.equals(query.getDataScopeRestricted()));
        assertTrue(Boolean.TRUE.equals(query.getDataScopeAllowSelf()));
        assertEquals("u1", query.getDataScopeUserId());
        assertTrue(query.getDataScopeDeptIds().isEmpty());
    }

    @Test
    void shouldRestrictToCurrentDepartmentWhenDataScopeIsDept() {
        when(userMapper.selectRoleDataScopesByUserId("u1")).thenReturn(List.of("dept"));
        mockCurrentUserDept("u1", "d1");

        UserListQuery query = new UserListQuery();
        resolver.apply(query, "u1");

        assertTrue(Boolean.TRUE.equals(query.getDataScopeRestricted()));
        assertFalse(Boolean.TRUE.equals(query.getDataScopeAllowSelf()));
        assertIterableEquals(List.of("d1"), query.getDataScopeDeptIds());
    }

    @Test
    void shouldRestrictToDepartmentAndChildrenWhenDataScopeIsDeptDown() {
        when(userMapper.selectRoleDataScopesByUserId("u1")).thenReturn(List.of("dept_down"));
        mockCurrentUserDept("u1", "d1");

        DepartmentDO d1 = new DepartmentDO();
        d1.setId("d1");
        d1.setParentId(null);
        DepartmentDO d11 = new DepartmentDO();
        d11.setId("d11");
        d11.setParentId("d1");
        DepartmentDO d12 = new DepartmentDO();
        d12.setId("d12");
        d12.setParentId("d1");
        DepartmentDO d121 = new DepartmentDO();
        d121.setId("d121");
        d121.setParentId("d12");
        when(departmentMapper.selectAll()).thenReturn(List.of(d1, d11, d12, d121));

        UserListQuery query = new UserListQuery();
        resolver.apply(query, "u1");

        assertTrue(Boolean.TRUE.equals(query.getDataScopeRestricted()));
        assertFalse(Boolean.TRUE.equals(query.getDataScopeAllowSelf()));
        assertIterableEquals(List.of("d1", "d11", "d12", "d121"), query.getDataScopeDeptIds());
    }

    @Test
    void shouldRestrictToCustomDepartmentsWhenDataScopeIsCustom() {
        when(userMapper.selectRoleDataScopesByUserId("u1")).thenReturn(List.of("custom"));
        when(userMapper.selectCustomDeptIdsByUserId("u1")).thenReturn(List.of("d2", "d3"));
        mockCurrentUserDept("u1", "d1");

        UserListQuery query = new UserListQuery();
        resolver.apply(query, "u1");

        assertTrue(Boolean.TRUE.equals(query.getDataScopeRestricted()));
        assertFalse(Boolean.TRUE.equals(query.getDataScopeAllowSelf()));
        assertIterableEquals(List.of("d2", "d3"), query.getDataScopeDeptIds());
    }

    @Test
    void shouldMergeScopesAsUnionAcrossRoles() {
        when(userMapper.selectRoleDataScopesByUserId("u1")).thenReturn(List.of("self", "custom", "dept"));
        when(userMapper.selectCustomDeptIdsByUserId("u1")).thenReturn(List.of("d2"));
        mockCurrentUserDept("u1", "d1");

        UserListQuery query = new UserListQuery();
        resolver.apply(query, "u1");

        assertTrue(Boolean.TRUE.equals(query.getDataScopeRestricted()));
        assertTrue(Boolean.TRUE.equals(query.getDataScopeAllowSelf()));
        assertEquals("u1", query.getDataScopeUserId());
        assertIterableEquals(List.of("d1", "d2"), query.getDataScopeDeptIds());
    }

    private void mockCurrentUserDept(String userId, String deptId) {
        UserDO current = new UserDO();
        current.setId(userId);
        current.setDepartmentId(deptId);
        when(userMapper.selectById(userId)).thenReturn(current);
    }
}
