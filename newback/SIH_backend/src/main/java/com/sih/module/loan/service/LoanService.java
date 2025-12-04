package com.sih.module.loan.service;

import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import com.sih.module.group.repository.BorrowerGroupRepository;
import com.sih.module.group.repository.GroupMemberRepository;
import com.sih.module.loan.dto.LoanResponse;
import com.sih.module.loan.dto.PaymentRequest;
import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.entity.Repayment;
import com.sih.module.loan.repository.LoanRepository;
import com.sih.module.loan.repository.RepaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final BorrowerGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final com.sih.module.group.service.GroupService groupService;

    @Transactional
    public Loan createLoanFromApplication(Long applicationId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!"SANCTIONED".equals(application.getStatus())) {
            throw new BadRequestException("Only sanctioned applications can create loans");
        }

        // Calculate EMI and schedule
        BigDecimal principal = application.getSanctionedAmount();
        BigDecimal interestRate = application.getFinalInterestRate();
        Integer tenureMonths = application.getScheme() != null ? application.getScheme().getMaxTenureMonths() : 12;

        BigDecimal monthlyRate = interestRate.divide(BigDecimal.valueOf(1200), 10, java.math.RoundingMode.HALF_UP);
        BigDecimal emi = calculateEMI(principal, monthlyRate, tenureMonths);
        BigDecimal totalInterest = emi.multiply(BigDecimal.valueOf(tenureMonths)).subtract(principal);

        Loan loan = Loan.builder()
                .application(application)
                .user(application.getUser())
                .totalPrincipal(principal)
                .totalInterest(totalInterest)
                .monthlyEmi(emi)
                .outstandingPrincipal(principal)
                .outstandingInterest(totalInterest)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(tenureMonths))
                .loanStatus("ACTIVE")
                .nextPaymentDate(LocalDate.now().plusMonths(1))
                .interestRate(interestRate)
                .remainingTenure(tenureMonths)
                .lastPaymentDate(LocalDate.now().minusDays(1)) // Set to yesterday so first payment accrues interest from today
                .accumulatedInterest(BigDecimal.ZERO)
                .build();

        loan = loanRepository.save(loan);
        log.info("Loan created from application: {}", applicationId);

        return loan;
    }

    public List<LoanResponse> getMyLoans(Long userId) {
        return loanRepository.findByUserUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LoanResponse> getActiveLoans(Long userId) {
        return loanRepository.findByUserUserId(userId).stream()
                .filter(loan -> "ACTIVE".equals(loan.getLoanStatus()) || "OVERDUE".equals(loan.getLoanStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LoanResponse getLoanById(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        return mapToResponse(loan);
    }

    @Transactional
    public void makeRepayment(Long loanId, Long userId, PaymentRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only repay your own loans");
        }

        if (!"ACTIVE".equals(loan.getLoanStatus()) && !"OVERDUE".equals(loan.getLoanStatus())) {
            throw new BadRequestException("Loan is not active or overdue");
        }

        // Validate payment amount
        BigDecimal paymentAmount = request.getAmount();
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be positive");
        }

        // Calculate interest and validate payment
        LocalDate paymentDate = LocalDate.now();
        LocalDate lastDate = loan.getLastPaymentDate();
        
        // 1. Calculate Interest Component
        long daysSinceLastPayment = java.time.temporal.ChronoUnit.DAYS.between(lastDate, paymentDate);
        if (daysSinceLastPayment < 0) daysSinceLastPayment = 0;
        
        BigDecimal dailyRate = loan.getInterestRate().divide(BigDecimal.valueOf(36500), 10,
                java.math.RoundingMode.HALF_UP);
        BigDecimal accruedInterest = loan.getOutstandingPrincipal().multiply(dailyRate)
                .multiply(BigDecimal.valueOf(daysSinceLastPayment));
        
        // Total interest to cover = Accrued + Previously Accumulated
        BigDecimal totalInterestToCover = accruedInterest.add(loan.getAccumulatedInterest());
        
        // Validate payment doesn't exceed total payoff
        BigDecimal maxPayoff = loan.getOutstandingPrincipal().add(totalInterestToCover);
        if (paymentAmount.compareTo(maxPayoff) > 0) {
            throw new BadRequestException("Payment amount exceeds total payoff amount of " + maxPayoff);
        }

        BigDecimal interestPaid;
        BigDecimal principalPaid;
        BigDecimal remainingToAccumulate = BigDecimal.ZERO;

        if (paymentAmount.compareTo(totalInterestToCover) >= 0) {
            interestPaid = totalInterestToCover;
            principalPaid = paymentAmount.subtract(interestPaid);
        } else {
            interestPaid = paymentAmount;
            principalPaid = BigDecimal.ZERO;
            remainingToAccumulate = totalInterestToCover.subtract(paymentAmount);
        }

        // 2. Update Loan Balance
        BigDecimal oldOutstanding = loan.getOutstandingPrincipal();
        BigDecimal newOutstanding = oldOutstanding.subtract(principalPaid);

        loan.setOutstandingPrincipal(newOutstanding);
        loan.setAccumulatedInterest(remainingToAccumulate);
        loan.setLastPaymentDate(paymentDate);

        // Capture original due date for record *before* potential update
        LocalDate originalDueDate = loan.getNextPaymentDate();

        // 3. Handle Closure or Schedule Adjustment
        if (newOutstanding.compareTo(BigDecimal.ZERO) <= 0) {
            // Loan Closed
            loan.setLoanStatus("CLOSED");
            loan.setOutstandingPrincipal(BigDecimal.ZERO);
            loan.setOutstandingInterest(BigDecimal.ZERO);
            loan.setMonthlyEmi(BigDecimal.ZERO);
            loan.setNextPaymentDate(null);
            loan.setRemainingTenure(0);
        } else {
            // Loan Continues - Adjust Schedule
            // Only adjust if principal was paid
            if (principalPaid.compareTo(BigDecimal.ZERO) > 0) {
                String mode = request.getAdjustmentMode() != null ? request.getAdjustmentMode() : "TENURE_REDUCTION";
                BigDecimal monthlyRate = loan.getInterestRate().divide(BigDecimal.valueOf(1200), 10,
                        java.math.RoundingMode.HALF_UP);

                if ("EMI_REDUCTION".equalsIgnoreCase(mode)) {
                    // Keep Tenure Same, Reduce EMI
                    // We need to know the *remaining* tenure.
                    // If this is an extra payment, we assume tenure stays as is (minus time passed
                    // if we tracked it strictly).
                    // For simplicity, we use the current remainingTenure.
                    // Ideally, we should decrement tenure only on scheduled dates.
                    // But here we just recalculate EMI for the *current* remaining tenure count.
                    int tenure = loan.getRemainingTenure();
                    BigDecimal newEmi = calculateEMI(newOutstanding, monthlyRate, tenure);
                    loan.setMonthlyEmi(newEmi);

                } else {
                    // TENURE_REDUCTION (Default)
                    // Keep EMI Same, Reduce Tenure
                    // NPER = -log(1 - (rate * PV / PMT)) / log(1 + rate)
                    BigDecimal currentEmi = loan.getMonthlyEmi();

                    // If outstanding is small, EMI might be larger than needed -> Tenure becomes
                    // small
                    // NPER formula:
                    // rate per period = monthlyRate
                    // pmt = currentEmi
                    // pv = newOutstanding
                    // n = - ln(1 - (r*pv/pmt)) / ln(1+r)

                    // Check if EMI covers interest
                    BigDecimal monthlyInterest = newOutstanding.multiply(monthlyRate);
                    if (currentEmi.compareTo(monthlyInterest) <= 0) {
                        // EMI too low to cover interest, must increase EMI or Tenure infinite.
                        // Fallback to EMI recalculation to ensure closure
                        int tenure = loan.getRemainingTenure();
                        BigDecimal newEmi = calculateEMI(newOutstanding, monthlyRate, tenure);
                        loan.setMonthlyEmi(newEmi);
                    } else {
                        double r = monthlyRate.doubleValue();
                        double pv = newOutstanding.doubleValue();
                        double pmt = currentEmi.doubleValue();

                        double numerator = Math.log(1 - (r * pv / pmt));
                        double denominator = Math.log(1 + r);
                        double nper = -numerator / denominator;

                        int newTenure = (int) Math.ceil(nper);
                        loan.setRemainingTenure(newTenure);
                    }
                }
            }
            // Always move next payment date if we consider this a "monthly" payment?
            // User said: "When user want to pay more instalment in advance... basically
            // example its sum of 4.6 emis"
            // If they pay ad-hoc, we shouldn't necessarily skip the next due date unless
            // they explicitly "prepaid" for a specific month.
            // But usually, ad-hoc payments just reduce principal. The next EMI is still due
            // on the next date.
            // However, if they paid the *scheduled* EMI, we move the date.
            // Let's assume: If payment >= EMI, we advance the date?
            // Or simpler: We always keep the Next Payment Date as is, unless we explicitly
            // handle "Advance EMI".
            // For now, let's NOT change nextPaymentDate automatically for ad-hoc payments,
            // UNLESS it matches the due date logic.
            // But to keep it simple and functional for the "Pay EMI" button:
            // We will advance the date by 1 month if the payment is roughly equal to or
            // greater than 1 EMI.

            // Calculate how many EMIs are covered by this payment
            // We use strict division to determine how many full EMIs were paid.
            if (loan.getMonthlyEmi().compareTo(BigDecimal.ZERO) > 0) {
                int emisPaid = paymentAmount.divide(loan.getMonthlyEmi(), 0, java.math.RoundingMode.FLOOR).intValue();
                
                if (emisPaid > 0) {
                    loan.setNextPaymentDate(loan.getNextPaymentDate().plusMonths(emisPaid));
                    int newTenure = loan.getRemainingTenure() - emisPaid;
                    loan.setRemainingTenure(Math.max(0, newTenure));
                    log.info("Payment covered {} EMIs. Advancing next payment date to {}", emisPaid, loan.getNextPaymentDate());
                }
            }

            // If status was OVERDUE and now NextPaymentDate is in future, set back to
            // ACTIVE
            if ("OVERDUE".equals(loan.getLoanStatus()) && loan.getNextPaymentDate().isAfter(LocalDate.now())) {
                loan.setLoanStatus("ACTIVE");

                // Check if this was a group loan and if the group can be recovered
                if (Boolean.TRUE.equals(loan.getIsGroupLoan()) && loan.getGroup() != null) {
                    // We need to save the current loan status first so the query reflects the
                    // update
                    loanRepository.saveAndFlush(loan);

                    boolean anyOverdue = loanRepository.existsByGroupGroupIdAndLoanStatus(
                            loan.getGroup().getGroupId(), "OVERDUE");

                    if (!anyOverdue) {
                        groupService.updateGroupStatus(loan.getGroup().getGroupId(), "ACTIVE");
                        log.info("Group {} status recovered to ACTIVE as all loans are current",
                                loan.getGroup().getGroupId());
                    }
                }
            }
        }

        loanRepository.save(loan);

        // Calculate delay days and is_on_time (using originalDueDate from line 165)
        int delayDays = (int) java.time.temporal.ChronoUnit.DAYS.between(originalDueDate, paymentDate);
        boolean isOnTime = delayDays <= 0;

        // Create repayment record
        Repayment repayment = Repayment.builder()
                .loan(loan)
                .dueDate(originalDueDate) // Use the captured original due date
                .paidDate(paymentDate)
                .amountDue(loan.getMonthlyEmi()) // This might be old EMI
                .amountPaid(paymentAmount)
                .principalComponent(principalPaid)
                .interestComponent(interestPaid)
                .paymentMode(request.getMode())
                .transactionRef(request.getTransactionRef())
                .isOnTime(isOnTime)
                .delayDays(Math.max(0, delayDays))
                .status("COMPLETED")
                .build();

        repaymentRepository.save(repayment);
        log.info("Repayment recorded for loan: {}, isOnTime: {}, delayDays: {}", loanId, isOnTime, delayDays);
    }

    @Transactional
    public BigDecimal calculatePayoffAmount(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only view your own loan details");
        }

        // Calculate final amount needed
        LocalDate paymentDate = LocalDate.now();
        long daysSinceLastPayment = java.time.temporal.ChronoUnit.DAYS.between(loan.getLastPaymentDate(), paymentDate);
        if (daysSinceLastPayment < 0) daysSinceLastPayment = 0;
        
        BigDecimal dailyRate = loan.getInterestRate().divide(BigDecimal.valueOf(36500), 10,
                java.math.RoundingMode.HALF_UP);
        BigDecimal accruedInterest = loan.getOutstandingPrincipal().multiply(dailyRate)
                .multiply(BigDecimal.valueOf(daysSinceLastPayment));
        BigDecimal totalPayoff = loan.getOutstandingPrincipal().add(accruedInterest).add(loan.getAccumulatedInterest());

        return totalPayoff.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    @Transactional
    public void forecloseLoan(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only foreclose your own loans");
        }

        // Calculate final amount needed
        BigDecimal totalPayoff = calculatePayoffAmount(loanId, userId);
        LocalDate paymentDate = LocalDate.now();
        long daysSinceLastPayment = java.time.temporal.ChronoUnit.DAYS.between(loan.getLastPaymentDate(), paymentDate);
        BigDecimal dailyRate = loan.getInterestRate().divide(BigDecimal.valueOf(36500), 10,
                java.math.RoundingMode.HALF_UP);
        BigDecimal accruedInterest = loan.getOutstandingPrincipal().multiply(dailyRate)
                .multiply(BigDecimal.valueOf(daysSinceLastPayment));

        // Create repayment record for foreclosure
        Repayment repayment = Repayment.builder()
                .loan(loan)
                .dueDate(LocalDate.now())
                .paidDate(paymentDate)
                .amountDue(totalPayoff)
                .amountPaid(totalPayoff)
                .principalComponent(loan.getOutstandingPrincipal())
                .interestComponent(accruedInterest.add(loan.getAccumulatedInterest()))
                .paymentMode("FORECLOSURE")
                .transactionRef("FORECLOSURE-" + loanId)
                .isOnTime(true)
                .delayDays(0)
                .status("COMPLETED")
                .build();

        repaymentRepository.save(repayment);
        log.info("Foreclosure repayment recorded for loan: {}", loanId);

        loan.setLoanStatus("FORECLOSED");
        loan.setOutstandingPrincipal(BigDecimal.ZERO);
        loan.setOutstandingInterest(BigDecimal.ZERO);
        loan.setAccumulatedInterest(BigDecimal.ZERO);
        loan.setMonthlyEmi(BigDecimal.ZERO);
        loanRepository.save(loan);

        log.info("Loan {} foreclosed. Final payoff calculated was {}", loanId, totalPayoff);
    }

    @Transactional
    public void waiveOffLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        loan.setLoanStatus("WAIVED_OFF");
        loan.setOutstandingPrincipal(BigDecimal.ZERO);
        loan.setOutstandingInterest(BigDecimal.ZERO);
        loanRepository.save(loan);

        log.info("Loan {} waived off", loanId);
    }

    public List<Repayment> getRepaymentSchedule(Long loanId) {
        return repaymentRepository.findByLoanLoanId(loanId);
    }

    public List<com.sih.module.loan.dto.RepaymentScheduleDTO> getProjectedSchedule(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        List<com.sih.module.loan.dto.RepaymentScheduleDTO> schedule = new java.util.ArrayList<>();

        // Add past repayments
        List<Repayment> pastRepayments = repaymentRepository.findByLoanLoanId(loanId);
        int installmentCount = 1;

        for (Repayment r : pastRepayments) {
            schedule.add(com.sih.module.loan.dto.RepaymentScheduleDTO.builder()
                    .installmentNumber(installmentCount++)
                    .dueDate(r.getDueDate())
                    .emiAmount(r.getAmountPaid())
                    .principalComponent(r.getPrincipalComponent())
                    .interestComponent(r.getInterestComponent())
                    .outstandingPrincipal(BigDecimal.ZERO) // We don't track historical outstanding easily here without
                                                           // replay
                    .status("PAID")
                    .build());
        }

        // Project future
        if ("ACTIVE".equals(loan.getLoanStatus())) {
            BigDecimal outstanding = loan.getOutstandingPrincipal();
            BigDecimal rate = loan.getInterestRate();
            BigDecimal monthlyRate = rate.divide(BigDecimal.valueOf(1200), 10, java.math.RoundingMode.HALF_UP);
            int remainingTenure = loan.getRemainingTenure();
            LocalDate nextDate = loan.getNextPaymentDate();

            for (int i = 0; i < remainingTenure; i++) {
                BigDecimal interest = outstanding.multiply(monthlyRate).setScale(2, java.math.RoundingMode.HALF_UP);
                BigDecimal emi = loan.getMonthlyEmi();

                // Adjust last EMI
                if (i == remainingTenure - 1) {
                    emi = outstanding.add(interest);
                }

                BigDecimal principal = emi.subtract(interest);
                outstanding = outstanding.subtract(principal);
                if (outstanding.compareTo(BigDecimal.ZERO) < 0)
                    outstanding = BigDecimal.ZERO;

                schedule.add(com.sih.module.loan.dto.RepaymentScheduleDTO.builder()
                        .installmentNumber(installmentCount++)
                        .dueDate(nextDate.plusMonths(i))
                        .emiAmount(emi)
                        .principalComponent(principal)
                        .interestComponent(interest)
                        .outstandingPrincipal(outstanding)
                        .status("UPCOMING")
                        .build());
            }
        }

        return schedule;
    }

    private BigDecimal calculateEMI(BigDecimal principal, BigDecimal monthlyRate, Integer tenure) {
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenure), 2, java.math.RoundingMode.HALF_UP);
        }

        BigDecimal factor = BigDecimal.ONE.add(monthlyRate).pow(tenure);
        BigDecimal numerator = principal.multiply(monthlyRate).multiply(factor);
        BigDecimal denominator = factor.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, java.math.RoundingMode.HALF_UP);
    }

    private LoanResponse mapToResponse(Loan loan) {
        return LoanResponse.builder()
                .loanId(loan.getLoanId())
                .applicationId(loan.getApplication().getApplicationId())
                .userId(loan.getUser().getUserId())
                .totalPrincipal(loan.getTotalPrincipal())
                .totalInterest(loan.getTotalInterest())
                .monthlyEmi(loan.getMonthlyEmi())
                .outstandingPrincipal(loan.getOutstandingPrincipal())
                .outstandingInterest(loan.getOutstandingInterest())
                .startDate(loan.getStartDate())
                .endDate(loan.getEndDate())
                .loanStatus(loan.getLoanStatus())
                .nextPaymentDate(loan.getNextPaymentDate())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .isGroupLoan(loan.getIsGroupLoan())
                .groupId(loan.getGroup() != null ? loan.getGroup().getGroupId() : null)
                .groupName(loan.getGroup() != null ? loan.getGroup().getGroupName() : null)
                .groupStatus(loan.getGroup() != null ? loan.getGroup().getGroupStatus() : null)
                .build();
    }

    @Transactional
    public List<Loan> createGroupLoan(Long groupId, Long officerId) {
        // 1. Validate Group
        com.sih.module.group.entity.BorrowerGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));

        if (!group.getIsActive()) {
            throw new BadRequestException("Group is not active");
        }

        if ("DEFAULTED".equals(group.getGroupStatus())) {
            throw new BadRequestException("Group is DEFAULTED and cannot apply for new loans");
        }

        // 2. Fetch Members
        List<com.sih.module.group.entity.GroupMember> members = memberRepository.findByGroupGroupIdAndStatus(groupId,
                "APPROVED");
        if (members.isEmpty()) {
            throw new BadRequestException("Group has no active members");
        }

        List<Loan> createdLoans = new java.util.ArrayList<>();

        // 3. Create Loan for each member
        for (com.sih.module.group.entity.GroupMember member : members) {
            // Check if member already has an active loan
            boolean hasActiveLoan = loanRepository.existsByUserUserIdAndLoanStatus(member.getUser().getUserId(),
                    "ACTIVE");
            if (hasActiveLoan) {
                log.warn("Member {} already has an active loan, skipping", member.getUser().getUserId());
                continue;
            }

            // Find sanctioned application for this member in this group context
            LoanApplication application = applicationRepository
                    .findByGroupGroupIdAndUserUserId(groupId, member.getUser().getUserId())
                    .stream()
                    .filter(app -> "SANCTIONED".equals(app.getStatus()))
                    .findFirst()
                    .orElse(null);

            if (application == null) {
                log.warn("No sanctioned application found for member {}, skipping", member.getUser().getUserId());
                continue;
            }

            Loan loan = createLoanFromApplication(application.getApplicationId());
            loan.setGroup(group);
            loan.setIsGroupLoan(true);
            loanRepository.save(loan);
            createdLoans.add(loan);
        }

        if (createdLoans.isEmpty()) {
            throw new BadRequestException("No eligible members found for loan creation");
        }

        log.info("Created {} loans for group {}", createdLoans.size(), groupId);
        return createdLoans;
    }

    @Transactional
    public void checkDefaults() {
        LocalDate today = LocalDate.now();

        // 1. Find Loans that are ACTIVE but have missed payment date
        // Logic: Next Payment Date < Today
        List<Loan> overdueLoans = loanRepository.findByNextPaymentDateBeforeAndLoanStatus(today, "ACTIVE");

        for (Loan loan : overdueLoans) {
            log.info("Processing overdue loan: {}", loan.getLoanId());

            // Mark as OVERDUE
            loan.setLoanStatus("OVERDUE");

            // Apply Penalty (2% of Monthly EMI)
            BigDecimal penalty = loan.getMonthlyEmi().multiply(BigDecimal.valueOf(0.02));
            loan.setAccumulatedInterest(loan.getAccumulatedInterest().add(penalty));

            loanRepository.save(loan);

            // Check Group Impact
            if (Boolean.TRUE.equals(loan.getIsGroupLoan()) && loan.getGroup() != null) {
                groupService.updateGroupStatus(loan.getGroup().getGroupId(), "AT_RISK");
            }
        }

        // 2. Check for DEFAULTED (Overdue > 30 days)
        // This requires checking loans that are ALREADY OVERDUE
        List<Loan> defaultedLoans = loanRepository.findByLoanStatus("OVERDUE");
        for (Loan loan : defaultedLoans) {
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(loan.getNextPaymentDate(), today);
            if (daysOverdue > 30) {
                if (Boolean.TRUE.equals(loan.getIsGroupLoan()) && loan.getGroup() != null) {
                    groupService.updateGroupStatus(loan.getGroup().getGroupId(), "DEFAULTED");
                }
            }
        }
    }
}
