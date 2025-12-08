package com.sih.module.loan.controller;

import com.sih.module.loan.dto.PortfolioAnalyticsDTO;
import com.sih.module.loan.service.LoanAnalyticsService;
import com.sih.module.partner.repository.ChannelPartnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final ChannelPartnerRepository partnerRepository;

    @GetMapping("/portfolio")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'OFFICER', 'CHANNEL_PARTNER')")
    public ResponseEntity<PortfolioAnalyticsDTO> getPortfolioAnalytics() {
        String providerName = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CHANNEL_PARTNER"))) {
            providerName = partnerRepository.findByLoginEmail(auth.getName())
                    .map(p -> p.getOrganizationName())
                    .orElse(null);
        }

        return ResponseEntity.ok(loanAnalyticsService.getPortfolioAnalytics(providerName));
    }

    @PostMapping("/refresh-cache")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'ADMIN', 'OFFICER', 'CHANNEL_PARTNER')")
    public ResponseEntity<Void> refreshCache() {
        loanAnalyticsService.refreshAnalyticsCache();
        return ResponseEntity.ok().build();
    }
}
