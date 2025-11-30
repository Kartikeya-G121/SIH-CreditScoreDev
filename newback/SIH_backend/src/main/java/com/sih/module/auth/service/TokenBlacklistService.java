package com.sih.module.auth.service;

import com.sih.common.security.JwtService;
import com.sih.module.auth.entity.BlacklistedToken;
import com.sih.module.auth.repository.TokenBlacklistRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;

    private static final String BLACKLIST_KEY_PREFIX = "blacklist:";

    /**
     * Pre-load active blacklisted tokens from DB to Redis on startup.
     * This ensures Redis is the source of truth and we don't hit DB on reads.
     */
    @PostConstruct
    public void loadBlacklist() {
        log.info("Pre-loading token blacklist from database...");
        Date now = new Date();
        List<BlacklistedToken> activeTokens = tokenBlacklistRepository.findAllByExpiryDateAfter(now);

        int count = 0;
        for (BlacklistedToken token : activeTokens) {
            long ttlMillis = token.getExpiryDate().getTime() - now.getTime();
            if (ttlMillis > 0) {
                redisTemplate.opsForValue().set(
                        BLACKLIST_KEY_PREFIX + token.getToken(),
                        "true",
                        ttlMillis,
                        TimeUnit.MILLISECONDS);
                count++;
            }
        }
        log.info("Loaded {} active blacklisted tokens into Redis", count);
    }

    @Transactional
    public void blacklistToken(String token) {
        Date expiryDate = jwtService.extractExpiration(token);
        Date now = new Date();

        // If token is already expired, no need to blacklist it
        if (expiryDate.before(now)) {
            return;
        }

        // 1. Save to DB (Persistence)
        BlacklistedToken blacklistedToken = BlacklistedToken.builder()
                .token(token)
                .expiryDate(expiryDate)
                .build();
        tokenBlacklistRepository.save(blacklistedToken);

        // 2. Save to Redis (Hot Path)
        long ttlMillis = expiryDate.getTime() - now.getTime();
        redisTemplate.opsForValue().set(
                BLACKLIST_KEY_PREFIX + token,
                "true",
                ttlMillis,
                TimeUnit.MILLISECONDS);

        log.debug("Token blacklisted: {}", token);
    }

    public boolean isTokenBlacklisted(String token) {
        // Check ONLY Redis - Zero DB hits for valid tokens
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_KEY_PREFIX + token));
    }

    /**
     * Clean up expired tokens from the database every hour.
     * Redis keys expire automatically via TTL.
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void clearBlacklist() {
        Date now = new Date();
        tokenBlacklistRepository.deleteByExpiryDateBefore(now);
        log.info("Expired tokens cleaned up from blacklist DB at {}", now);
    }
}
