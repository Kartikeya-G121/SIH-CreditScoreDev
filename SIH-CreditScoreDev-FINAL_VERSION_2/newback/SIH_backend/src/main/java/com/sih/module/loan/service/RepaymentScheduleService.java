package com.sih.module.loan.service;

import com.sih.module.loan.dto.RepaymentScheduleDTO;
import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.entity.Repayment;
import com.sih.module.loan.repository.RepaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RepaymentScheduleService {

    private final RepaymentRepository repaymentRepository;

    public BigDecimal calculateEMI(BigDecimal principal, BigDecimal interestRate, Integer tenureMonths) {
        if (principal == null || tenureMonths == null || tenureMonths == 0) return BigDecimal.ZERO;
        
        BigDecimal monthlyRate = interestRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }

        BigDecimal factor = BigDecimal.ONE.add(monthlyRate).pow(tenureMonths);
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(factor);
        BigDecimal denominator = factor.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    @Transactional
    public void generateInitialSchedule(Loan loan) {
        BigDecimal principal = loan.getOutstandingPrincipal();
        BigDecimal rate = loan.getInterestRate();
        Integer tenure = loan.getOriginalTenureMonths();
        BigDecimal emi = loan.getMonthlyEmi();
        LocalDate startDate = loan.getNextPaymentDate(); // First due date

        BigDecimal monthlyRate = rate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal outstanding = principal;

        List<Repayment> schedule = new ArrayList<>();

        for (int i = 0; i < tenure; i++) {
            BigDecimal interest = outstanding.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = emi.subtract(interest);
            
            // Last installment adjustment
            if (i == tenure - 1) {
                principalComp = outstanding;
                emi = principalComp.add(interest);
            }
            
            Repayment repayment = Repayment.builder()
                    .loan(loan)
                    .dueDate(startDate.plusMonths(i))
                    .amountDue(emi)
                    .principalComponent(principalComp)
                    .interestComponent(interest)
                    .status("PENDING")
                    .scheduleVersion(1)
                    .isProjected(true)
                    .build();

            schedule.add(repayment);
            outstanding = outstanding.subtract(principalComp);
        }

        repaymentRepository.saveAll(schedule);
        log.info("Generated initial schedule for Loan {} with {} installments", loan.getLoanId(), tenure);
    }

    @Transactional
    public void regenerateScheduleAfterPrepayment(Loan loan) {
        // Find existing future repayments (PENDING or DUE)
        // We need to keep PAST repayments as is.
        // We delete or update future repayments. 
        // Strategy: Mark future repayments as CANCELLED or Delete them and recreate.
        // Deleting is cleaner for "isProjected" rows.

        List<Repayment> futureRepayments = repaymentRepository.findByLoanLoanId(loan.getLoanId()).stream()
                .filter(r -> "PENDING".equals(r.getStatus()) || "DUE".equals(r.getStatus()))
                .collect(Collectors.toList());
        
        repaymentRepository.deleteAll(futureRepayments);
        
        // Regenerate based on NEW outstanding and NEW EMI
        BigDecimal principal = loan.getOutstandingPrincipal();
        BigDecimal rate = loan.getInterestRate();
        BigDecimal emi = loan.getMonthlyEmi(); // This should be the REDUCED EMI
        LocalDate nextDate = loan.getNextPaymentDate(); 
        
        // We need to know remaining tenure. Using existing remainingTenure from Loan.
        // Assuming Loan Service updated remainingTenure logic if dates shifted, 
        // but for "Prepayment (Reduce EMI, Tenure Same)", tenure count roughly stays same 
        // relative to the calendar, but we need to generate count of installments.
        
        // Actually, "Tenure Same" means the END DATE stays same.
        // So we generate installments until End Date.
        
        LocalDate endDate = loan.getEndDate();
        LocalDate currentDateIterator = nextDate;
        
        BigDecimal monthlyRate = rate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal outstanding = principal;
        
        int version = 2; // Increment version logic ideally
        
        List<Repayment> newSchedule = new ArrayList<>();
        
        while (!currentDateIterator.isAfter(endDate) && outstanding.compareTo(BigDecimal.ZERO) > 0) {
             BigDecimal interest = outstanding.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
             BigDecimal principalComp = emi.subtract(interest);
             
             // Check if this is likely the last one based on outstanding
             // OR if principalComp > outstanding (shouldn't happen with correct EMI calc)
             
             if (outstanding.subtract(principalComp).compareTo(BigDecimal.valueOf(5)) < 0) {
                 // Close enough to 0, adjust
                 principalComp = outstanding;
                 emi = principalComp.add(interest);
             }
             
             Repayment repayment = Repayment.builder()
                    .loan(loan)
                    .dueDate(currentDateIterator)
                    .amountDue(emi)
                    .principalComponent(principalComp)
                    .interestComponent(interest)
                    .status("PENDING")
                    .scheduleVersion(version)
                    .isProjected(true)
                    .build();
             
             newSchedule.add(repayment);
             outstanding = outstanding.subtract(principalComp);
             currentDateIterator = currentDateIterator.plusMonths(1);
        }
        
        repaymentRepository.saveAll(newSchedule);
        log.info("Regenerated schedule for Loan {} after prepayment. New EMIs: {}", loan.getLoanId(), newSchedule.size());
    }
}
