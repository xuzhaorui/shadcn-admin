package com.shadcn.admin.backend.modules.system.dictionaries.dto;

public record DictItemDTO(String id, String typeId, String label, String value, Integer sort, String status) {}
