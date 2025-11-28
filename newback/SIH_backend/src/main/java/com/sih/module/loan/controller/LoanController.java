package com.sih.module.loan.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.loan.dto.LoanResponse;
import com.sih.module.loan.dto.PaymentRequest;
import com.sih.module.loan.entity.Repayment;
import com.sih.module.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
    
    @PostMapping("/{id}/repay")
    public ResponseEntity<ApiResponse<Object>> makeRepayment(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PaymentRequest request) {
        loanService.makeRepayment(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Repayment recorded successfully"));
    }
    
    @PostMapping("/{id}/foreclose")
    public ResponseEntity<ApiResponse<Object>> forecloseLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        loanService.forecloseLoan(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Loan foreclosed"));
    }
    
    @PostMapping("/{id}/waive-off")
    public ResponseEntity<ApiResponse<Object>> waiveOffLoan(@PathVariable Long id) {
        loanService.waiveOffLoan(id);
        return ResponseEntity.ok(ApiResponse.success("Loan waived off"));
    }
}

