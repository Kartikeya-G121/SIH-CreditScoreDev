package com.sih.module.partner.repository;

import com.sih.module.partner.entity.LoanOfficerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanOfficerProfileRepository extends JpaRepository<LoanOfficerProfile, Long> {
    Optional<LoanOfficerProfile> findByLoanOfficerId(Long officerId);
}
