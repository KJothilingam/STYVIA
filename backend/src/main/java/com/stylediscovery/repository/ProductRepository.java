package com.stylediscovery.repository;

import com.stylediscovery.entity.Product;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlug(String slug);
    
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    
    Page<Product> findByGenderAndStatus(Gender gender, ProductStatus status, Pageable pageable);
    
    Page<Product> findByBrandAndStatus(String brand, ProductStatus status, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.status = :status " +
           "AND (:gender IS NULL OR p.gender = :gender) " +
           "AND (:brand IS NULL OR p.brand = :brand) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice)")
    Page<Product> findByFilters(
        @Param("status") ProductStatus status,
        @Param("gender") Gender gender,
        @Param("brand") String brand,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        Pageable pageable
    );
    
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.status = 'ACTIVE' ORDER BY p.brand")
    List<String> findAllActiveBrands();
    
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);

    /** Admin catalog: optional status filter and optional name/brand keyword (null keyword = no text filter). */
    @Query("SELECT p FROM Product p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:keyword IS NULL OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> findForAdmin(
            @Param("status") ProductStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);
}

