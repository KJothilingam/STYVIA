package com.stylediscovery.service;

import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.dto.admin.AdminCreateProductRequest;
import com.stylediscovery.dto.admin.AdminInventoryRowDTO;
import com.stylediscovery.dto.admin.AdminProductSizeDTO;
import com.stylediscovery.entity.*;
import com.stylediscovery.enums.GarmentFitStyle;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.enums.ProductStatus;
import com.stylediscovery.enums.StretchLevel;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;
    private final GarmentSizeSpecRepository garmentSizeSpecRepository;
    private final ProductService productService;
    private final CatalogCacheEvictionService catalogCacheEvictionService;

    @Transactional(readOnly = true)
    public Page<ProductDTO> list(ProductStatus status, String keyword, Pageable pageable) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return productRepository.findForAdmin(status, kw, pageable)
                .map(p -> productService.getProductById(p.getId()));
    }

    @Transactional
    public ProductDTO create(AdminCreateProductRequest req) {
        String base = req.getName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        String slug = base + "-" + (System.currentTimeMillis() % 1_000_000);
        Product p = Product.builder()
                .name(req.getName())
                .slug(slug)
                .description(req.getDescription())
                .brand(req.getBrand())
                .gender(req.getGender())
                .price(req.getPrice())
                .originalPrice(req.getOriginalPrice() != null ? req.getOriginalPrice() : req.getPrice())
                .discountPercentage(req.getDiscountPercentage() != null ? req.getDiscountPercentage() : 0)
                .material(req.getMaterial())
                .status(ProductStatus.ACTIVE)
                .build();
        if (req.getCategoryIds() != null && !req.getCategoryIds().isEmpty()) {
            Set<Category> cats = new HashSet<>(categoryRepository.findAllById(req.getCategoryIds()));
            p.setCategories(cats);
        }
        p = productRepository.save(p);
        int order = 0;
        if (req.getImageUrls() != null) {
            for (String url : req.getImageUrls()) {
                if (url == null || url.isBlank()) continue;
                ProductImage img = ProductImage.builder()
                        .product(p)
                        .imageUrl(url.trim())
                        .isPrimary(order == 0)
                        .displayOrder(order++)
                        .build();
                productImageRepository.save(img);
            }
        }
        if (req.getInventory() != null) {
            for (AdminInventoryRowDTO row : req.getInventory()) {
                Inventory inv = Inventory.builder()
                        .product(p)
                        .size(row.getSize())
                        .color(row.getColor())
                        .colorHex(row.getColorHex())
                        .stockQuantity(Math.max(0, row.getStockQuantity()))
                        .build();
                inventoryRepository.save(inv);
            }
        }
        return productService.getProductById(p.getId());
    }

    @Transactional
    public ProductDTO update(Long productId, java.util.Map<String, Object> patch) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (patch.containsKey("name")) p.setName(String.valueOf(patch.get("name")));
        if (patch.containsKey("brand")) p.setBrand(String.valueOf(patch.get("brand")));
        if (patch.containsKey("price")) p.setPrice(new BigDecimal(patch.get("price").toString()));
        if (patch.containsKey("originalPrice") && patch.get("originalPrice") != null) {
            p.setOriginalPrice(new BigDecimal(patch.get("originalPrice").toString()));
        }
        if (patch.containsKey("discountPercentage") && patch.get("discountPercentage") != null) {
            Object d = patch.get("discountPercentage");
            p.setDiscountPercentage(d instanceof Number ? ((Number) d).intValue() : Integer.parseInt(d.toString()));
        }
        if (patch.containsKey("description")) p.setDescription(patch.get("description") != null ? String.valueOf(patch.get("description")) : null);
        if (patch.containsKey("material")) p.setMaterial(patch.get("material") != null ? String.valueOf(patch.get("material")) : null);
        if (patch.containsKey("gender") && patch.get("gender") != null) {
            p.setGender(Gender.valueOf(String.valueOf(patch.get("gender"))));
        }
        if (patch.containsKey("stretchLevel") && patch.get("stretchLevel") != null) {
            p.setStretchLevel(StretchLevel.valueOf(String.valueOf(patch.get("stretchLevel"))));
        }
        if (patch.containsKey("garmentFitStyle") && patch.get("garmentFitStyle") != null) {
            p.setGarmentFitStyle(GarmentFitStyle.valueOf(String.valueOf(patch.get("garmentFitStyle"))));
        }
        if (patch.containsKey("status") && patch.get("status") != null) {
            p.setStatus(ProductStatus.valueOf(String.valueOf(patch.get("status"))));
        }
        productRepository.save(p);
        catalogCacheEvictionService.evictProductAndFit(productId);
        return productService.getProductById(productId);
    }

    @Transactional
    public void delete(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        p.setStatus(ProductStatus.DISABLED);
        productRepository.save(p);
        catalogCacheEvictionService.evictProductAndFit(productId);
    }

    @Transactional(readOnly = true)
    public List<AdminProductSizeDTO> listSizes(Long productId) {
        productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Map<String, Inventory> firstByKey = new LinkedHashMap<>();
        for (Inventory i : inventoryRepository.findByProductId(productId)) {
            String key = FitSizeOrdering.normalizeKey(i.getSize());
            firstByKey.putIfAbsent(key, i);
        }
        return firstByKey.values().stream()
                .map(inv -> {
                    String key = FitSizeOrdering.normalizeKey(inv.getSize());
                    Optional<GarmentSizeSpec> spec = garmentSizeSpecRepository.findByProduct_IdAndSizeKey(productId, key);
                    AdminProductSizeDTO.AdminProductSizeDTOBuilder b = AdminProductSizeDTO.builder()
                            .id(inv.getId())
                            .size(inv.getSize());
                    spec.ifPresent(s -> b
                            .chestMeasurementCm(s.getChestCm())
                            .shoulderMeasurementCm(s.getShoulderCm())
                            .waistMeasurementCm(s.getWaistCm())
                            .lengthCm(s.getLengthCm()));
                    return b.build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void replaceSizes(Long productId, List<AdminProductSizeDTO> rows) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        inventoryRepository.findByProductId(productId).forEach(inventoryRepository::delete);
        garmentSizeSpecRepository.deleteByProduct_Id(productId);
        if (rows == null) {
            catalogCacheEvictionService.evictProductAndFit(productId);
            return;
        }
        Map<String, AdminProductSizeDTO> deduped = new LinkedHashMap<>();
        for (AdminProductSizeDTO r : rows) {
            if (r.getSize() == null || r.getSize().isBlank()) continue;
            deduped.put(FitSizeOrdering.normalizeKey(r.getSize()), r);
        }
        int idx = 0;
        for (AdminProductSizeDTO r : deduped.values()) {
            String color = "Default-" + (idx++);
            Inventory inv = Inventory.builder()
                    .product(p)
                    .size(r.getSize())
                    .color(color)
                    .stockQuantity(10)
                    .build();
            inventoryRepository.save(inv);
            String key = FitSizeOrdering.normalizeKey(r.getSize());
            boolean anyMeasure = r.getChestMeasurementCm() != null || r.getShoulderMeasurementCm() != null
                    || r.getWaistMeasurementCm() != null || r.getLengthCm() != null;
            if (anyMeasure) {
                garmentSizeSpecRepository.save(GarmentSizeSpec.builder()
                        .product(p)
                        .sizeKey(key)
                        .chestCm(r.getChestMeasurementCm())
                        .shoulderCm(r.getShoulderMeasurementCm())
                        .waistCm(r.getWaistMeasurementCm())
                        .lengthCm(r.getLengthCm())
                        .build());
            }
        }
        catalogCacheEvictionService.evictProductAndFit(productId);
    }
}
