package com.sih.common.config;

import com.sih.module.auth.service.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Fail-safe configuration helper
 * Provides centralized access to feature flags for graceful degradation
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FailSafeConfig {
    
    private final FeatureFlagService featureFlagService;
    
    public boolean isVerificationEngineEnabled() {
        return featureFlagService.isEnabled("verification_engine_enabled");
    }
    
    public boolean isAutoSanctionEnabled() {
        return featureFlagService.isEnabled("autosanction_enabled");
    }
    
    public boolean isVoiceInteractionEnabled() {
        return featureFlagService.isEnabled("voice_interaction_enabled");
    }
    
    public boolean isRescoreCronEnabled() {
        return featureFlagService.isEnabled("rescore_cron_enabled");
    }
    
    public boolean isS3Enabled() {
        return featureFlagService.isEnabled("s3_enabled");
    }
}

