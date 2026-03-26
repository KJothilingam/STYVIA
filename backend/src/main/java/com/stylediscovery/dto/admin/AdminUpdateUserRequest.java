package com.stylediscovery.dto.admin;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AdminUpdateUserRequest {

    @Size(min = 2, max = 255)
    private String name;

    /** Validated in service when non-blank. */
    @Size(max = 255)
    private String email;

    @Size(max = 32)
    private String phone;

    private Boolean isActive;

    /** When set, replaces the password hash (min 6 characters). */
    @Size(min = 6, max = 72)
    private String newPassword;

    /** When set, replaces all roles (must be ROLE_CUSTOMER and/or ROLE_ADMIN). */
    private List<String> roles;
}
