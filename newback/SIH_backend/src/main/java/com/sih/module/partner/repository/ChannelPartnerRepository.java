package com.sih.module.partner.repository;

import com.sih.module.auth.entity.User;
import com.sih.module.partner.entity.ChannelPartner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChannelPartnerRepository extends JpaRepository<ChannelPartner, Long> {
    Optional<ChannelPartner> findByUser(User user);

    Optional<ChannelPartner> findByUserUserId(Long userId);

    Optional<ChannelPartner> findByLoginEmail(String email);

    // For efficient checking without loading everything
    boolean existsByUserUserId(Long userId);
}
