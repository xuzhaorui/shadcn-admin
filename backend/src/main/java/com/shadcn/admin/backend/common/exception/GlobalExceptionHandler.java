package com.shadcn.admin.backend.common.exception;

import com.shadcn.admin.backend.common.api.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import reactor.core.publisher.Mono;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleBusiness(BusinessException ex) {
        HttpStatus status = resolveHttpStatus(ex.getCode());
        return Mono.just(ResponseEntity.status(status).body(ApiResponse.fail(ex.getCode(), ex.getMessage())));
    }

    @ExceptionHandler({WebExchangeBindException.class, ConstraintViolationException.class})
    public Mono<ResponseEntity<ApiResponse<Void>>> handleValidation(Exception ex) {
        return Mono.just(ResponseEntity.badRequest().body(ApiResponse.fail(400, ex.getMessage())));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<ApiResponse<Void>>> handleOther(Exception ex) {
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.fail(500, ex.getMessage())));
    }

    private HttpStatus resolveHttpStatus(int code) {
        HttpStatus resolved = HttpStatus.resolve(code);
        return resolved == null ? HttpStatus.INTERNAL_SERVER_ERROR : resolved;
    }
}
