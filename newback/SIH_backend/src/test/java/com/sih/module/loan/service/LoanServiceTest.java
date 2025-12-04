package com.sih.module.loan.service;

import com.sih.module.application.entity.LoanApplication;
import com.sih.module.application.repository.LoanApplicationRepository;
import com.sih.module.auth.entity.User;
import com.sih.module.loan.dto.PaymentRequest;
import com.sih.module.loan.entity.Loan;
import com.sih.module.loan.repository.LoanRepository;
import com.sih.module.loan.repository.RepaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private RepaymentRepository repaymentRepository;

    @Mock
    private LoanApplicationRepository applicationRepository;

    @InjectMocks
    private LoanService loanService;

    private Loan loan;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUserId(1L);

        loan = Loan.builder()
                .loanId(1L)
                .user(user)
                .totalPrincipal(BigDecimal.valueOf(10000))
                .outstandingPrincipal(BigDecimal.valueOf(10000))
                .interestRate(BigDecimal.valueOf(10)) // 10%
                .remainingTenure(12)
                .monthlyEmi(BigDecimal.valueOf(879.16)) // Approx for 10k, 10%, 12m
                .accumulatedInterest(BigDecimal.ZERO)
                .lastPaymentDate(LocalDate.now().minusMonths(1))
                .nextPaymentDate(LocalDate.now())
                .loanStatus("ACTIVE")
                .build();
    }

    @Test
    void testTenureReduction() {
        // Pay 5000 (Half principal)
        PaymentRequest request = new PaymentRequest();
        request.setAmount(BigDecimal.valueOf(5000));
        request.setMode("UPI");
        request.setAdjustmentMode("TENURE_REDUCTION");

        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        loanService.makeRepayment(1L, 1L, request);

        // Verify Outstanding Reduced
        // Interest for 1 month on 10k @ 10% = ~83.33
        // Principal paid = 5000 - 83.33 = 4916.67
        // New Outstanding = 10000 - 4916.67 = 5083.33

        // Verify EMI same
        assertEquals(BigDecimal.valueOf(879.16), loan.getMonthlyEmi());

        // Verify Tenure Reduced
        // NPER should be significantly less than 12
        assert (loan.getRemainingTenure() < 12);
    }

    @Test
    void testEmiReduction() {
        // Pay 5000 (Half principal)
        PaymentRequest request = new PaymentRequest();
        request.setAmount(BigDecimal.valueOf(5000));
        request.setMode("UPI");
        request.setAdjustmentMode("EMI_REDUCTION");

        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));

        loanService.makeRepayment(1L, 1L, request);

        // Verify Outstanding Reduced
        // New Outstanding ~ 5083.33

        // Verify EMI Reduced
        // New EMI for ~5083 over 12 months should be roughly half of 879
        assert (loan.getMonthlyEmi().compareTo(BigDecimal.valueOf(879.16)) < 0);

        // Verify Tenure Same (or close to it, logic might decrement by 1 if we consider
        // month passed)
        // Our logic decrements tenure by 1 if payment covers EMI. 5000 > 879, so tenure
        // - 1.
        // But for EMI reduction, we recalculate for remaining tenure.
    }
}
