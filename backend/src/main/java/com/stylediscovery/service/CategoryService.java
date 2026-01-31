package com.stylediscovery.service;

import com.stylediscovery.dto.CategoryDTO;
import com.stylediscovery.entity.Category;
import com.stylediscovery.enums.Gender;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        logger.info("Fetching all active categories");
        return categoryRepository.findAll().stream()
                .filter(Category::getIsActive)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        logger.info("Fetching category by id: {}", id);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return convertToDTO(category);
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        logger.info("Fetching category by slug: {}", slug);
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return convertToDTO(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getCategoriesByGender(Gender gender) {
        logger.info("Fetching categories by gender: {}", gender);
        return categoryRepository.findByGenderAndIsActiveTrue(gender).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getRootCategories() {
        logger.info("Fetching root categories");
        return categoryRepository.findByParentIdIsNullAndIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO> getSubCategories(Long parentId) {
        logger.info("Fetching subcategories for parent id: {}", parentId);
        return categoryRepository.findByParentIdAndIsActiveTrue(parentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private CategoryDTO convertToDTO(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .gender(category.getGender())
                .imageUrl(category.getImageUrl())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .build();
    }
}

