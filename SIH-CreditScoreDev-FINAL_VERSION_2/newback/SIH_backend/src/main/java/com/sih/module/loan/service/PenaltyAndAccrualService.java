package com.sih.module.loan.service;

import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.entity.Repayment;
import com.sih.module.loan.repository.LoanRepository;
import com.sih.module.loan.repository.RepaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PenaltyAndAccrualService {

    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final LoanTransactionService transactionService;

    // ⚠️ PRODUCTION: Advance by 1 day for normal operation
    // For testing, you can temporarily increase this value
    private static final int DAYS_TO_ADVANCE = 1; // Production: 1 day
    
    // 🔧 CRON SCHEDULE:
    // Production: Daily at 2 AM: "0 0 2 * * ?"
    // Testing (every minute): "0 * * * * ?"
    @Scheduled(cron = "0 0 2 * * ?") // Production: Daily at 2 AM
    @Transactional
    public void runNightlyJob() {
        log.info("Starting Nightly Penalty and Accrual Job (Advancing {} days)", DAYS_TO_ADVANCE);
        
        // First, log ALL loans to see what we have
        List<Loan> allLoans = loanRepository.findAll();
        log.info("📊 Total loans in database: {}", allLoans.size());
        allLoans.forEach(loan -> 
            log.info("  → Loan {}: status={}, user={}", 
                    loan.getLoanId(), loan.getLoanStatus(), loan.getUser().getUserId())
        );
        
        List<Loan> activeLoans = loanRepository.findByLoanStatus("ACTIVE");
        log.info("✅ Active loans to process: {}", activeLoans.size());
        
        LocalDate today = LocalDate.now();
        LocalDate simulatedDate = today.plusDays(DAYS_TO_ADVANCE);
        
        log.info("Current Date: {}, Simulated Date: {}", today, simulatedDate);

        for (Loan loan : activeLoans) {
            try {
                // Process the loan for each day in the range
                for (int i = 1; i <= DAYS_TO_ADVANCE; i++) {
                    LocalDate processDate = today.plusDays(i);
                    processLoan(loan, processDate);
                }
            } catch (Exception e) {
                log.error("Failed to process loan {}", loan.getLoanId(), e);
            }
        }
        
        log.info("Completed Nightly Job");
    }

    /**
     * Process a single loan for penalty and DPD updates.
     * Can be called after payment to immediately update stats.
     */
    @Transactional
    public void processSingleLoan(Long loanId) {
        log.info("🔄 Processing single loan {} for immediate penalty/DPD update", loanId);
        
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found: " + loanId));
        
        if (!"ACTIVE".equals(loan.getLoanStatus())) {
            log.info("Loan {} is not ACTIVE (status: {}), skipping processing", loanId, loan.getLoanStatus());
            return;
        }
        
        // IMPORTANT: Use the same "simulated date" logic as the cron job
        // If testing with DAYS_TO_ADVANCE = 299, we must process for that future date
        // otherwise DPD will reset to 0 based on "today"
        LocalDate effectiveDate = LocalDate.now().plusDays(DAYS_TO_ADVANCE);
        processLoan(loan, effectiveDate);
        
        log.info("✅ Completed processing for loan {} (Effective Date: {})", loanId, effectiveDate);
    }

    private void processLoan(Loan loan, LocalDate today) {
        log.info("🔍 Processing Loan ID: {} for date: {}", loan.getLoanId(), today);
        
        // Fetch grace period from LoanScheme (default to 0 if not set)
        Integer gracePeriodDays = 0;
        try {
            if (loan.getApplication() != null && loan.getApplication().getScheme() != null) {
                gracePeriodDays = loan.getApplication().getScheme().getGracePeriodDays();
                if (gracePeriodDays == null) {
                    gracePeriodDays = 0;
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch grace period for loan {}, defaulting to 0", loan.getLoanId());
            gracePeriodDays = 0;
        }
        
        log.info("📅 Loan {}: Grace Period = {} days", loan.getLoanId(), gracePeriodDays);
        
        // 1. Get ALL repayments to see what we're working with
        List<Repayment> allRepayments = repaymentRepository.findByLoanLoanId(loan.getLoanId());
        log.info("📋 Loan {}: Total repayments in DB: {}", loan.getLoanId(), allRepayments.size());
        
        // Log first few repayments for debugging
        allRepayments.stream().limit(5).forEach(r -> 
            log.info("  → Repayment: dueDate={}, status={}, amountDue={}, amountPaid={}", 
                    r.getDueDate(), r.getStatus(), r.getAmountDue(), r.getAmountPaid())
        );
        
        final Integer finalGracePeriod = gracePeriodDays;
        
        // 2. Process each repayment for status transitions and penalty calculation
        int maxDpd = 0;
        BigDecimal totalOverdueAmount = BigDecimal.ZERO;
        
        for (Repayment r : allRepayments) {
            // Skip completed/paid/cancelled repayments
            if (java.util.Set.of("COMPLETED", "PAID", "WAIVED", "CANCELLED").contains(r.getStatus())) {
                continue;
            }
            
            LocalDate dueDate = r.getDueDate();
            LocalDate gracePeriodEnd = dueDate.plusDays(finalGracePeriod);
            
            // Status Transitions: PENDING → DUE → OVERDUE
            if (today.isEqual(dueDate) || (today.isAfter(dueDate) && today.isBefore(gracePeriodEnd))) {
                // Due date has arrived but within grace period
                if ("PENDING".equals(r.getStatus())) {
                    r.setStatus("DUE");
                    repaymentRepository.save(r);
                    log.info("  ✓ Repayment {} transitioned to DUE (dueDate: {}, gracePeriod: {} days)", 
                            r.getRepaymentId(), dueDate, finalGracePeriod);
                }
            } else if (today.isAfter(gracePeriodEnd) || today.isEqual(gracePeriodEnd)) {
                // Grace period has expired
                if ("PENDING".equals(r.getStatus()) || "DUE".equals(r.getStatus())) {
                    r.setStatus("OVERDUE");
                    repaymentRepository.save(r);
                    log.info("  ✓ Repayment {} transitioned to OVERDUE (dueDate: {}, gracePeriodEnd: {})", 
                            r.getRepaymentId(), dueDate, gracePeriodEnd);
                }
            }
            
            // 3. Calculate DPD and Penalty for OVERDUE repayments
            if ("OVERDUE".equals(r.getStatus())) {
                // Calculate days overdue from grace period end
                long daysOverdue = ChronoUnit.DAYS.between(gracePeriodEnd, today);
                if (daysOverdue < 0) daysOverdue = 0;
                
                if (daysOverdue > maxDpd) {
                    maxDpd = (int) daysOverdue;
                }
                
                // Calculate overdue amount (amount due - amount paid)
                BigDecimal overdueAmount = r.getAmountDue().subtract(
                        r.getAmountPaid() != null ? r.getAmountPaid() : BigDecimal.ZERO
                );
                totalOverdueAmount = totalOverdueAmount.add(overdueAmount);
                
                // Calculate penalty for THIS repayment based on total days overdue
                // Formula: Overdue Amount × Penal Interest Rate × (Days Overdue / 365)
                // IMPORTANT: Penalty should ACCUMULATE, not be recalculated from scratch
                if (loan.getPenalInterestRate() != null && 
                    loan.getPenalInterestRate().compareTo(BigDecimal.ZERO) > 0 && 
                    overdueAmount.compareTo(BigDecimal.ZERO) > 0 &&
                    daysOverdue > 0) {
                    
                    // Calculate TOTAL penalty that should exist for this many days overdue
                    BigDecimal penalRate = loan.getPenalInterestRate()
                            .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
                    
                    BigDecimal totalPenaltyShouldBe = overdueAmount
                            .multiply(penalRate)
                            .multiply(BigDecimal.valueOf(daysOverdue))
                            .divide(BigDecimal.valueOf(365), 2, RoundingMode.UP); // Round UP to 2 decimals
                    
                    // Get current penalty (might have been partially paid)
                    BigDecimal currentPenalty = r.getPenaltyComponent() != null ? r.getPenaltyComponent() : BigDecimal.ZERO;
                    
                    // Only UPDATE if the calculated penalty is HIGHER (more days passed)
                    // This prevents resetting paid penalties
                    if (totalPenaltyShouldBe.compareTo(currentPenalty) > 0) {
                        r.setPenaltyComponent(totalPenaltyShouldBe);
                        repaymentRepository.save(r);
                        
                        log.info("  💰 Repayment {}: Penalty Increased! Old: ₹{}, New: ₹{} (Days: {}, Overdue Amount: ₹{}, Rate: {}%)", 
                                r.getRepaymentId(), currentPenalty, totalPenaltyShouldBe, 
                                daysOverdue, overdueAmount, loan.getPenalInterestRate());
                    } else {
                        log.debug("  ℹ️ Repayment {}: Penalty unchanged at ₹{} (calculated: ₹{})", 
                                r.getRepaymentId(), currentPenalty, totalPenaltyShouldBe);
                    }
                }
            }
        }

        // 4. Update Loan-level DPD and Risk Bucket
        loan.setDpd(maxDpd);
        log.info("📈 Loan {}: DPD = {}, Total Overdue Amount = ₹{}", loan.getLoanId(), maxDpd, totalOverdueAmount);
        
        // Risk Buckets: CURRENT (0), SMA-0 (1-30), SMA-1 (31-60), SMA-2 (61-90), NPA (90+)
        if (maxDpd == 0) {
            loan.setRiskBucket("CURRENT");
        } else if (maxDpd <= 30) {
            loan.setRiskBucket("SMA_0");
        } else if (maxDpd <= 60) {
            loan.setRiskBucket("SMA_1");
        } else if (maxDpd <= 90) {
            loan.setRiskBucket("SMA_2");
        } else {
            loan.setRiskBucket("NPA");
        }

        log.info("🎯 Loan {}: Risk Bucket = {}", loan.getLoanId(), loan.getRiskBucket());
        
        // 5. Update Loan-level Outstanding Penalty (sum of all repayment penalties)
        BigDecimal totalPenalty = allRepayments.stream()
                .filter(r -> r.getPenaltyComponent() != null)
                .map(Repayment::getPenaltyComponent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        loan.setOutstandingPenalty(totalPenalty);
        loan.setLastAccrualDate(today);
        loanRepository.save(loan);
        
        log.info("✅ Loan {} processing complete", loan.getLoanId());
    }
}
