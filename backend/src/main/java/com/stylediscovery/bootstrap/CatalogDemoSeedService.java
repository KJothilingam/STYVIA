package com.stylediscovery.bootstrap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylediscovery.entity.Inventory;
import com.stylediscovery.entity.Product;
import com.stylediscovery.entity.ProductImage;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.enums.ProductStatus;
import com.stylediscovery.repository.InventoryRepository;
import com.stylediscovery.repository.ProductImageRepository;
import com.stylediscovery.repository.ProductRepository;
import com.stylediscovery.service.CatalogCacheEvictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CatalogDemoSeedService {

    private static final String SLUG_PREFIX = "seed-";
    private static final int MAX_SIZE_LEN = 10;

    private final ObjectMapper objectMapper;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;
    private final CatalogCacheEvictionService catalogCacheEvictionService;

    @Transactional
    public int seedFromClasspath() throws Exception {
        ClassPathResource res = new ClassPathResource("seed/catalog-demo-products.json");
        if (!res.exists()) {
            return 0;
        }
        List<CatalogDemoRow> rows;
        try (InputStream is = res.getInputStream()) {
            rows = objectMapper.readValue(is, new TypeReference<>() {});
        }
        int added = 0;
        for (CatalogDemoRow row : rows) {
            if (row.id == null || row.id.isBlank()) continue;
            String slug = SLUG_PREFIX + row.id.trim().toLowerCase(Locale.ROOT);
            if (productRepository.findBySlug(slug).isPresent()) {
                continue;
            }
            Gender gender = genderOf(row.cat);
            BigDecimal price = row.price != null ? row.price : BigDecimal.ZERO;
            BigDecimal original = row.orig != null ? row.orig : price;
            int disc = row.disc != null ? row.disc : 0;

            Product p = Product.builder()
                    .name(row.name)
                    .slug(slug)
                    .description(row.desc)
                    .brand(row.brand)
                    .gender(gender)
                    .price(price)
                    .originalPrice(original)
                    .discountPercentage(disc)
                    .material(row.mat)
                    .status(ProductStatus.ACTIVE)
                    .build();
            p = productRepository.save(p);

            if (row.img != null && !row.img.isBlank()) {
                ProductImage img = ProductImage.builder()
                        .product(p)
                        .imageUrl(row.img.trim())
                        .isPrimary(true)
                        .displayOrder(0)
                        .build();
                productImageRepository.save(img);
            }

            String size = firstSize(row);
            String colorName = "Default";
            String colorHex = null;
            if (row.colors != null && !row.colors.isEmpty()) {
                ColorOpt c0 = row.colors.getFirst();
                if (c0 != null && c0.n != null && !c0.n.isBlank()) {
                    colorName = c0.n.trim();
                }
                if (c0 != null && c0.h != null && !c0.h.isBlank()) {
                    colorHex = c0.h.trim();
                }
            }
            size = truncate(size, MAX_SIZE_LEN);
            colorName = truncate(colorName, 100);

            Inventory inv = Inventory.builder()
                    .product(p)
                    .size(size)
                    .color(colorName)
                    .colorHex(colorHex)
                    .stockQuantity(25)
                    .build();
            inventoryRepository.save(inv);

            catalogCacheEvictionService.evictProductAndFit(p.getId());
            added++;
        }
        return added;
    }

    private static String firstSize(CatalogDemoRow row) {
        if (row.sizes != null && !row.sizes.isEmpty()) {
            String s = row.sizes.getFirst();
            if (s != null && !s.isBlank()) {
                return s.trim();
            }
        }
        return "M";
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static Gender genderOf(String cat) {
        if (cat == null) return Gender.UNISEX;
        return switch (cat.trim().toLowerCase(Locale.ROOT)) {
            case "men" -> Gender.MEN;
            case "women" -> Gender.WOMEN;
            case "kids" -> Gender.KIDS;
            case "accessories" -> Gender.UNISEX;
            default -> Gender.UNISEX;
        };
    }

    @SuppressWarnings("unused")
    private static class CatalogDemoRow {
        public String id;
        public String name;
        public String brand;
        public String cat;
        public BigDecimal price;
        public BigDecimal orig;
        public Integer disc;
        public String desc;
        public String mat;
        public String img;
        public List<String> sizes;
        public List<ColorOpt> colors;
    }

    @SuppressWarnings("unused")
    private static class ColorOpt {
        public String n;
        public String h;
    }
}
