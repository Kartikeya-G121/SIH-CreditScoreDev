package com.sih.module.loan.service;

import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.loan.dto.PaymentRequest;
import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.entity.Repayment;
import com.sih.module.loan.repository.LoanRepository;
import com.sih.module.loan.repository.RepaymentRepository;
import com.sih.module.scoring.service.ScoringEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanRepaymentService {

    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final LoanTransactionService transactionService;
    private final PenaltyAndAccrualService penaltyAndAccrualService;
    private final RepaymentScheduleService scheduleService;
    private final ScoringEngineService scoringEngineService;

    // --- PAY EMI / OVERDUE ---

    @Transactional
    public void processEmiPayment(Long loanId, PaymentRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        validateActive(loan);

        // 1. Find the earliest PENDING or OVERDUE or DUE repayment
        List<Repayment> schedule = repaymentRepository.findByLoanLoanId(loanId).stream()
                .sorted(Comparator.comparing(Repayment::getDueDate))
                .collect(Collectors.toList());

        Repayment target = schedule.stream()
                .filter(r -> "PENDING".equals(r.getStatus()) || "DUE".equals(r.getStatus()) || "OVERDUE".equals(r.getStatus()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No pending EMI found. Loan might be fully paid."));

        // Validation: Payment Amount should match Amount Due + Penalty
        BigDecimal totalDue = target.getAmountDue().add(target.getPenaltyComponent());
        if (request.getAmount().compareTo(totalDue) < 0) {
            throw new BadRequestException("Payment amount mismatch. Due: " + totalDue);
        }

        // 2. Allocation
        BigDecimal amount = request.getAmount();
        BigDecimal penaltyPaid = BigDecimal.ZERO;
        BigDecimal interestPaid = BigDecimal.ZERO;
        BigDecimal principalPaid = BigDecimal.ZERO;

        // Pay Penalty first
        if (target.getPenaltyComponent().compareTo(BigDecimal.ZERO) > 0) {
            if (amount.compareTo(target.getPenaltyComponent()) >= 0) {
                penaltyPaid = target.getPenaltyComponent();
                amount = amount.subtract(penaltyPaid);
            } else {
                 penaltyPaid = amount;
                 amount = BigDecimal.ZERO;
            }
        }

        // Pay Interest next
        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            if (amount.compareTo(target.getInterestComponent()) >= 0) {
                interestPaid = target.getInterestComponent();
                amount = amount.subtract(interestPaid);
            } else {
                interestPaid = amount;
                amount = BigDecimal.ZERO;
            }
        }

        // Pay Principal last
        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            principalPaid = amount;
        }

        // 3. Update Repayment
        target.setAmountPaid(request.getAmount().setScale(2, RoundingMode.UP)); // Round UP to 2 decimals
        target.setPaidDate(LocalDate.now());
        target.setStatus("COMPLETED");
        
        // CRITICAL: Reduce the penalty component by what was paid
        // This prevents the cron job from recalculating based on the full penalty
        BigDecimal remainingPenalty = target.getPenaltyComponent().subtract(penaltyPaid);
        if (remainingPenalty.compareTo(BigDecimal.ZERO) < 0) {
            remainingPenalty = BigDecimal.ZERO;
        }
        target.setPenaltyComponent(remainingPenalty);
        
        target.setIsOnTime(LocalDate.now().isBefore(target.getDueDate().plusDays(1)));
        if (!target.getIsOnTime()) {
            target.setDelayDays((int) ChronoUnit.DAYS.between(target.getDueDate(), LocalDate.now()));
        }

        // 4. Update Loan Outstanding
        loan.setOutstandingPrincipal(loan.getOutstandingPrincipal().subtract(principalPaid));
        loan.setOutstandingPenalty(loan.getOutstandingPenalty().subtract(penaltyPaid));
        loan.setOutstandingInterest(loan.getOutstandingInterest().subtract(interestPaid));
        
        // IMPORTANT: Save the target repayment FIRST so its status is updated in DB
        repaymentRepository.save(target);
        
        // 5. Recalculate DPD and Risk Bucket based on REMAINING overdue EMIs
        // Get grace period from LoanScheme
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
        }
        
        // Fetch FRESH schedule from DB to get updated statuses
        List<Repayment> freshSchedule = repaymentRepository.findByLoanLoanId(loanId);
        
        // Find remaining overdue repayments (now with updated statuses)
        List<Repayment> remainingOverdue = freshSchedule.stream()
                .filter(r -> "OVERDUE".equals(r.getStatus()))
                .collect(Collectors.toList());
        
        log.info("Loan {}: After payment, found {} remaining overdue EMIs", loan.getLoanId(), remainingOverdue.size());
        
        if (remainingOverdue.isEmpty()) {
            // No more overdue EMIs - reset to CURRENT
            loan.setRiskBucket("CURRENT");
            loan.setDpd(0);
            
            // If loan was OVERDUE, set back to ACTIVE
            if ("OVERDUE".equals(loan.getLoanStatus())) {
                loan.setLoanStatus("ACTIVE");
            }
            
            log.info("Loan {}: All overdue EMIs cleared. Status reset to CURRENT, DPD = 0", loan.getLoanId());
        } else {
            // Calculate DPD from the earliest remaining overdue EMI
            LocalDate earliestOverdueDate = remainingOverdue.stream()
                    .map(Repayment::getDueDate)
                    .min(LocalDate::compareTo)
                    .orElse(LocalDate.now());
            
            // Calculate DPD from grace period end
            LocalDate gracePeriodEnd = earliestOverdueDate.plusDays(gracePeriodDays);
            long daysOverdue = ChronoUnit.DAYS.between(gracePeriodEnd, LocalDate.now());
            if (daysOverdue < 0) daysOverdue = 0;
            
            loan.setDpd((int) daysOverdue);
            
            // Update Risk Bucket
            if (daysOverdue == 0) {
                loan.setRiskBucket("CURRENT");
            } else if (daysOverdue <= 30) {
                loan.setRiskBucket("SMA_0");
            } else if (daysOverdue <= 60) {
                loan.setRiskBucket("SMA_1");
            } else if (daysOverdue <= 90) {
                loan.setRiskBucket("SMA_2");
            } else {
                loan.setRiskBucket("NPA");
            }
            
            log.info("Loan {}: Recalculated DPD = {}, Risk Bucket = {} (Remaining overdue EMIs: {})", 
                    loan.getLoanId(), loan.getDpd(), loan.getRiskBucket(), remainingOverdue.size());
        }

        loanRepository.save(loan);

        // 6. Log Transaction
        transactionService.logTransaction(
                loan, "EMI_PAYMENT", request.getAmount(),
                principalPaid, interestPaid, penaltyPaid, BigDecimal.ZERO,
                request.getMode(), request.getTransactionRef(), LocalDate.now()
        );
        
        // 7. IMMEDIATELY update penalty and DPD stats for this loan
        // This ensures the UI shows updated values without waiting for cron job
        try {
            penaltyAndAccrualService.processSingleLoan(loanId);
            log.info("✅ Loan {}: Penalty/DPD stats updated immediately after payment", loanId);
        } catch (Exception e) {
            log.warn("Failed to update penalty/DPD stats for loan {} after payment: {}", loanId, e.getMessage());
            // Don't fail the payment if stats update fails
        }
        // 8. Trigger Risk Score Recalculation
        if (loan.getApplication() != null) {
            java.util.concurrent.CompletableFuture.runAsync(() -> 
                scoringEngineService.calculateScore(loan.getApplication().getApplicationId())
            );
        }
    }

    // --- PREPAYMENT (Reduce Tenure - Pay from Back) ---

    @Transactional
    public void processPrepayment(Long loanId, PaymentRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        validateActive(loan);

        BigDecimal prepaidAmount = request.getAmount();
        
        // Track actual principal and interest paid
        BigDecimal totalPrincipalPaid = BigDecimal.ZERO;
        BigDecimal totalInterestPaid = BigDecimal.ZERO;
        BigDecimal totalPenaltyPaid = BigDecimal.ZERO;
        
        BigDecimal remainingAmount = prepaidAmount;

        // 1. Fetch Pending Repayments & Sort Descending (Newest/Furthest First)
        // Filter out completed/paid repayments
        List<Repayment> pendingRepayments = repaymentRepository.findByLoanLoanId(loanId).stream()
                .filter(r -> !java.util.Set.of("COMPLETED", "PAID", "WAIVED", "CANCELLED").contains(r.getStatus()))
                .sorted(Comparator.comparing(Repayment::getDueDate).reversed()) // Furthest Date First
                .collect(Collectors.toList());

        // 2. Allocate prepayment to EMIs from the back
        for (Repayment emi : pendingRepayments) {
            if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal totalDueForEmi = emi.getAmountDue().add(emi.getPenaltyComponent());
            
            if (remainingAmount.compareTo(totalDueForEmi) >= 0) {
                // Full Coverage - Pay entire EMI
                remainingAmount = remainingAmount.subtract(totalDueForEmi);
                
                // Track components
                totalPrincipalPaid = totalPrincipalPaid.add(emi.getPrincipalComponent());
                totalInterestPaid = totalInterestPaid.add(emi.getInterestComponent());
                totalPenaltyPaid = totalPenaltyPaid.add(emi.getPenaltyComponent());
                
                emi.setAmountPaid(totalDueForEmi);
                emi.setPaidDate(LocalDate.now());
                emi.setStatus("COMPLETED");
                emi.setPaymentMode(request.getMode());
                emi.setTransactionRef(request.getTransactionRef());
                emi.setIsOnTime(true); // Prepayment is always on time
                
                repaymentRepository.save(emi);
            } else {
                // Partial Coverage - Reduce this EMI proportionally
                // Calculate what portion of the EMI is being paid
                BigDecimal paymentRatio = remainingAmount.divide(totalDueForEmi, 10, RoundingMode.HALF_UP);
                
                BigDecimal principalPortion = emi.getPrincipalComponent().multiply(paymentRatio).setScale(2, RoundingMode.HALF_UP);
                BigDecimal interestPortion = emi.getInterestComponent().multiply(paymentRatio).setScale(2, RoundingMode.HALF_UP);
                BigDecimal penaltyPortion = emi.getPenaltyComponent().multiply(paymentRatio).setScale(2, RoundingMode.HALF_UP);
                
                // Track components
                totalPrincipalPaid = totalPrincipalPaid.add(principalPortion);
                totalInterestPaid = totalInterestPaid.add(interestPortion);
                totalPenaltyPaid = totalPenaltyPaid.add(penaltyPortion);
                
                // Reduce the EMI components
                emi.setPrincipalComponent(emi.getPrincipalComponent().subtract(principalPortion));
                emi.setInterestComponent(emi.getInterestComponent().subtract(interestPortion));
                emi.setPenaltyComponent(emi.getPenaltyComponent().subtract(penaltyPortion));
                emi.setAmountDue(emi.getPrincipalComponent().add(emi.getInterestComponent()));
                
                repaymentRepository.save(emi);
                remainingAmount = BigDecimal.ZERO;
            }
        }

        // 3. Update Loan Outstanding - ONLY deduct the PRINCIPAL component
        loan.setOutstandingPrincipal(loan.getOutstandingPrincipal().subtract(totalPrincipalPaid));
        if (loan.getOutstandingPrincipal().compareTo(BigDecimal.ZERO) < 0) {
            loan.setOutstandingPrincipal(BigDecimal.ZERO);
        }
        
        // Update outstanding interest (if tracked at loan level)
        if (loan.getOutstandingInterest() != null) {
            loan.setOutstandingInterest(loan.getOutstandingInterest().subtract(totalInterestPaid));
            if (loan.getOutstandingInterest().compareTo(BigDecimal.ZERO) < 0) {
                loan.setOutstandingInterest(BigDecimal.ZERO);
            }
        }
        
        // Update outstanding penalty
        loan.setOutstandingPenalty(loan.getOutstandingPenalty().subtract(totalPenaltyPaid));
        if (loan.getOutstandingPenalty().compareTo(BigDecimal.ZERO) < 0) {
            loan.setOutstandingPenalty(BigDecimal.ZERO);
        }
        
        // Check if loan is fully paid
        if (loan.getOutstandingPrincipal().compareTo(BigDecimal.ZERO) == 0) {
            loan.setLoanStatus("CLOSED");
            loan.setRemainingTenure(0);
            loan.setNextPaymentDate(null);
        } else {
            // Update remaining tenure based on remaining unpaid EMIs
            long remainingEmis = repaymentRepository.findByLoanLoanId(loanId).stream()
                    .filter(r -> !java.util.Set.of("COMPLETED", "PAID", "WAIVED", "CANCELLED").contains(r.getStatus()))
                    .count();
            loan.setRemainingTenure((int) remainingEmis);
        }
        
        loanRepository.save(loan);
        
        // 4. Log Transaction with correct component breakdown
        transactionService.logTransaction(
                loan, "PREPAYMENT", prepaidAmount,
                totalPrincipalPaid, totalInterestPaid, totalPenaltyPaid, BigDecimal.ZERO,
                request.getMode(), request.getTransactionRef(), LocalDate.now()
        );
        
        log.info("Processed Prepayment of {} for Loan {}. Principal: {}, Interest: {}, Penalty: {}, Tenure reduced to: {}", 
                prepaidAmount, loanId, totalPrincipalPaid, totalInterestPaid, totalPenaltyPaid, loan.getRemainingTenure());
    }

    // --- FORECLOSURE ---

    @Transactional
    public void processForeclosure(Long loanId, PaymentRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        validateActive(loan);
        
        // Validate Amount Matches Total Payoff
        BigDecimal payoff = calculateForeclosureAmount(loanId);
        if (request.getAmount().compareTo(payoff) < 0) {
             throw new BadRequestException("Insufficient amount for foreclosure. Required: " + payoff);
        }

        // Components
        BigDecimal principal = loan.getOutstandingPrincipal();
        BigDecimal penalty = loan.getOutstandingPenalty();
        BigDecimal interest = loan.getAccumulatedInterest(); // + current month accrual logic ideally
        BigDecimal foreclosureCharge = BigDecimal.ZERO;
        
        if (loan.getForeclosurePenaltyRate() != null) {
            foreclosureCharge = principal.multiply(loan.getForeclosurePenaltyRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        
        // Log Transaction
        transactionService.logTransaction(
                loan, "FORECLOSURE_PAYMENT", request.getAmount(),
                principal, interest, penalty, foreclosureCharge,
                request.getMode(), request.getTransactionRef(), LocalDate.now()
        );

        // Close Loan
        loan.setOutstandingPrincipal(BigDecimal.ZERO);
        loan.setOutstandingInterest(BigDecimal.ZERO);
        loan.setOutstandingPenalty(BigDecimal.ZERO);
        loan.setAccumulatedInterest(BigDecimal.ZERO);
        loan.setLoanStatus("FORECLOSED");
        loan.setRemainingTenure(0);
        loan.setNextPaymentDate(null);
        
        loanRepository.save(loan);
        
        // Cancel future repayments
        List<Repayment> future = repaymentRepository.findByLoanLoanId(loanId).stream()
                 .filter(r -> "PENDING".equals(r.getStatus()) || "DUE".equals(r.getStatus()))
                 .collect(Collectors.toList());
        future.forEach(r -> r.setStatus("CANCELLED"));
        repaymentRepository.saveAll(future);
    }

    public BigDecimal calculateForeclosureAmount(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        
        BigDecimal principal = loan.getOutstandingPrincipal();
        BigDecimal penalty = loan.getOutstandingPenalty();
        BigDecimal interest = loan.getAccumulatedInterest(); 
        
        BigDecimal foreclosureCharge = BigDecimal.ZERO;
        if (loan.getForeclosurePenaltyRate() != null && loan.getForeclosureAllowed()) {
            foreclosureCharge = principal.multiply(loan.getForeclosurePenaltyRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        
        return principal.add(penalty).add(interest).add(foreclosureCharge);
    }

    private void validateActive(Loan loan) {
        if (!"ACTIVE".equals(loan.getLoanStatus())) {
             throw new BadRequestException("Loan is not ACTIVE");
        }
    }
}
