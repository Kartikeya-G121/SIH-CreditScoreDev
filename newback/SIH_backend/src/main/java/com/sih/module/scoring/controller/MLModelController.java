package com.sih.module.scoring.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.scoring.entity.MLModel;
import com.sih.module.scoring.service.MLModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for ML Model Management
 * Handles Flask API integration, model versioning, and admin operations
 */
@RestController
@RequestMapping("/api/v1/ml-models")
@RequiredArgsConstructor
public class MLModelController {

    private final MLModelService mlModelService;

    // ============ Database Model Management ============

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MLModel>>> getAllModels() {
        return ResponseEntity.ok(ApiResponse.success(mlModelService.getAllModels()));
    }

    @PostMapping("/{modelId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateModel(@PathVariable Long modelId) {
        mlModelService.activateModel(modelId);
        return ResponseEntity.ok(ApiResponse.success("Model activated successfully", null));
    }

    @PostMapping("/retrain")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> triggerRetraining() {
        mlModelService.triggerRetraining();
        return ResponseEntity.ok(ApiResponse.success("Retraining triggered successfully", null));
    }

    // ============ Flask API Management ============

    @GetMapping("/flask/info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFlaskModelInfo() {
        Map<String, Object> info = mlModelService.getFlaskModelInfo();
        return ResponseEntity.ok(ApiResponse.success("Flask model info retrieved", info));
    }

    @GetMapping("/flask/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkFlaskHealth() {
        Map<String, Boolean> health = mlModelService.getFlaskHealthStatus();
        return ResponseEntity.ok(ApiResponse.success("Flask health status retrieved", health));
    }

    @PostMapping("/flask/risk/switch/{version}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> switchRiskVersion(@PathVariable String version) {
        boolean success = mlModelService.switchRiskModelVersion(version);
        if (success) {
            return ResponseEntity.ok(ApiResponse.success("Switched Risk Model to version " + version, null));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to switch Risk Model version"));
        }
    }

    @PostMapping("/flask/income/switch/{version}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> switchIncomeVersion(@PathVariable String version) {
        boolean success = mlModelService.switchIncomeModelVersion(version);
        if (success) {
            return ResponseEntity.ok(ApiResponse.success("Switched Income Model to version " + version, null));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to switch Income Model version"));
        }
    }
}
