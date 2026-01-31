package com.stylediscovery.service;

import com.stylediscovery.dto.AddressDTO;
import com.stylediscovery.entity.Address;
import com.stylediscovery.entity.User;
import com.stylediscovery.exception.BadRequestException;
import com.stylediscovery.exception.ResourceNotFoundException;
import com.stylediscovery.repository.AddressRepository;
import com.stylediscovery.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private static final Logger logger = LoggerFactory.getLogger(AddressService.class);

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AddressDTO> getUserAddresses(Long userId) {
        logger.info("Fetching addresses for user: {}", userId);
        return addressRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressDTO addAddress(Long userId, AddressDTO addressDTO) {
        logger.info("Adding address for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If this is the first address or marked as default, make it default
        List<Address> existingAddresses = addressRepository.findByUserId(userId);
        boolean isDefault = existingAddresses.isEmpty() || 
                           (addressDTO.getIsDefault() != null && addressDTO.getIsDefault());

        // If setting as default, remove default from other addresses
        if (isDefault) {
            existingAddresses.forEach(addr -> {
                addr.setIsDefault(false);
                addressRepository.save(addr);
            });
        }

        Address address = Address.builder()
                .user(user)
                .name(addressDTO.getName())
                .phone(addressDTO.getPhone())
                .addressLine1(addressDTO.getAddressLine1())
                .addressLine2(addressDTO.getAddressLine2())
                .locality(addressDTO.getLocality())
                .city(addressDTO.getCity())
                .state(addressDTO.getState())
                .pincode(addressDTO.getPincode())
                .country(addressDTO.getCountry() != null ? addressDTO.getCountry() : "India")
                .addressType(addressDTO.getAddressType())
                .isDefault(isDefault)
                .build();

        address = addressRepository.save(address);
        logger.info("Address added successfully");
        return convertToDTO(address);
    }

    @Transactional
    public AddressDTO updateAddress(Long userId, Long addressId, AddressDTO addressDTO) {
        logger.info("Updating address: {} for user: {}", addressId, userId);

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        address.setName(addressDTO.getName());
        address.setPhone(addressDTO.getPhone());
        address.setAddressLine1(addressDTO.getAddressLine1());
        address.setAddressLine2(addressDTO.getAddressLine2());
        address.setLocality(addressDTO.getLocality());
        address.setCity(addressDTO.getCity());
        address.setState(addressDTO.getState());
        address.setPincode(addressDTO.getPincode());
        address.setCountry(addressDTO.getCountry());
        address.setAddressType(addressDTO.getAddressType());

        address = addressRepository.save(address);
        logger.info("Address updated successfully");
        return convertToDTO(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        logger.info("Deleting address: {} for user: {}", addressId, userId);

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        addressRepository.delete(address);
        logger.info("Address deleted successfully");
    }

    @Transactional
    public AddressDTO setDefaultAddress(Long userId, Long addressId) {
        logger.info("Setting default address: {} for user: {}", addressId, userId);

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.getUser().getId().equals(userId)) {
            throw new BadRequestException("Address does not belong to user");
        }

        // Remove default from all other addresses
        List<Address> userAddresses = addressRepository.findByUserId(userId);
        userAddresses.forEach(addr -> {
            addr.setIsDefault(false);
            addressRepository.save(addr);
        });

        // Set this as default
        address.setIsDefault(true);
        address = addressRepository.save(address);

        logger.info("Default address set successfully");
        return convertToDTO(address);
    }

    private AddressDTO convertToDTO(Address address) {
        return AddressDTO.builder()
                .id(address.getId())
                .name(address.getName())
                .phone(address.getPhone())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .locality(address.getLocality())
                .city(address.getCity())
                .state(address.getState())
                .pincode(address.getPincode())
                .country(address.getCountry())
                .addressType(address.getAddressType())
                .isDefault(address.getIsDefault())
                .build();
    }
}

