package com.stylediscovery.service;

import com.stylediscovery.dto.*;
import com.stylediscovery.dto.admin.*;
import com.stylediscovery.entity.DonationBoxRequest;
import com.stylediscovery.entity.DonationPickupRequest;
import com.stylediscovery.entity.User;
import com.stylediscovery.enums.DonationBoxStatus;
import com.stylediscovery.enums.DonationPickupStatus;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.DonationBoxRequestRepository;
import com.stylediscovery.repository.DonationPickupRequestRepository;
import com.stylediscovery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationPickupRequestRepository pickupRepo;
    private final DonationBoxRequestRepository boxRepo;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DonationPickupRequestDTO> listPickups(Long userId) {
        return pickupRepo.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::toPickupDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DonationPickupRequestDTO createPickup(Long userId, CreateDonationPickupRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        DonationPickupRequest e = DonationPickupRequest.builder()
                .user(user)
                .wardrobeItemId(req.getWardrobeItemId())
                .productSummary(req.getProductSummary())
                .size(req.getSize())
                .donationCenterCode(req.getDonationCenterCode().trim())
                .pickupAddress(req.getPickupAddress())
                .notes(req.getNotes())
                .status(DonationPickupStatus.PENDING)
                .build();
        return toPickupDto(pickupRepo.save(e));
    }

    @Transactional(readOnly = true)
    public long countPendingPickups() {
        return pickupRepo.countByStatus(DonationPickupStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<AdminDonationPickupDTO> listPickupsForAdmin() {
        return pickupRepo.findAllWithUserOrderByCreatedAtDesc().stream()
                .map(this::toAdminPickupDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminDonationPickupDTO acceptPickup(Long id, AdminAcceptDonationPickupRequest body) {
        DonationPickupRequest e = pickupRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup request not found"));
        if (e.getStatus() != DonationPickupStatus.PENDING) {
            throw new BadRequestException("Only PENDING requests can be accepted.");
        }
        appendAdminReply(e, body != null ? body.getReply() : null);
        e.setStatus(DonationPickupStatus.REQ_ACCEPTED);
        return toAdminPickupDto(pickupRepo.save(e));
    }

    @Transactional
    public AdminDonationPickupDTO rejectPickup(Long id, AdminAcceptDonationPickupRequest body) {
        DonationPickupRequest e = pickupRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup request not found"));
        if (e.getStatus() != DonationPickupStatus.PENDING) {
            throw new BadRequestException("Only PENDING requests can be rejected.");
        }
        appendAdminReply(e, body != null ? body.getReply() : null);
        e.setStatus(DonationPickupStatus.CANCELLED);
        return toAdminPickupDto(pickupRepo.save(e));
    }

    @Transactional
    public AdminDonationPickupDTO schedulePickup(Long id, AdminScheduleDonationPickupRequest body) {
        DonationPickupRequest e = pickupRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup request not found"));
        if (e.getStatus() != DonationPickupStatus.REQ_ACCEPTED) {
            throw new BadRequestException("Set expected pick date only after the request is accepted.");
        }
        e.setExpectedPickAt(body.getExpectedPickAt());
        appendAdminReply(e, body.getReply());
        e.setStatus(DonationPickupStatus.EXPECTED_PICK_DATE);
        return toAdminPickupDto(pickupRepo.save(e));
    }

    @Transactional
    public AdminDonationPickupDTO completePickup(Long id, AdminCompleteDonationPickupRequest body) {
        DonationPickupRequest e = pickupRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup request not found"));
        if (e.getStatus() != DonationPickupStatus.EXPECTED_PICK_DATE) {
            throw new BadRequestException("Mark completed only after a pick date is set.");
        }
        appendAdminReply(e, body != null ? body.getReply() : null);
        e.setStatus(DonationPickupStatus.COMPLETED);
        return toAdminPickupDto(pickupRepo.save(e));
    }

    private void appendAdminReply(DonationPickupRequest e, String newPart) {
        if (!StringUtils.hasText(newPart)) {
            return;
        }
        String trimmed = newPart.trim();
        String prev = e.getAdminReply();
        e.setAdminReply(prev == null || prev.isBlank() ? trimmed : prev + "\n---\n" + trimmed);
    }

    @Transactional(readOnly = true)
    public List<DonationBoxRequestDTO> listBoxes(Long userId) {
        return boxRepo.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::toBoxDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DonationBoxRequestDTO requestBox(Long userId, CreateDonationBoxRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String token = UUID.randomUUID().toString().replace("-", "");
        DonationBoxRequest e = DonationBoxRequest.builder()
                .user(user)
                .dropToken(token)
                .addressLine1(req.getAddressLine1().trim())
                .locality(req.getLocality())
                .city(req.getCity().trim())
                .pincode(req.getPincode().trim())
                .phone(req.getPhone().trim())
                .notes(req.getNotes())
                .status(DonationBoxStatus.PENDING)
                .build();
        return toBoxDto(boxRepo.save(e));
    }

    @Transactional(readOnly = true)
    public long countPendingBoxes() {
        return boxRepo.countByStatus(DonationBoxStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<AdminDonationBoxDTO> listBoxesForAdmin() {
        return boxRepo.findAllWithUserOrderByCreatedAtDesc().stream()
                .map(this::toAdminBoxDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminDonationBoxDTO acceptBox(Long id, AdminAcceptDonationPickupRequest body) {
        DonationBoxRequest e = boxRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Box request not found"));
        if (e.getStatus() != DonationBoxStatus.PENDING) {
            throw new BadRequestException("Only PENDING box requests can be approved.");
        }
        appendBoxAdminReply(e, body != null ? body.getReply() : null);
        e.setStatus(DonationBoxStatus.REQ_ACCEPTED);
        return toAdminBoxDto(boxRepo.save(e));
    }

    @Transactional
    public AdminDonationBoxDTO rejectBox(Long id, AdminAcceptDonationPickupRequest body) {
        DonationBoxRequest e = boxRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Box request not found"));
        if (e.getStatus() != DonationBoxStatus.PENDING) {
            throw new BadRequestException("Only PENDING box requests can be rejected.");
        }
        appendBoxAdminReply(e, body != null ? body.getReply() : null);
        e.setStatus(DonationBoxStatus.CANCELLED);
        return toAdminBoxDto(boxRepo.save(e));
    }

    @Transactional
    public AdminDonationBoxDTO scheduleBoxDelivery(Long id, AdminScheduleDonationPickupRequest body) {
        DonationBoxRequest e = boxRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Box request not found"));
        if (e.getStatus() != DonationBoxStatus.REQ_ACCEPTED) {
            throw new BadRequestException("Set expected delivery only after the request is approved.");
        }
        e.setExpectedDeliveryAt(body.getExpectedPickAt());
        appendBoxAdminReply(e, body.getReply());
        e.setStatus(DonationBoxStatus.EXPECTED_DELIVERY);
        return toAdminBoxDto(boxRepo.save(e));
    }

    @Transactional
    public AdminDonationBoxDTO completeBox(Long id, AdminCompleteDonationPickupRequest body) {
        DonationBoxRequest e = boxRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Box request not found"));
        if (e.getStatus() != DonationBoxStatus.EXPECTED_DELIVERY) {
            throw new BadRequestException("Mark completed only after expected delivery is set.");
        }
        appendBoxAdminReply(e, body != null ? body.getReply() : null);
        e.setStatus(DonationBoxStatus.COMPLETED);
        return toAdminBoxDto(boxRepo.save(e));
    }

    private void appendBoxAdminReply(DonationBoxRequest e, String newPart) {
        if (!StringUtils.hasText(newPart)) {
            return;
        }
        String trimmed = newPart.trim();
        String prev = e.getAdminReply();
        e.setAdminReply(prev == null || prev.isBlank() ? trimmed : prev + "\n---\n" + trimmed);
    }

    @Transactional(readOnly = true)
    public DropVerifyResponse verifyDropToken(String token) {
        return boxRepo.findByDropToken(token)
                .map(b -> {
                    DonationBoxStatus s = b.getStatus();
                    boolean valid = s != DonationBoxStatus.CANCELLED;
                    String message = switch (s) {
                        case PENDING -> "Box request is pending admin approval.";
                        case REQ_ACCEPTED -> "Approved — empty box is being prepared for shipment.";
                        case EXPECTED_DELIVERY -> "Box shipment scheduled. Customer may bring this code when dropping off a filled box after delivery.";
                        case COMPLETED -> "Box delivered. Customer may use this code at the drop when the box is full.";
                        case CANCELLED -> "This request was cancelled.";
                    };
                    return DropVerifyResponse.builder()
                            .valid(valid)
                            .status(s.name())
                            .message(message)
                            .build();
                })
                .orElse(DropVerifyResponse.builder()
                        .valid(false)
                        .status("UNKNOWN")
                        .message("Invalid or expired drop code.")
                        .build());
    }

    private DonationPickupRequestDTO toPickupDto(DonationPickupRequest e) {
        return DonationPickupRequestDTO.builder()
                .id(e.getId())
                .wardrobeItemId(e.getWardrobeItemId())
                .productSummary(e.getProductSummary())
                .size(e.getSize())
                .donationCenterCode(e.getDonationCenterCode())
                .pickupAddress(e.getPickupAddress())
                .notes(e.getNotes())
                .adminReply(e.getAdminReply())
                .expectedPickAt(e.getExpectedPickAt())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private AdminDonationPickupDTO toAdminPickupDto(DonationPickupRequest e) {
        User u = e.getUser();
        return AdminDonationPickupDTO.builder()
                .id(e.getId())
                .userId(u.getId())
                .userEmail(u.getEmail())
                .userName(u.getName())
                .wardrobeItemId(e.getWardrobeItemId())
                .productSummary(e.getProductSummary())
                .size(e.getSize())
                .donationCenterCode(e.getDonationCenterCode())
                .pickupAddress(e.getPickupAddress())
                .notes(e.getNotes())
                .adminReply(e.getAdminReply())
                .expectedPickAt(e.getExpectedPickAt())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private DonationBoxRequestDTO toBoxDto(DonationBoxRequest e) {
        User u = e.getUser();
        return DonationBoxRequestDTO.builder()
                .id(e.getId())
                .userName(u.getName())
                .userEmail(u.getEmail())
                .dropToken(e.getDropToken())
                .addressLine1(e.getAddressLine1())
                .locality(e.getLocality())
                .city(e.getCity())
                .pincode(e.getPincode())
                .phone(e.getPhone())
                .notes(e.getNotes())
                .adminReply(e.getAdminReply())
                .expectedDeliveryAt(e.getExpectedDeliveryAt())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private AdminDonationBoxDTO toAdminBoxDto(DonationBoxRequest e) {
        User u = e.getUser();
        return AdminDonationBoxDTO.builder()
                .id(e.getId())
                .userId(u.getId())
                .userEmail(u.getEmail())
                .userName(u.getName())
                .dropToken(e.getDropToken())
                .addressLine1(e.getAddressLine1())
                .locality(e.getLocality())
                .city(e.getCity())
                .pincode(e.getPincode())
                .phone(e.getPhone())
                .notes(e.getNotes())
                .adminReply(e.getAdminReply())
                .expectedDeliveryAt(e.getExpectedDeliveryAt())
                .status(e.getStatus().name())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
