package com.stylediscovery.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/test")
@RequiredArgsConstructor
public class TestController {

    private final PasswordEncoder passwordEncoder;

    // TEMPORARY - Remove after fixing admin password
    @GetMapping("/encode/{password}")
    public String encodePassword(@PathVariable String password) {
        return passwordEncoder.encode(password);
    }
    
    @GetMapping("/match/{password}/{hash}")
    public boolean matchPassword(@PathVariable String password, @PathVariable String hash) {
        return passwordEncoder.matches(password, hash);
    }
}

