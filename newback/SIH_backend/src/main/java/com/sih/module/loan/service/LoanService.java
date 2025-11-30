package com.sih.module.loan.service;

import com.sih.common.exception.BadRequestException;
import com.sih.common.exception.ResourceNotFoundException;
import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;

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

        BigDecimal monthlyRate = interestRate.divide(BigDecimal.valueOf(1200), 4,
                java.math.RoundingMode.HALF_UP);
        BigDecimal emi = calculateEMI(principal, monthlyRate, tenureMonths);
        BigDecimal totalInterest = emi.multiply(BigDecimal.valueOf(tenureMonths))
                .subtract(principal);

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

        if (!"ACTIVE".equals(loan.getLoanStatus())) {
            throw new BadRequestException("Loan is not active");
        }

        BigDecimal paymentAmount = request.getAmount();
        LocalDate paymentDate = LocalDate.now();
        LocalDate dueDate = loan.getNextPaymentDate();

        int delayDays = paymentDate.isAfter(dueDate)
                ? (int) java.time.temporal.ChronoUnit.DAYS.between(dueDate, paymentDate)
                : 0;

        // Update outstanding amounts
        BigDecimal principalPaid = paymentAmount.multiply(
                loan.getTotalPrincipal().divide(loan.getTotalPrincipal().add(loan.getOutstandingInterest()),
                        2, java.math.RoundingMode.HALF_UP));
        BigDecimal interestPaid = paymentAmount.subtract(principalPaid);

        loan.setOutstandingPrincipal(loan.getOutstandingPrincipal().subtract(principalPaid));
        loan.setOutstandingInterest(loan.getOutstandingInterest().subtract(interestPaid));

        if (loan.getOutstandingPrincipal().compareTo(BigDecimal.ZERO) <= 0) {
            loan.setLoanStatus("CLOSED");
            loan.setOutstandingPrincipal(BigDecimal.ZERO);
        } else {
            loan.setNextPaymentDate(loan.getNextPaymentDate().plusMonths(1));
        }

        loanRepository.save(loan);

        // Create repayment record
        Repayment repayment = Repayment.builder()
                .loan(loan)
                .dueDate(dueDate)
                .paidDate(paymentDate)
                .amountDue(loan.getMonthlyEmi())
                .amountPaid(paymentAmount)
                .paymentMode(request.getMode())
                .transactionRef(request.getTransactionRef())
                .delayDays(delayDays)
                .build();

        repaymentRepository.save(repayment);
        log.info("Repayment recorded for loan: {}", loanId);
    }

    @Transactional
    public void forecloseLoan(Long loanId, Long userId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (!loan.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only foreclose your own loans");
        }

        loan.setLoanStatus("FORECLOSED");
        loan.setOutstandingPrincipal(BigDecimal.ZERO);
        loan.setOutstandingInterest(BigDecimal.ZERO);
        loanRepository.save(loan);

        log.info("Loan {} foreclosed", loanId);
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
                .build();
    }
}
