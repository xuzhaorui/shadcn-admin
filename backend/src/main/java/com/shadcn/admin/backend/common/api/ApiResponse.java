package com.shadcn.admin.backend.common.api;

public record ApiResponse<T>(int code, String message, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "ok", data);
    }

    public static ApiResponse<Void> success() {
        return new ApiResponse<>(200, "ok", null);
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
