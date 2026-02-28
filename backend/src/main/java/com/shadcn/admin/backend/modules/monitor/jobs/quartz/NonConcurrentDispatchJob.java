package com.shadcn.admin.backend.modules.monitor.jobs.quartz;

import org.quartz.DisallowConcurrentExecution;

@DisallowConcurrentExecution
public class NonConcurrentDispatchJob extends ConcurrentDispatchJob {}
