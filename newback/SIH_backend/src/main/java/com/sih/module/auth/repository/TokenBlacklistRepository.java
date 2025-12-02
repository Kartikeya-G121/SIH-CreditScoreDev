package com.sih.module.auth.repository;

import com.sih.module.auth.entity.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface TokenBlacklistRepository extends JpaRepository<BlacklistedToken, Long> {

    Optional<BlacklistedToken> findByToken(String token);

    List<BlacklistedToken> findAllByExpiryDateAfter(Date now);

    void deleteByExpiryDateBefore(Date now);
}
