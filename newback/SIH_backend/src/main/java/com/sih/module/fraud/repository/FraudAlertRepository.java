package com.sih.module.fraud.repository;

import com.sih.module.fraud.entity.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByUserUserId(Long userId);
    List<FraudAlert> findByIsResolved(Boolean isResolved);
    List<FraudAlert> findBySeverity(String severity);
    List<FraudAlert> findByAlertType(String alertType);
}

