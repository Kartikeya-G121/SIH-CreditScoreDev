package com.sih.module.partner.repository;

import com.sih.module.partner.entity.LoanOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanOfficerRepository extends JpaRepository<LoanOfficer, Long> {
    Optional<LoanOfficer> findByUserUserId(Long userId);
    
    List<LoanOfficer> findByChannelPartnerId(Long partnerId);
    
    Optional<LoanOfficer> findByEmail(String email);
    
    boolean existsByUserUserId(Long userId);
}
