package com.sih.module.loan.service;

import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.repository.LoanRepository;
import com.sih.module.scheme.entity.LoanScheme;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanAccountService {

    private final LoanRepository loanRepository;
    private final LoanApplicationRepository applicationRepository;
    private final LoanTransactionService transactionService;
    private final RepaymentScheduleService scheduleService;

    @Transactional
    public Loan createLoanFromSanctionedApplication(Long applicationId) {
        LoanApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!"SANCTIONED".equals(app.getStatus())) {
            throw new BadRequestException("Application must be SANCTIONED to create a loan");
        }

        if (loanRepository.existsByApplicationApplicationId(applicationId)) {
            // Already created
             return loanRepository.findByApplicationApplicationId(applicationId)
                     .orElseThrow(() -> new ResourceNotFoundException("Loan not found (unexpected)"));
        }

        LoanScheme scheme = app.getScheme();
        BigDecimal sanctionedAmount = app.getSanctionedAmount();
        Integer tenureMonths = app.getTenureMonths();
        BigDecimal interestRate = app.getFinalInterestRate();

        // 1. Calculate EMI
        BigDecimal monthlyEmi = scheduleService.calculateEMI(sanctionedAmount, interestRate, tenureMonths);
        BigDecimal totalInterest = monthlyEmi.multiply(BigDecimal.valueOf(tenureMonths)).subtract(sanctionedAmount);

        // 2. Prepare Loan Entity
        Loan loan = Loan.builder()
                .application(app)
                .user(app.getUser())
                .group(app.getGroup())
                .isGroupLoan(app.getGroup() != null)
                .totalPrincipal(sanctionedAmount)
                .totalInterest(totalInterest)
                .monthlyEmi(monthlyEmi)
                .interestRate(interestRate)
                .originalTenureMonths(tenureMonths) 
                .remainingTenure(tenureMonths)
                .loanStatus("ACTIVE")
                // Servicing Fields
                .disbursedAmount(sanctionedAmount)
                .disbursementDate(LocalDate.now())
                .outstandingPrincipal(sanctionedAmount)
                .outstandingInterest(BigDecimal.ZERO)
                .outstandingPenalty(BigDecimal.ZERO)
                .dpd(0)
                .riskBucket("CURRENT")
                .penalInterestRate(scheme != null && scheme.getPenaltyRate() != null ? scheme.getPenaltyRate() : BigDecimal.valueOf(2.0)) // Default 2%
                .prepaymentPenaltyRate(scheme != null && scheme.getPrepaymentPenalty() != null ? scheme.getPrepaymentPenalty() : BigDecimal.ZERO)
                .foreclosureAllowed(scheme == null || scheme.getAllowPrepayment())
                .foreclosurePenaltyRate(scheme != null && scheme.getPrepaymentPenalty() != null ? scheme.getPrepaymentPenalty() : BigDecimal.ZERO)
                .startDate(LocalDate.now())
                .lastAccrualDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(tenureMonths))
                .nextPaymentDate(LocalDate.now().plusMonths(1))
                .accumulatedInterest(BigDecimal.ZERO)
                .build();

        loan = loanRepository.save(loan);

        // 3. Log Disbursement Transaction
        transactionService.logTransaction(
                loan, "DISBURSEMENT", sanctionedAmount,
                sanctionedAmount, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                "SYSTEM", "DISB-" + loan.getLoanId(), LocalDate.now()
        );

        // 4. Generate Schedule
        scheduleService.generateInitialSchedule(loan);

        log.info("Loan Account {} created successfully from Application {}", loan.getLoanId(), applicationId);
        return loan;
    }
}
