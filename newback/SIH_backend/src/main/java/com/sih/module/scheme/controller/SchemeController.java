package com.sih.module.scheme.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.scheme.dto.*;
import com.sih.module.scheme.service.SchemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/schemes")
@RequiredArgsConstructor
public class SchemeController {

    private final SchemeService schemeService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SchemeResponse>> createScheme(
            @Valid @RequestBody SchemeRequest request) {
        SchemeResponse response = schemeService.createScheme(request);
        return ResponseEntity.ok(ApiResponse.success("Scheme created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SchemeResponse>>> getActiveSchemes() {
        List<SchemeResponse> schemes = schemeService.getActiveSchemes();
        return ResponseEntity.ok(ApiResponse.success(schemes));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SchemeResponse>>> getAllSchemes() {
        List<SchemeResponse> schemes = schemeService.getAllSchemes();
        return ResponseEntity.ok(ApiResponse.success(schemes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SchemeResponse>> getSchemeById(@PathVariable Integer id) {
        SchemeResponse response = schemeService.getSchemeById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SchemeResponse>> updateScheme(
            @PathVariable Integer id,
            @Valid @RequestBody SchemeRequest request) {
        SchemeResponse response = schemeService.updateScheme(id, request);
        return ResponseEntity.ok(ApiResponse.success("Scheme updated successfully", response));
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SchemeResponse>> toggleScheme(@PathVariable Integer id) {
        SchemeResponse response = schemeService.toggleScheme(id);
        return ResponseEntity.ok(ApiResponse.success("Scheme toggled", response));
    }
}
