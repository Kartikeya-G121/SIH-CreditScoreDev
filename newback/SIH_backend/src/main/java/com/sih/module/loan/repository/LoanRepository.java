package com.sih.module.loan.repository;

import com.sih.module.loan.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUserUserId(Long userId);

    List<Loan> findByLoanStatus(String status);

    boolean existsByUserUserIdAndLoanStatus(Long userId, String status);

    List<Loan> findByNextPaymentDateBeforeAndLoanStatus(java.time.LocalDate date, String status);

    boolean existsByGroupGroupIdAndLoanStatus(Long groupId, String loanStatus);

    List<Loan> findByGroupGroupId(Long groupId);
}
