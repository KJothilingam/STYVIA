package com.stylediscovery.service;

import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.entity.Product;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.enums.ProductStatus;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.mapper.ProductDtoMapper;
import com.stylediscovery.config.CacheConfig;
import com.stylediscovery.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final ProductDtoMapper productDtoMapper;

    @Transactional(readOnly = true)
    public Page<ProductDTO> getAllProducts(Pageable pageable) {
        logger.debug("Fetching all active products, page: {}", pageable.getPageNumber());
        return productRepository.findByStatus(ProductStatus.ACTIVE, pageable)
                .map(productDtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.CACHE_PRODUCT_DETAILS, key = "#id")
    public ProductDTO getProductById(Long id) {
        logger.debug("Fetching product by id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return productDtoMapper.toDto(product);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.CACHE_PRODUCT_DETAILS, key = "'slug:' + #slug")
    public ProductDTO getProductBySlug(String slug) {
        logger.debug("Fetching product by slug: {}", slug);
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return productDtoMapper.toDto(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByGender(Gender gender, Pageable pageable) {
        logger.debug("Fetching products by gender: {}", gender);
        return productRepository.findByGenderAndStatus(gender, com.stylediscovery.enums.ProductStatus.ACTIVE, pageable)
                .map(productDtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProductsByBrand(String brand, Pageable pageable) {
        logger.debug("Fetching products by brand: {}", brand);
        return productRepository.findByBrandAndStatus(brand, ProductStatus.ACTIVE, pageable)
                .map(productDtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> searchProducts(String keyword, Pageable pageable) {
        logger.debug("Searching products with keyword: {}", keyword);
        return productRepository.searchProducts(keyword, pageable)
                .map(productDtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductDTO> filterProducts(Gender gender, String brand,
                                          BigDecimal minPrice, BigDecimal maxPrice,
                                          Pageable pageable) {
        logger.debug("Filtering products - gender: {}, brand: {}, price range: {}-{}",
                gender, brand, minPrice, maxPrice);
        return productRepository.findByFilters(ProductStatus.ACTIVE, gender, brand, minPrice, maxPrice, pageable)
                .map(productDtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public java.util.List<String> getAllBrands() {
        logger.debug("Fetching all active brands");
        return productRepository.findAllActiveBrands();
    }
}
