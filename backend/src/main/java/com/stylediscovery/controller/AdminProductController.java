package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.dto.admin.AdminCreateProductRequest;
import com.stylediscovery.dto.admin.AdminProductSizeDTO;
import com.stylediscovery.enums.ProductStatus;
import com.stylediscovery.service.AdminProductService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> list(
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductDTO> result = adminProductService.list(status, q, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDTO>> create(@Valid @RequestBody AdminCreateProductRequest body) {
        ProductDTO dto = adminProductService.create(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Created", dto));
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductDTO>> update(
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(adminProductService.update(productId, body)));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long productId) {
        adminProductService.delete(productId);
        return ResponseEntity.ok(ApiResponse.success("Disabled", null));
    }

    @GetMapping("/{productId}/sizes")
    public ResponseEntity<ApiResponse<List<AdminProductSizeDTO>>> sizes(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(adminProductService.listSizes(productId)));
    }

    @PutMapping("/{productId}/sizes")
    public ResponseEntity<ApiResponse<Void>> saveSizes(
            @PathVariable Long productId,
            @RequestBody List<AdminProductSizeDTO> rows) {
        adminProductService.replaceSizes(productId, rows);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }
}
