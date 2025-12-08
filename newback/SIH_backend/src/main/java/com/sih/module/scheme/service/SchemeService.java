package com.sih.module.scheme.service;

import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.scheme.dto.*;
import com.sih.module.scheme.entity.LoanScheme;
import com.sih.module.scheme.repository.LoanSchemeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.stream.Collectors;

import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.partner.entity.ChannelPartner;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import com.sih.common.enums.UserRole;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchemeService {

    private final LoanSchemeRepository schemeRepository;
    private final ChannelPartnerRepository channelPartnerRepository;
    private final UserRepository userRepository;

    @Transactional
    @CacheEvict(value = "schemes", allEntries = true)
    public SchemeResponse createScheme(SchemeRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String finalProviderName = request.getProviderName();
        ChannelPartner partner = null;

        if (user.getRole() == UserRole.CHANNEL_PARTNER) {
            partner = channelPartnerRepository.findByUser(user)
                    .orElseThrow(() -> new ResourceNotFoundException("Channel Partner profile not found"));
            // Force provider name to match the partner's organization default or explicit
            // name
            finalProviderName = partner.getOrganizationName();
        }

        LoanScheme scheme = LoanScheme.builder()
                .schemeName(request.getSchemeName())
                .providerName(finalProviderName)
                .channelPartner(partner) // Associate with partner
                .loanCategory(request.getLoanCategory())
                .minAmount(request.getMinAmount())
                .maxAmount(request.getMaxAmount())
                .baseInterestRate(request.getBaseInterestRate())
                .minTenureMonths(request.getMinTenureMonths())
                .maxTenureMonths(request.getMaxTenureMonths())
                .isTieredInterest(request.getIsTieredInterest() != null ? request.getIsTieredInterest() : false)
                .tierThreshold(request.getTierThreshold())
                .tierInterestRate(request.getTierInterestRate())
                .minAge(request.getMinAge())
                .maxAge(request.getMaxAge())
                .genderAllowed(request.getGenderAllowed())
                .casteCategory(request.getCasteCategory())
                .incomeMax(request.getIncomeMax())
                .maxExistingLoans(request.getMaxExistingLoans() != null ? request.getMaxExistingLoans() : 1)
                .isSubsidy(request.getIsSubsidy() != null ? request.getIsSubsidy() : false)
                .subsidyType(request.getSubsidyType())
                .subsidyPercentage(request.getSubsidyPercentage())
                .gracePeriodDays(request.getGracePeriodDays() != null ? request.getGracePeriodDays() : 0)
                .penaltyRate(request.getPenaltyRate())
                .emiBounceCharges(request.getEmiBounceCharges() != null ? request.getEmiBounceCharges()
                        : java.math.BigDecimal.ZERO)
                .allowPrepayment(request.getAllowPrepayment() != null ? request.getAllowPrepayment() : true)
                .prepaymentPenalty(request.getPrepaymentPenalty() != null ? request.getPrepaymentPenalty()
                        : java.math.BigDecimal.ZERO)
                .isGroupLoanAllowed(request.getIsGroupLoanAllowed() != null ? request.getIsGroupLoanAllowed() : false)
                .createdBy(user.getEmail())
                .isActive(true)
                .build();

        scheme = schemeRepository.save(scheme);
        log.info("Loan scheme created: {}", scheme.getSchemeId());

        return mapToResponse(scheme);
    }

    @Cacheable(value = "schemes", key = "'active'")
    public List<SchemeResponse> getActiveSchemes() {
        return schemeRepository.findByIsActive(true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SchemeResponse> getAllSchemes() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || authentication.getPrincipal() == null) {
                return schemeRepository.findAll().stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            }

            Long userId = (Long) authentication.getPrincipal();
            User user = userRepository.findById(userId).orElse(null);

            if (user != null && user.getRole() == UserRole.CHANNEL_PARTNER) {
                ChannelPartner partner = channelPartnerRepository.findByUser(user)
                        .orElseThrow(() -> new ResourceNotFoundException("Channel Partner profile not found"));
                String providerName = partner.getOrganizationName();

                // Filter by provider name
                return schemeRepository.findAll().stream()
                        .filter(s -> providerName != null && providerName.equals(s.getProviderName()))
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Error in getAllSchemes: {}", e.getMessage());
        }

        return schemeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SchemeResponse getSchemeById(Integer schemeId) {
        LoanScheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));
        return mapToResponse(scheme);
    }

    @Transactional
    @CacheEvict(value = "schemes", allEntries = true)
    public SchemeResponse updateScheme(Integer schemeId, SchemeRequest request) {
        LoanScheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));

        validateSchemeOwnership(scheme);

        if (request.getSchemeName() != null)
            scheme.setSchemeName(request.getSchemeName());
        if (request.getProviderName() != null)
            scheme.setProviderName(request.getProviderName());
        if (request.getLoanCategory() != null)
            scheme.setLoanCategory(request.getLoanCategory());
        if (request.getMinAmount() != null)
            scheme.setMinAmount(request.getMinAmount());
        if (request.getMaxAmount() != null)
            scheme.setMaxAmount(request.getMaxAmount());
        if (request.getBaseInterestRate() != null)
            scheme.setBaseInterestRate(request.getBaseInterestRate());
        if (request.getMinTenureMonths() != null)
            scheme.setMinTenureMonths(request.getMinTenureMonths());
        if (request.getMaxTenureMonths() != null)
            scheme.setMaxTenureMonths(request.getMaxTenureMonths());
        if (request.getIsTieredInterest() != null)
            scheme.setIsTieredInterest(request.getIsTieredInterest());
        if (request.getTierThreshold() != null)
            scheme.setTierThreshold(request.getTierThreshold());
        if (request.getTierInterestRate() != null)
            scheme.setTierInterestRate(request.getTierInterestRate());

        if (request.getMinAge() != null)
            scheme.setMinAge(request.getMinAge());
        if (request.getMaxAge() != null)
            scheme.setMaxAge(request.getMaxAge());
        if (request.getGenderAllowed() != null)
            scheme.setGenderAllowed(request.getGenderAllowed());
        if (request.getCasteCategory() != null)
            scheme.setCasteCategory(request.getCasteCategory());
        if (request.getIncomeMax() != null)
            scheme.setIncomeMax(request.getIncomeMax());
        if (request.getMaxExistingLoans() != null)
            scheme.setMaxExistingLoans(request.getMaxExistingLoans());
        if (request.getIsSubsidy() != null)
            scheme.setIsSubsidy(request.getIsSubsidy());
        if (request.getSubsidyType() != null)
            scheme.setSubsidyType(request.getSubsidyType());
        if (request.getSubsidyPercentage() != null)
            scheme.setSubsidyPercentage(request.getSubsidyPercentage());
        if (request.getGracePeriodDays() != null)
            scheme.setGracePeriodDays(request.getGracePeriodDays());
        if (request.getPenaltyRate() != null)
            scheme.setPenaltyRate(request.getPenaltyRate());
        if (request.getEmiBounceCharges() != null)
            scheme.setEmiBounceCharges(request.getEmiBounceCharges());
        if (request.getAllowPrepayment() != null)
            scheme.setAllowPrepayment(request.getAllowPrepayment());
        if (request.getPrepaymentPenalty() != null)
            scheme.setPrepaymentPenalty(request.getPrepaymentPenalty());
        if (request.getIsGroupLoanAllowed() != null)
            scheme.setIsGroupLoanAllowed(request.getIsGroupLoanAllowed());

        scheme = schemeRepository.save(scheme);
        return mapToResponse(scheme);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "schemes", allEntries = true),
            @CacheEvict(value = "loanPortfolioAnalytics", allEntries = true)
    })
    public SchemeResponse toggleScheme(Integer schemeId) {
        LoanScheme scheme = schemeRepository.findById(schemeId)
                .orElseThrow(() -> new ResourceNotFoundException("Scheme not found"));

        validateSchemeOwnership(scheme);

        scheme.setIsActive(!scheme.getIsActive());
        scheme = schemeRepository.save(scheme);

        log.info("Scheme {} toggled to: {}", schemeId, scheme.getIsActive());
        return mapToResponse(scheme);
    }

    @Transactional
    @CacheEvict(value = "schemes", allEntries = true)
    public void deleteScheme(Integer schemeId) {
        if (!schemeRepository.existsById(schemeId)) {
            throw new ResourceNotFoundException("Scheme not found");
        }
        LoanScheme scheme = schemeRepository.findById(schemeId).get();
        validateSchemeOwnership(scheme);
        schemeRepository.deleteById(schemeId);
        log.info("Scheme {} deleted", schemeId);
    }

    private SchemeResponse mapToResponse(LoanScheme scheme) {
        return SchemeResponse.builder()
                .schemeId(scheme.getSchemeId())
                .schemeName(scheme.getSchemeName())
                .providerName(scheme.getProviderName())
                .loanCategory(scheme.getLoanCategory())
                .minAmount(scheme.getMinAmount())
                .maxAmount(scheme.getMaxAmount())
                .baseInterestRate(scheme.getBaseInterestRate())
                .minTenureMonths(scheme.getMinTenureMonths())
                .maxTenureMonths(scheme.getMaxTenureMonths())
                .isTieredInterest(scheme.getIsTieredInterest())
                .tierThreshold(scheme.getTierThreshold())
                .tierInterestRate(scheme.getTierInterestRate())
                .minAge(scheme.getMinAge())
                .maxAge(scheme.getMaxAge())
                .genderAllowed(scheme.getGenderAllowed())
                .casteCategory(scheme.getCasteCategory())
                .incomeMax(scheme.getIncomeMax())
                .maxExistingLoans(scheme.getMaxExistingLoans())
                .isSubsidy(scheme.getIsSubsidy())
                .subsidyType(scheme.getSubsidyType())
                .subsidyPercentage(scheme.getSubsidyPercentage())
                .gracePeriodDays(scheme.getGracePeriodDays())
                .penaltyRate(scheme.getPenaltyRate())
                .emiBounceCharges(scheme.getEmiBounceCharges())
                .allowPrepayment(scheme.getAllowPrepayment())
                .prepaymentPenalty(scheme.getPrepaymentPenalty())
                .isGroupLoanAllowed(scheme.getIsGroupLoanAllowed())
                .createdBy(scheme.getCreatedBy())
                .isActive(scheme.getIsActive())
                .createdAt(scheme.getCreatedAt())
                .build();
    }

    private void validateSchemeOwnership(LoanScheme scheme) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            return; // No authentication context, skip validation
        }

        try {
            Long userId = (Long) authentication.getPrincipal();
            User user = userRepository.findById(userId).orElse(null);

            if (user != null && user.getRole() == UserRole.CHANNEL_PARTNER) {
                ChannelPartner partner = channelPartnerRepository.findByUser(user)
                        .orElseThrow(() -> new ResourceNotFoundException("Channel Partner profile not found"));

                if (!partner.getOrganizationName().equals(scheme.getProviderName())) {
                    throw new AccessDeniedException("You can only manage schemes created by your organization.");
                }
            }
        } catch (ClassCastException e) {
            log.error("Error casting authentication principal: {}", e.getMessage());
        }
    }
}
