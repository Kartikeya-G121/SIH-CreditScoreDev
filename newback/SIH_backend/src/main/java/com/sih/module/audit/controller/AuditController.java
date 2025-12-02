package com.sih.module.audit.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.audit.entity.AuditLog;
import com.sih.module.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {
    
    private final AuditService auditService;
    
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> searchLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        List<AuditLog> logs = auditService.searchLogs(userId, actionType, entityType, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
    
    @GetMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<AuditLog>> getLogById(@PathVariable Long id) {
        AuditLog log = auditService.getLogById(id);
        return ResponseEntity.ok(ApiResponse.success(log));
    }
}

