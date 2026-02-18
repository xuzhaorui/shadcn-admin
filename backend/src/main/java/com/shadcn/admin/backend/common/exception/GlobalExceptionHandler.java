package com.shadcn.admin.backend.common.exception;

import com.shadcn.admin.backend.common.api.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import reactor.core.publisher.Mono;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Mono<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        return Mono.just(ApiResponse.fail(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler({WebExchangeBindException.class, ConstraintViolationException.class})
    public Mono<ApiResponse<Void>> handleValidation(Exception ex) {
        return Mono.just(ApiResponse.fail(400, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ApiResponse<Void>> handleOther(Exception ex) {
        return Mono.just(ApiResponse.fail(500, ex.getMessage()));
    }
}
