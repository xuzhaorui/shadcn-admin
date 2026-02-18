package com.shadcn.admin.backend.infra.mybatis;

import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class BlockingMyBatisExecutor {

    public <T> Mono<T> call(Supplier<T> action) {
        return Mono.fromCallable(action::get).subscribeOn(Schedulers.boundedElastic());
    }
}
