package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.admin.AdminCreateUserRequest;
import com.stylediscovery.dto.admin.AdminUpdateUserRequest;
import com.stylediscovery.dto.admin.AdminUserDTO;
import com.stylediscovery.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserDTO>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<AdminUserDTO> result = adminUserService.list(q, active, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<AdminUserDTO>> getOne(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getById(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminUserDTO>> create(@Valid @RequestBody AdminCreateUserRequest body) {
        AdminUserDTO dto = adminUserService.create(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User created", dto));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<AdminUserDTO>> update(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUpdateUserRequest body) {
        return ResponseEntity.ok(ApiResponse.success("User updated", adminUserService.update(userId, body)));
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Long userId,
            @RequestParam Boolean isActive) {
        adminUserService.setActive(userId, isActive);
        String message = isActive ? "User activated" : "User deactivated";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long userId) {
        adminUserService.delete(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}
