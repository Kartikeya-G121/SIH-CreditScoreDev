package com.sih.module.scoring.repository;

import com.sih.module.scoring.entity.CreditAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreditAssessmentRepository extends JpaRepository<CreditAssessment, Long> {
    Optional<CreditAssessment> findByApplicationApplicationId(Long applicationId);
}

