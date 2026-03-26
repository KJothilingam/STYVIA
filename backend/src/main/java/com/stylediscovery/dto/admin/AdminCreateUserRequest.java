package com.stylediscovery.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AdminCreateUserRequest {

    @NotBlank
    @Size(min = 2, max = 255)
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 72)
    private String password;

    @Size(max = 32)
    private String phone;

    /** Role names, e.g. ROLE_CUSTOMER, ROLE_ADMIN. Defaults to ROLE_CUSTOMER when null or empty. */
    private List<String> roles;
}
