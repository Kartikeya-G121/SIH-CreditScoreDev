package com.sih.module.scheme.repository;

import com.sih.module.scheme.entity.LoanScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanSchemeRepository extends JpaRepository<LoanScheme, Integer> {
    List<LoanScheme> findByIsActive(Boolean isActive);
}

