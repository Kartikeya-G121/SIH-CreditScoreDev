package com.sih.module.auth.repository;

import com.sih.module.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByKeycloakUserId(UUID keycloakUserId);
    Optional<User> findByResetToken(String resetToken);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
}

