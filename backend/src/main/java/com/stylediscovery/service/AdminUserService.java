package com.stylediscovery.service;

import com.stylediscovery.dto.admin.AdminCreateUserRequest;
import com.stylediscovery.dto.admin.AdminUpdateUserRequest;
import com.stylediscovery.dto.admin.AdminUserDTO;
import com.stylediscovery.entity.Role;
import com.stylediscovery.entity.User;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.OrderRepository;
import com.stylediscovery.repository.RoleRepository;
import com.stylediscovery.repository.UserRepository;
import com.stylediscovery.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final Set<String> ALLOWED_ROLE_NAMES = Set.of("ROLE_CUSTOMER", "ROLE_ADMIN");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<AdminUserDTO> list(String keyword, Boolean active, Pageable pageable) {
        String q = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return userRepository.findForAdmin(q, active, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public AdminUserDTO getById(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDto(u);
    }

    @Transactional
    public AdminUserDTO create(AdminCreateUserRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }
        Set<Role> roles = resolveRoles(req.getRoles());
        User user = User.builder()
                .name(req.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .isActive(true)
                .emailVerified(false)
                .roles(roles)
                .build();
        user = userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public AdminUserDTO update(Long userId, AdminUpdateUserRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(email);
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().isBlank() ? null : req.getPhone().trim());
        }
        if (req.getIsActive() != null) {
            user.setIsActive(req.getIsActive());
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }
        if (req.getRoles() != null && !req.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(req.getRoles()));
        }

        user = userRepository.save(user);
        return toDto(user);
    }

    @Transactional
    public void setActive(Long userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsActive(isActive);
        userRepository.save(user);
    }

    @Transactional
    public void delete(Long userId) {
        Long adminId = currentAdminIdOrNull();
        if (adminId != null && adminId.equals(userId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        long orders = orderRepository.countByUser_Id(userId);
        if (orders > 0) {
            throw new BadRequestException("Cannot delete user with existing orders. Deactivate the account instead.");
        }
        userRepository.delete(user);
    }

    private Long currentAdminIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        Object p = auth.getPrincipal();
        if (p instanceof UserPrincipal up) {
            return up.getId();
        }
        return null;
    }

    private Set<Role> resolveRoles(List<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            Role customer = roleRepository.findByName("ROLE_CUSTOMER")
                    .orElseThrow(() -> new BadRequestException("ROLE_CUSTOMER not configured"));
            return new HashSet<>(Set.of(customer));
        }
        Set<Role> out = new HashSet<>();
        for (String raw : roleNames) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String name = raw.trim();
            if (!ALLOWED_ROLE_NAMES.contains(name)) {
                throw new BadRequestException("Unsupported role: " + name);
            }
            Role r = roleRepository.findByName(name)
                    .orElseThrow(() -> new BadRequestException("Role not found: " + name));
            out.add(r);
        }
        if (out.isEmpty()) {
            Role customer = roleRepository.findByName("ROLE_CUSTOMER")
                    .orElseThrow(() -> new BadRequestException("ROLE_CUSTOMER not configured"));
            out.add(customer);
        }
        return out;
    }

    private AdminUserDTO toDto(User u) {
        return AdminUserDTO.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .isActive(u.getIsActive())
                .emailVerified(u.getEmailVerified())
                .createdAt(u.getCreatedAt())
                .roles(u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .build();
    }
}
