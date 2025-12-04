package com.sih.module.voice.service;

import com.sih.common.config.FailSafeConfig;
import com.sih.common.exception.BadRequestException;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.voice.entity.VoiceInteraction;
import com.sih.module.voice.repository.VoiceInteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceService {
    
    private final VoiceInteractionRepository interactionRepository;
    private final UserRepository userRepository;
    private final FailSafeConfig failSafeConfig;
    
    @Transactional
    public VoiceInteraction processVoiceCommand(Long userId, byte[] audioData, String fileName) {
        // Fail-safe: Check if voice interaction is enabled
        if (!failSafeConfig.isVoiceInteractionEnabled()) {
            throw new BadRequestException("Voice interaction is currently disabled");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String transcribedText;
        String intent;
        
        try {
            // TODO: Integrate with Speech-to-Text service (Google Cloud, AWS Transcribe, etc.)
            // Fail-safe: If STT service fails, return error gracefully
            transcribedText = transcribeAudio(audioData);
            
            // TODO: Integrate with NLP/Intent detection service
            intent = detectIntent(transcribedText);
        } catch (Exception e) {
            log.error("Voice processing failed: {}", e.getMessage());
            // Fail-safe: Return error response instead of crashing
            throw new BadRequestException("Voice processing service is currently unavailable. Please try again later.");
        }
        
        Map<String, Object> actionTaken = new HashMap<>();
        actionTaken.put("intent", intent);
        actionTaken.put("status", "processed");
        
        VoiceInteraction interaction = VoiceInteraction.builder()
                .user(user)
                .audioBlob(audioData)
                .transcribedText(transcribedText)
                .intentDetected(intent)
                .actionTaken(actionTaken)
                .storageType("LOCAL")
                .build();
        
        interaction = interactionRepository.save(interaction);
        log.info("Voice command processed for user: {} - Intent: {}", userId, intent);
        
        return interaction;
    }
    
    public List<VoiceInteraction> getHistory(Long userId) {
        return interactionRepository.findByUserUserId(userId);
    }
    
    public List<String> getSupportedLanguages() {
        return List.of("en", "hi", "ta", "te", "kn", "mr", "gu", "bn");
    }
    
    private String transcribeAudio(byte[] audioData) {
        // TODO: Integrate with actual STT service
        // Fail-safe: Return placeholder if service unavailable
        try {
            // Call STT service here
            return "Transcribed text from audio";
        } catch (Exception e) {
            log.error("STT service unavailable: {}", e.getMessage());
            throw new RuntimeException("Speech-to-text service unavailable");
        }
    }
    
    private String detectIntent(String text) {
        // Simplified intent detection
        // Fail-safe: Basic pattern matching if NLP service unavailable
        try {
            text = text.toLowerCase();
            if (text.contains("balance") || text.contains("loan")) {
                return "CHECK_BALANCE";
            } else if (text.contains("apply") || text.contains("loan")) {
                return "APPLY_LOAN";
            } else if (text.contains("payment") || text.contains("repay")) {
                return "MAKE_PAYMENT";
            }
            return "UNKNOWN";
        } catch (Exception e) {
            log.error("Intent detection failed: {}", e.getMessage());
            return "UNKNOWN";
        }
    }
}

