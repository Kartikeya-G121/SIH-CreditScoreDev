package com.sih.module.voice.entity;

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
@Table(name = "voice_interactions", indexes = {
    @Index(name = "idx_voice_user", columnList = "user_id"),
    @Index(name = "idx_voice_intent", columnList = "intent_detected"),
    @Index(name = "idx_voice_created", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceInteraction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interaction_id")
    private Long interactionId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;
    
    @Column(name = "transcribed_text", columnDefinition = "TEXT")
    private String transcribedText;
    
    @Column(name = "intent_detected", length = 100)
    private String intentDetected;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "action_taken", columnDefinition = "jsonb")
    private Map<String, Object> actionTaken;
    
    @Column(name = "storage_type", length = 20)
    @Builder.Default
    private String storageType = "S3";
    
    @Column(name = "audio_blob", columnDefinition = "BYTEA")
    private byte[] audioBlob;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}

