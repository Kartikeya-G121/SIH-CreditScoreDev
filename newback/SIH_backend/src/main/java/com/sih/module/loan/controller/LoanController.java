package com.sih.module.loan.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.loan.dto.LoanResponse;
import com.sih.module.loan.dto.PaymentRequest;
import com.sih.module.loan.entity.Repayment;
import com.sih.module.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanResponse>>> getMyLoans(
            @AuthenticationPrincipal Long userId) {
        List<LoanResponse> loans = loanService.getMyLoans(userId);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<LoanResponse>>> getActiveLoans(
            @AuthenticationPrincipal Long userId) {
        List<LoanResponse> loans = loanService.getActiveLoans(userId);
        return ResponseEntity.ok(ApiResponse.success(loans));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoanById(@PathVariable Long id) {
        LoanResponse response = loanService.getLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<List<Repayment>>> getSchedule(@PathVariable Long id) {
        List<Repayment> schedule = loanService.getRepaymentSchedule(id);
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }

    @GetMapping("/{id}/projected-schedule")
    public ResponseEntity<ApiResponse<List<com.sih.module.loan.dto.RepaymentScheduleDTO>>> getProjectedSchedule(
            @PathVariable Long id) {
        List<com.sih.module.loan.dto.RepaymentScheduleDTO> schedule = loanService.getProjectedSchedule(id);
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }

    @PostMapping("/{id}/repay")
    public ResponseEntity<ApiResponse<Object>> makeRepayment(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PaymentRequest request) {
        loanService.makeRepayment(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Repayment recorded successfully"));
    }

    @GetMapping("/{id}/payoff-amount")
    public ResponseEntity<ApiResponse<BigDecimal>> getPayoffAmount(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        BigDecimal payoffAmount = loanService.calculatePayoffAmount(id, userId);
        return ResponseEntity.ok(ApiResponse.success(payoffAmount));
    }

    @PostMapping("/{id}/foreclose")
    public ResponseEntity<ApiResponse<Object>> forecloseLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        loanService.forecloseLoan(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Loan foreclosed"));
    }

    @PreAuthorize("hasRole('OFFICER') or hasRole('ADMIN')")
    @PostMapping("/{id}/waive-off")
    public ResponseEntity<ApiResponse<Object>> waiveOffLoan(@PathVariable Long id) {
        loanService.waiveOffLoan(id);
        return ResponseEntity.ok(ApiResponse.success("Loan waived off"));
    }

    @PreAuthorize("hasRole('OFFICER') or hasRole('ADMIN')")
    @PostMapping("/check-defaults")
    public ResponseEntity<ApiResponse<Object>> triggerDefaultCheck() {
        loanService.checkDefaults();
        return ResponseEntity.ok(ApiResponse.success("Default check triggered successfully"));
    }
}
