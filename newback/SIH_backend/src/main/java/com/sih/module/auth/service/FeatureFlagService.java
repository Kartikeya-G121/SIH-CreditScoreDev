package com.sih.module.auth.service;

import com.sih.module.auth.dto.FeatureFlagResponse;
import com.sih.module.auth.dto.FeatureFlagUpdateRequest;
import com.sih.module.auth.entity.FeatureFlag;
import com.sih.module.auth.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeatureFlagService {
    
    private final FeatureFlagRepository featureFlagRepository;
    
    @Cacheable(value = "featureFlags", key = "#flagName")
    public Boolean isEnabled(String flagName) {
        return featureFlagRepository.findByFlagName(flagName)
                .map(FeatureFlag::getFlagValue)
                .orElse(false);
    }
    
    public List<FeatureFlagResponse> getAllFlags() {
        return featureFlagRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    @CacheEvict(value = "featureFlags", key = "#flagName")
    public FeatureFlagResponse updateFlag(String flagName, FeatureFlagUpdateRequest request) {
        FeatureFlag flag = featureFlagRepository.findByFlagName(flagName)
                .orElseThrow(() -> new RuntimeException("Feature flag not found: " + flagName));
        
        flag.setFlagValue(request.getFlagValue());
        if (request.getDescription() != null) {
            flag.setDescription(request.getDescription());
        }
        flag.setLastChangedAt(OffsetDateTime.now());
        
        flag = featureFlagRepository.save(flag);
        log.info("Feature flag updated: {} = {}", flagName, request.getFlagValue());
        
        return mapToResponse(flag);
    }
    
    private FeatureFlagResponse mapToResponse(FeatureFlag flag) {
        return FeatureFlagResponse.builder()
                .flagName(flag.getFlagName())
                .flagValue(flag.getFlagValue())
                .description(flag.getDescription())
                .lastChangedAt(flag.getLastChangedAt())
                .build();
    }
}

