package com.sih.module.loan.service;

import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.entity.LoanTransaction;
import com.sih.module.loan.repository.LoanTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanTransactionService {

    private final LoanTransactionRepository transactionRepository;

    @Transactional
    public void logTransaction(Loan loan, String txnType, BigDecimal amount,
                               BigDecimal principal, BigDecimal interest, BigDecimal penalty, BigDecimal charges,
                               String paymentMode, String externalRef, LocalDate valueDate) {
        
        LoanTransaction txn = LoanTransaction.builder()
                .loan(loan)
                .txnType(txnType)
                .amount(amount)
                .principalComponent(principal)
                .interestComponent(interest)
                .penaltyComponent(penalty)
                .chargesComponent(charges)
                .paymentMode(paymentMode)
                .externalRef(externalRef)
                .valueDate(valueDate)
                .build();

        transactionRepository.save(txn);
        log.info("Logged transaction for Loan {}: Type={}, Amount={}", loan.getLoanId(), txnType, amount);
    }
}
