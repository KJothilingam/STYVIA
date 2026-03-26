package com.stylediscovery.controller;

import com.stylediscovery.dto.ApiResponse;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.dto.fit.FitConfidenceResponseDTO;
import com.stylediscovery.dto.fit.FitFeedbackRequestDTO;
import com.stylediscovery.dto.fit.OutfitRecommendationDTO;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.security.UserPrincipal;
import com.stylediscovery.service.FitLearningWriteService;
import com.stylediscovery.service.FitRecommendationService;
import com.stylediscovery.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;
    private final FitRecommendationService fitRecommendationService;
    private final FitLearningWriteService fitLearningWriteService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProductDTO> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProductById(@PathVariable @Positive Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProductBySlug(@PathVariable String slug) {
        ProductDTO product = productService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/gender/{gender}")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getProductsByGender(
            @PathVariable Gender gender,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductDTO> products = productService.getProductsByGender(gender, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/brand/{brand}")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> getProductsByBrand(
            @PathVariable String brand,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductDTO> products = productService.getProductsByBrand(brand, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ProductDTO> products = productService.searchProducts(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<Page<ProductDTO>>> filterProducts(
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<ProductDTO> products = productService.filterProducts(gender, brand, minPrice, maxPrice, pageable);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<String>>> getAllBrands() {
        List<String> brands = productService.getAllBrands();
        return ResponseEntity.ok(ApiResponse.success(brands));
    }

    @GetMapping("/{productId}/fit-confidence")
    public ResponseEntity<ApiResponse<FitConfidenceResponseDTO>> fitConfidence(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable @Positive Long productId) {
        FitConfidenceResponseDTO dto = fitRecommendationService.fitConfidence(user.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/{productId}/fit-feedback")
    public ResponseEntity<ApiResponse<String>> submitFitFeedback(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable @Positive Long productId,
            @Valid @RequestBody FitFeedbackRequestDTO body) {
        fitLearningWriteService.submitFitFeedbackFromRequest(user.getId(), productId, body.getSize(), body.getFeedback());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Fit feedback recorded", "OK"));
    }

    @GetMapping("/{productId}/outfit")
    public ResponseEntity<ApiResponse<OutfitRecommendationDTO>> outfit(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable @Positive Long productId) {
        OutfitRecommendationDTO dto = fitRecommendationService.outfit(productId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}

