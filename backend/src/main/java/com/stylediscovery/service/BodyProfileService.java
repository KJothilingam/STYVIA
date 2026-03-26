package com.stylediscovery.service;

import com.stylediscovery.dto.BodyProfileDTO;
import com.stylediscovery.entity.BodyProfile;
import com.stylediscovery.entity.User;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.BodyProfileRepository;
import com.stylediscovery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BodyProfileService {

    private final BodyProfileRepository bodyProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public BodyProfileDTO getForUser(Long userId) {
        return bodyProfileRepository.findByUser_Id(userId)
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean existsForUser(Long userId) {
        return bodyProfileRepository.existsByUser_Id(userId);
    }

    @Transactional
    public BodyProfileDTO save(Long userId, BodyProfileDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        BodyProfile entity = bodyProfileRepository.findByUser_Id(userId).orElse(null);
        if (entity == null) {
            entity = BodyProfile.builder().user(user).build();
        }
        apply(entity, dto);
        return toDto(bodyProfileRepository.save(entity));
    }

    private void apply(BodyProfile e, BodyProfileDTO d) {
        e.setHeightCm(d.getHeightCm());
        e.setWeightKg(d.getWeightKg());
        e.setGender(d.getGender());
        e.setBodyShape(d.getBodyShape());
        e.setShoulderWidth(d.getShoulderWidth());
        e.setChestType(d.getChestType());
        e.setWaistType(d.getWaistType());
        e.setFitPreference(d.getFitPreference());
        e.setChestCm(d.getChestCm());
        e.setShoulderCm(d.getShoulderCm());
        e.setWaistCm(d.getWaistCm());
        e.setLengthCm(d.getLengthCm());
        e.setUsualShirtSize(d.getUsualShirtSize() == null || d.getUsualShirtSize().isBlank() ? null : d.getUsualShirtSize().trim());
        e.setUsualPantWaistInches(d.getUsualPantWaistInches());
        e.setUsualShoeSize(d.getUsualShoeSize() == null || d.getUsualShoeSize().isBlank() ? null : d.getUsualShoeSize().trim());
        e.setSareeStyle(d.getSareeStyle() == null || d.getSareeStyle().isBlank() ? null : d.getSareeStyle().trim());
        e.setPrefersFreeSize(Boolean.TRUE.equals(d.getPrefersFreeSize()));
    }

    private BodyProfileDTO toDto(BodyProfile e) {
        return BodyProfileDTO.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .heightCm(e.getHeightCm())
                .weightKg(e.getWeightKg())
                .gender(e.getGender())
                .bodyShape(e.getBodyShape())
                .shoulderWidth(e.getShoulderWidth())
                .chestType(e.getChestType())
                .waistType(e.getWaistType())
                .fitPreference(e.getFitPreference())
                .chestCm(e.getChestCm())
                .shoulderCm(e.getShoulderCm())
                .waistCm(e.getWaistCm())
                .lengthCm(e.getLengthCm())
                .usualShirtSize(e.getUsualShirtSize())
                .usualPantWaistInches(e.getUsualPantWaistInches())
                .usualShoeSize(e.getUsualShoeSize())
                .sareeStyle(e.getSareeStyle())
                .prefersFreeSize(e.getPrefersFreeSize())
                .build();
    }
}
