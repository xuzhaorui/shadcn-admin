package com.shadcn.admin.backend.modules.monitor.jobs.mapper;

import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobDO;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobListQuery;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface JobMapper {
    List<JobDO> selectPage(JobListQuery query);

    long count(JobListQuery query);

    List<JobDO> selectAll();

    JobDO selectById(@Param("id") String id);

    int insert(JobDO row);

    int update(JobDO row);

    int deleteById(@Param("id") String id);

    int updateStatus(@Param("id") String id, @Param("status") String status);

    int updateExecutionTime(
            @Param("id") String id,
            @Param("lastExecuteTime") LocalDateTime lastExecuteTime,
            @Param("nextExecuteTime") LocalDateTime nextExecuteTime);

    int updateNextExecuteTime(@Param("id") String id, @Param("nextExecuteTime") LocalDateTime nextExecuteTime);
}
