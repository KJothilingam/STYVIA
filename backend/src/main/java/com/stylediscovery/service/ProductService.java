package com.stylediscovery.service;

import com.stylediscovery.dto.CategoryDTO;
import com.stylediscovery.dto.ColorDTO;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.entity.Product;
import com.stylediscovery.entity.ProductImage;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.enums.ProductStatus;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.InventoryRepository;
import com.stylediscovery.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        logger.info("Fetching all active products, page: {}", pageable.getPageNumber());
        return productRepository.findByStatus(ProductStatus.ACTIVE, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        logger.info("Fetching product by id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDTO(product);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductBySlug(String slug) {
        logger.info("Fetching product by slug: {}", slug);
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return convertToDTO(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByGender(Gender gender, Pageable pageable) {
        logger.info("Fetching products by gender: {}", gender);
        return productRepository.findByGenderAndStatus(gender, ProductStatus.ACTIVE, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByBrand(String brand, Pageable pageable) {
        logger.info("Fetching products by brand: {}", brand);
        return productRepository.findByBrandAndStatus(brand, ProductStatus.ACTIVE, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
        logger.info("Searching products with keyword: {}", keyword);
        return productRepository.searchProducts(keyword, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> filterProducts(Gender gender, String brand, 
                                          BigDecimal minPrice, BigDecimal maxPrice, 
                                          Pageable pageable) {
        logger.info("Filtering products - gender: {}, brand: {}, price range: {}-{}", 
                   gender, brand, minPrice, maxPrice);
        return productRepository.findByFilters(ProductStatus.ACTIVE, gender, brand, minPrice, maxPrice, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<String> getAllBrands() {
        logger.info("Fetching all active brands");
        return productRepository.findAllActiveBrands();
    }

    private ProductDTO convertToDTO(Product product) {
        // Get available sizes and colors from inventory
        List<String> sizes = inventoryRepository.findAvailableSizesByProductId(product.getId());
        List<String> colors = inventoryRepository.findAvailableColorsByProductId(product.getId());

        // Get distinct colors with hex values
        List<ColorDTO> colorDTOs = inventoryRepository.findAvailableByProductId(product.getId())
                .stream()
                .map(inv -> ColorDTO.builder()
                        .name(inv.getColor())
                        .hex(inv.getColorHex())
                        .build())
                .distinct()
                .collect(Collectors.toList());

        // Get image URLs
        List<String> imageUrls = product.getImages().stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());

        // Get categories
        List<CategoryDTO> categoryDTOs = product.getCategories().stream()
                .map(cat -> CategoryDTO.builder()
                        .id(cat.getId())
                        .name(cat.getName())
                        .slug(cat.getSlug())
                        .gender(cat.getGender())
                        .build())
                .collect(Collectors.toList());

        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .brand(product.getBrand())
                .gender(product.getGender())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .discountPercentage(product.getDiscountPercentage())
                .material(product.getMaterial())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .images(imageUrls)
                .sizes(sizes)
                .colors(colorDTOs)
                .categories(categoryDTOs)
                .build();
    }
}

