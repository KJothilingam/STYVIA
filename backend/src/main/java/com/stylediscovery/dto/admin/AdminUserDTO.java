package com.stylediscovery.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Boolean isActive;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private Set<String> roles;
}
