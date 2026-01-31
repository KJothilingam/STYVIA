package com.stylediscovery.repository;

import com.stylediscovery.entity.Category;
import com.stylediscovery.enums.Gender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByGenderAndIsActiveTrue(Gender gender);
    List<Category> findByParentIdIsNullAndIsActiveTrue();
    List<Category> findByParentIdAndIsActiveTrue(Long parentId);
}

