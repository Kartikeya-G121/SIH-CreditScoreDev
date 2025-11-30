package com.sih.module.audit.repository;

import com.sih.module.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActionByUserId(Long userId);
    List<AuditLog> findByActionType(String actionType);
    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);
    List<AuditLog> findByTimestampBetween(OffsetDateTime start, OffsetDateTime end);
}

