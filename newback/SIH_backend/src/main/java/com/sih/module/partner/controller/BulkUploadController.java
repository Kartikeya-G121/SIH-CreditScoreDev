package com.sih.module.partner.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.beneficiary.dto.BeneficiaryDataDTO;
import com.sih.module.beneficiary.service.BeneficiaryBulkService;
import com.sih.module.partner.dto.BulkUploadResult;
import com.sih.module.partner.service.CsvParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/partner/beneficiaries")
@RequiredArgsConstructor
@Slf4j
public class BulkUploadController {

    private final CsvParserService csvParserService;
    private final BeneficiaryBulkService beneficiaryBulkService;

    @PostMapping("/bulk-upload")
    @PreAuthorize("hasAnyRole('CHANNEL_PARTNER', 'ADMIN')") // TODO: Re-enable
    public ResponseEntity<ApiResponse<BulkUploadResult>> bulkUploadBeneficiaries(
            @RequestParam("files") MultipartFile[] files) {

        try {
            log.info("Received bulk upload request with {} files", files.length);

            // Parse CSV files
            List<BeneficiaryDataDTO> data = csvParserService.parseCSVFiles(files);
            log.info("Parsed {} rows from CSV files", data.size());

            // Process data
            BulkUploadResult result = beneficiaryBulkService.bulkCreateOrUpdateBeneficiaries(data);

            String message = String.format("Processed %d rows: %d users created, %d profiles updated, %d failed",
                    result.getTotalRows(), result.getUsersCreated(),
                    result.getProfilesUpdated(), result.getFailedRows());

            return ResponseEntity.ok(ApiResponse.success(message, result));

        } catch (Exception e) {
            log.error("Error during bulk upload", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Bulk upload failed: " + e.getMessage()));
        }
    }
}
