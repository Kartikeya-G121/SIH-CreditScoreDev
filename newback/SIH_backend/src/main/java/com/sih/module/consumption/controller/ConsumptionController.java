package com.sih.module.consumption.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.consumption.dto.*;
import com.sih.module.consumption.service.ConsumptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/consumption")
@RequiredArgsConstructor
@Slf4j
public class ConsumptionController {

    private final ConsumptionService consumptionService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ConsumptionEntryResponse>> uploadEntry(
            @AuthenticationPrincipal Long userId,
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute ConsumptionEntryRequest request) {
        try {
            ConsumptionEntryResponse response = consumptionService.uploadEntry(
                    userId, request, file.getBytes(), file.getOriginalFilename());
            return ResponseEntity.ok(ApiResponse.success("Entry uploaded successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to upload entry: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-batch")
    public ResponseEntity<ApiResponse<List<ConsumptionEntryResponse>>> uploadBatch(
            @AuthenticationPrincipal Long userId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("dataSource") String dataSource,
            @RequestParam("amounts") BigDecimal[] amounts,
            @RequestParam("dates") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate[] dates) {
        try {
            // Validate arrays have same length
            if (files.length != amounts.length || files.length != dates.length) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Files, amounts, and dates must have the same count"));
            }

            List<ConsumptionEntryResponse> responses = consumptionService.uploadBatch(
                    userId, files, dataSource, amounts, dates);
            return ResponseEntity.ok(ApiResponse.success("Batch upload successful", responses));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to upload batch: " + e.getMessage()));
        }
    }

    @PostMapping("/sync/offline-data")
    public ResponseEntity<ApiResponse<List<ConsumptionEntryResponse>>> syncOfflineData(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody OfflineBatchRequest request) {
        List<ConsumptionEntryResponse> responses = consumptionService.syncOfflineData(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Offline data synced successfully", responses));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConsumptionEntryResponse>>> getMyEntries(
            @AuthenticationPrincipal Long userId) {
        List<ConsumptionEntryResponse> entries = consumptionService.getMyEntries(userId);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConsumptionEntryResponse>> getEntryById(@PathVariable Long id) {
        ConsumptionEntryResponse response = consumptionService.getEntryById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteEntry(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        consumptionService.deleteEntry(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Entry deleted successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ConsumptionSummaryResponse>> getSummary(
            @AuthenticationPrincipal Long userId) {
        ConsumptionSummaryResponse summary = consumptionService.getSummary(userId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<ConsumptionEntryResponse>> verifyEntry(
            @PathVariable Long id,
            @AuthenticationPrincipal Long officerId,
            @RequestParam boolean verified) {
        ConsumptionEntryResponse response = consumptionService.verifyEntry(id, officerId, verified);
        return ResponseEntity.ok(ApiResponse.success("Entry verified", response));
    }

    @GetMapping("/admin/search")
    public ResponseEntity<ApiResponse<List<ConsumptionEntryResponse>>> searchEntries(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String dataSource,
            @RequestParam(required = false) String status) {
        List<ConsumptionEntryResponse> entries = consumptionService.searchEntries(userId, dataSource, status);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ConsumptionEntryResponse>>> getConsumptionHistory(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate) {

        if (startDate == null) {
            startDate = java.time.LocalDate.now().minusMonths(6);
        }
        if (endDate == null) {
            endDate = java.time.LocalDate.now();
        }

        List<ConsumptionEntryResponse> entries = consumptionService.getConsumptionHistory(userId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(entries));
    }
}
