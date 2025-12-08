package com.sih.module.partner.repository;

import com.sih.module.partner.entity.PartnerAccountRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerAccountRequestRepository extends JpaRepository<PartnerAccountRequest, Long> {
    
    Optional<PartnerAccountRequest> findByGmailForLogin(String gmail);
    
    Optional<PartnerAccountRequest> findByOfficialOrganizationEmail(String officialOrgEmail);
    
    Page<PartnerAccountRequest> findByStatus(String status, Pageable pageable);
}
