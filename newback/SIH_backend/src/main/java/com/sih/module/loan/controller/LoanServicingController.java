package com.sih.module.loan.controller;

import com.sih.common.dto.ApiResponse;
import com.sih.module.loan.dto.*;
import com.sih.module.loan.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanServicingController {

    private final LoanRepaymentService repaymentService;
    private final LoanTransactionService transactionService;
    private final RepaymentScheduleService scheduleService;
    private final PenaltyAndAccrualService penaltyAndAccrualService;
    private final com.sih.module.loan.repository.LoanTransactionRepository transactionRepository;

    @GetMapping("/{id}/transactions")
    public ResponseEntity<ApiResponse<List<LoanTransactionDTO>>> getTransactions(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId) {
        // TODO: Verify user ownership or role logic here or in service layer
        List<LoanTransactionDTO> txns = transactionRepository.findByLoanLoanIdOrderByValueDateDesc(id)
                .stream()
                .map(t -> LoanTransactionDTO.builder()
                        .transactionId(t.getTransactionId())
                        .loanId(t.getLoan().getLoanId())
                        .txnType(t.getTxnType())
                        .amount(t.getAmount())
                        .principalComponent(t.getPrincipalComponent())
                        .interestComponent(t.getInterestComponent())
                        .penaltyComponent(t.getPenaltyComponent())
                        .chargesComponent(t.getChargesComponent())
                        .paymentMode(t.getPaymentMode())
                        .externalRef(t.getExternalRef())
                        .valueDate(t.getValueDate())
                        .createdAt(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(txns));
    }

    @PostMapping("/{id}/payments/pay-emi")
    public ResponseEntity<ApiResponse<String>> payEmi(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PaymentRequest request) {
        repaymentService.processEmiPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success("EMI Payment Processed"));
    }

    @PostMapping("/{id}/payments/pay-overdue")
    public ResponseEntity<ApiResponse<String>> payOverdue(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PaymentRequest request) {
        repaymentService.processEmiPayment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Overdue Payment Processed"));
    }

    @PostMapping("/{id}/payments/prepay")
    public ResponseEntity<ApiResponse<String>> prepayLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PaymentRequest request) {
        repaymentService.processPrepayment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Prepayment Processed"));
    }

    @PostMapping("/{id}/payments/foreclose")
    public ResponseEntity<ApiResponse<String>> forecloseLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PaymentRequest request) {
        repaymentService.processForeclosure(id, request);
        return ResponseEntity.ok(ApiResponse.success("Loan Foreclosed Successfully"));
    }

    @GetMapping("/{id}/foreclosure-amount")
    public ResponseEntity<ApiResponse<BigDecimal>> getForeclosureAmount(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(repaymentService.calculateForeclosureAmount(id)));
    }

    @PostMapping("/admin/run-nightly-job")
    public ResponseEntity<ApiResponse<String>> runNightlyJob() {
        penaltyAndAccrualService.runNightlyJob();
        return ResponseEntity.ok(ApiResponse.success("Nightly job executed successfully"));
    }
}
