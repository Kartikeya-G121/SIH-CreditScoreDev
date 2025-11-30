package com.sih.module.scoring.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.scoring.dto.AssessmentResponse;
import com.sih.module.scoring.service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/scoring")
@RequiredArgsConstructor
public class ScoringController {
    
    private final ScoringService scoringService;
    
    @PostMapping("/assess/{applicationId}")
    public ResponseEntity<ApiResponse<AssessmentResponse>> assessApplication(@PathVariable Long applicationId) {
        AssessmentResponse response = scoringService.assessApplication(applicationId);
        return ResponseEntity.ok(ApiResponse.success("Assessment completed", response));
    }
    
    @GetMapping("/assessments/{applicationId}")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessment(@PathVariable Long applicationId) {
        AssessmentResponse response = scoringService.getAssessment(applicationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

