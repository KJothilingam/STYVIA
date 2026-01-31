package com.stylediscovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class FashionEcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(FashionEcommerceApplication.class, args);
    }
}

