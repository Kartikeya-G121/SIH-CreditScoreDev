package com.sih.module.audit.service;

import com.sih.module.audit.entity.AuditLog;
import com.sih.module.audit.repository.AuditLogRepository;
import com.sih.module.auth.entity.User;
import com.sih.module.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {
    
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public void logAction(Long userId, String actionType, String entityType, Long entityId,
                         Map<String, Object> oldValue, Map<String, Object> newValue, String ipAddress) {
        User user = userId != null ? 
                userRepository.findById(userId).orElse(null) : null;
        
        AuditLog log = AuditLog.builder()
                .actionBy(user)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .timestamp(OffsetDateTime.now())
                .build();
        
        auditLogRepository.save(log);
    }
    
    public List<AuditLog> searchLogs(Long userId, String actionType, String entityType, 
                                     OffsetDateTime startDate, OffsetDateTime endDate) {
        // Simplified search - in production, use Specification or QueryDSL
        if (userId != null) {
            return auditLogRepository.findByActionByUserId(userId);
        }
        if (actionType != null) {
            return auditLogRepository.findByActionType(actionType);
        }
        if (startDate != null && endDate != null) {
            return auditLogRepository.findByTimestampBetween(startDate, endDate);
        }
        return auditLogRepository.findAll();
    }
    
    public AuditLog getLogById(Long logId) {
        return auditLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Audit log not found"));
    }
}

