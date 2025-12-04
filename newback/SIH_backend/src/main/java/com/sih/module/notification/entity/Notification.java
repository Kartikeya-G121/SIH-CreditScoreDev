package com.sih.module.notification.entity;

import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notify_user", columnList = "user_id"),
    @Index(name = "idx_notify_status", columnList = "status"),
    @Index(name = "idx_notify_read", columnList = "is_read"),
    @Index(name = "idx_notify_channel", columnList = "channel"),
    @Index(name = "idx_notify_created", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "channel", length = 20)
    private String channel; // SMS / EMAIL / WHATSAPP / PUSH
    
    @Column(name = "template_key", length = 100)
    private String templateKey; // EMI_DUE, LOAN_APPROVED...
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb")
    private Map<String, Object> payload;
    
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, SENT, FAILED
    
    @Column(name = "provider_response", columnDefinition = "TEXT")
    private String providerResponse;
    
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
    
    @Column(name = "sent_at")
    private OffsetDateTime sentAt;
}

