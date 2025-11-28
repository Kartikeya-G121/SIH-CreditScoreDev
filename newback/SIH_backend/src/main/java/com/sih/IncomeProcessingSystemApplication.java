package com.sih;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class IncomeProcessingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(IncomeProcessingSystemApplication.class, args);
    }
}
