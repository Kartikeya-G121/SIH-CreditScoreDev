package com.sih.module.voice.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.voice.entity.VoiceInteraction;
import com.sih.module.voice.service.VoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/voice")
@RequiredArgsConstructor
public class VoiceController {
    
    private final VoiceService voiceService;
    
    @PostMapping("/command")
    public ResponseEntity<ApiResponse<VoiceInteraction>> processCommand(
            @AuthenticationPrincipal Long userId,
            @RequestParam("audio") MultipartFile audioFile) {
        try {
            VoiceInteraction interaction = voiceService.processVoiceCommand(
                    userId, audioFile.getBytes(), audioFile.getOriginalFilename());
            return ResponseEntity.ok(ApiResponse.success("Voice command processed", interaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process voice command: " + e.getMessage()));
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<VoiceInteraction>>> getHistory(
            @AuthenticationPrincipal Long userId) {
        List<VoiceInteraction> history = voiceService.getHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
    
    @GetMapping("/supported-languages")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedLanguages() {
        List<String> languages = voiceService.getSupportedLanguages();
        return ResponseEntity.ok(ApiResponse.success(languages));
    }
}

