package com.sih.module.loan.controller;

import com.sih.module.loan.dto.PortfolioAnalyticsDTO;
import com.sih.module.loan.service.LoanAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/loans/analytics")
@RequiredArgsConstructor
public class LoanAnalyticsController {

    private final LoanAnalyticsService loanAnalyticsService;

    @GetMapping("/portfolio")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'OFFICER')")
    public ResponseEntity<PortfolioAnalyticsDTO> getPortfolioAnalytics() {
        return ResponseEntity.ok(loanAnalyticsService.getPortfolioAnalytics());
    }

    @PostMapping("/refresh-cache")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'OFFICER')")
    public ResponseEntity<Void> refreshCache() {
        loanAnalyticsService.refreshAnalyticsCache();
        return ResponseEntity.ok().build();
    }
}
