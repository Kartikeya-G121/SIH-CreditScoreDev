package com.sih.module.auth.service;

import com.sih.module.auth.dto.UserSearchCriteria;
import com.sih.module.auth.dto.UserSearchResponse;
import com.sih.module.auth.dto.UserSearchResult;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.beneficiary.entity.BeneficiaryProfile;
import com.sih.module.beneficiary.repository.BeneficiaryProfileRepository;
import com.sih.common.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;


/**
 * Service for advanced user search with dynamic filtering
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSearchService {

    private final UserRepository userRepository;
    private final BeneficiaryProfileRepository profileRepository;

    /**
     * Perform advanced user search with multiple filters
     */
    public UserSearchResponse advancedSearch(UserSearchCriteria criteria) {
        log.info("Performing advanced user search with criteria: {}", criteria);

        // Build specification from criteria
        Specification<User> spec = buildSpecification(criteria);

        // Create pageable with sorting
        Pageable pageable = createPageable(criteria);

        // Execute query
        Page<User> userPage = userRepository.findAll(spec, pageable);

        // Map to response
        List<UserSearchResult> results = userPage.getContent().stream()
                .map(this::mapToSearchResult)
                .collect(Collectors.toList());

        return UserSearchResponse.builder()
                .users(results)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(criteria.getPage())
                .pageSize(criteria.getSize())
                .appliedFilters(criteria)
                .build();
    }

    /**
     * Build JPA Specification from search criteria
     */
    private Specification<User> buildSpecification(UserSearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Role filter
            if (criteria.getRole() != null && !criteria.getRole().isEmpty()) {
                try {
                    UserRole role = UserRole.valueOf(criteria.getRole().toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("role"), role));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid role: {}", criteria.getRole());
                }
            }

            // Active status filter
            if (criteria.getIsActive() != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActive"), criteria.getIsActive()));
            }

            // Text search (email, phone)
            if (criteria.getSearchText() != null && !criteria.getSearchText().isEmpty()) {
                String searchPattern = "%" + criteria.getSearchText().toLowerCase() + "%";
                Predicate emailMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("email")), searchPattern);
                Predicate phoneMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("phoneNumber")), searchPattern);
                predicates.add(criteriaBuilder.or(emailMatch, phoneMatch));
            }

            // Date range filters
            if (criteria.getRegisteredAfter() != null) {
                OffsetDateTime startOfDay = criteria.getRegisteredAfter().atStartOfDay().atOffset(java.time.ZoneOffset.UTC);
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startOfDay));
            }
            if (criteria.getRegisteredBefore() != null) {
                OffsetDateTime endOfDay = criteria.getRegisteredBefore().atTime(23, 59, 59).atOffset(java.time.ZoneOffset.UTC);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endOfDay));
            }

            // Profile-based filters - get matching user IDs from profiles
            if (hasProfileFilters(criteria)) {
                Set<Long> matchingUserIds = getMatchingUserIdsFromProfiles(criteria);
                if (matchingUserIds.isEmpty()) {
                    // No profiles match, return no results
                    predicates.add(criteriaBuilder.equal(root.get("userId"), -1L));
                } else {
                    predicates.add(root.get("userId").in(matchingUserIds));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }


    /**
     * Check if any profile-based filters are present
     */
    private boolean hasProfileFilters(UserSearchCriteria criteria) {
        return (criteria.getRegionType() != null && !criteria.getRegionType().isEmpty()) ||
               (criteria.getState() != null && !criteria.getState().isEmpty()) ||
               (criteria.getDistrict() != null && !criteria.getDistrict().isEmpty()) ||
               (criteria.getCasteCategory() != null && !criteria.getCasteCategory().isEmpty()) ||
               (criteria.getGender() != null && !criteria.getGender().isEmpty());
    }

    /**
     * Get user IDs that match profile filters using direct query
     */
    private Set<Long> getMatchingUserIdsFromProfiles(UserSearchCriteria criteria) {
        log.info("Filtering profiles with criteria - State: {}, District: {}, Gender: {}, Region: {}, Caste: {}", 
                 criteria.getState(), criteria.getDistrict(), criteria.getGender(), 
                 criteria.getRegionType(), criteria.getCasteCategory());
        
        List<Long> userIds = profileRepository.findUserIdsByProfileCriteria(
            criteria.getRegionType(),
            criteria.getState(),
            criteria.getDistrict(),
            criteria.getCasteCategory(),
            criteria.getGender()
        );
        
        log.info("Found {} matching user IDs from profiles: {}", userIds.size(), userIds);
        return new HashSet<>(userIds);
    }

    /**
     * Create pageable with sorting
     */
    private Pageable createPageable(UserSearchCriteria criteria) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(criteria.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Sort sort = Sort.by(direction, criteria.getSortBy());
        return PageRequest.of(criteria.getPage(), criteria.getSize(), sort);
    }

    /**
     * Map User entity to UserSearchResult DTO
     * Fetches profile data separately using BeneficiaryProfileRepository
     */
    private UserSearchResult mapToSearchResult(User user) {
        UserSearchResult.UserSearchResultBuilder builder = UserSearchResult.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .isBlacklisted(user.getIsBlacklisted())
                .preferredLanguage(user.getPreferredLanguage())
                .createdAt(user.getCreatedAt().toString());

        // Fetch profile data if available
        Optional<BeneficiaryProfile> profileOpt = profileRepository.findByUserUserId(user.getUserId());
        if (profileOpt.isPresent()) {
            BeneficiaryProfile profile = profileOpt.get();
            builder.fullName(profile.getFullName())
                   .state(profile.getState())
                   .district(profile.getDistrict())
                   .regionType(profile.getRegionType())
                   .casteCategory(profile.getCasteCategory())
                   .gender(profile.getGender());
        }

        return builder.build();
    }
}
