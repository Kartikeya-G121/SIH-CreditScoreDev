package com.sih.module.loan.repository;

import com.sih.module.loan.entity.LoanTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanTransactionRepository extends JpaRepository<LoanTransaction, Long> {
    List<LoanTransaction> findByLoanLoanIdOrderByValueDateDesc(Long loanId);
    List<LoanTransaction> findByLoanLoanIdOrderByCreatedAtDesc(Long loanId);
}
