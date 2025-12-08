package com.sih.module.partner.repository;

import com.sih.module.partner.entity.ChannelPartnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChannelPartnerProfileRepository extends JpaRepository<ChannelPartnerProfile, Long> {
    Optional<ChannelPartnerProfile> findByChannelPartnerId(Long partnerId);
}
