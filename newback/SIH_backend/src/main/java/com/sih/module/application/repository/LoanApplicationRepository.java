package com.sih.module.application.repository;

import com.sih.module.application.entity.LoanApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByUserUserId(Long userId);
    List<LoanApplication> findByStatus(String status);
    List<LoanApplication> findByGroupGroupId(Long groupId);
}

