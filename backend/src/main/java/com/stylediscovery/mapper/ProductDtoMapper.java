package com.stylediscovery.mapper;

import com.stylediscovery.dto.CategoryDTO;
import com.stylediscovery.dto.ColorDTO;
import com.stylediscovery.dto.ProductDTO;
import com.stylediscovery.entity.Product;
import com.stylediscovery.entity.ProductImage;
import com.stylediscovery.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductDtoMapper {

    private final InventoryRepository inventoryRepository;

    public ProductDTO toDto(Product product) {
        Long pid = product.getId();
        List<String> sizes = inventoryRepository.findAvailableSizesByProductId(pid);
        List<ColorDTO> colorDTOs = inventoryRepository.findAvailableByProductId(pid)
                .stream()
                .map(inv -> ColorDTO.builder()
                        .name(inv.getColor())
                        .hex(inv.getColorHex())
                        .build())
                .distinct()
                .collect(Collectors.toList());

        List<String> imageUrls = product.getImages().stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());

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
                .stretchLevel(product.getStretchLevel())
                .garmentFitStyle(product.getGarmentFitStyle())
                .images(imageUrls)
                .sizes(sizes)
                .colors(colorDTOs)
                .categories(categoryDTOs)
                .build();
    }
}
