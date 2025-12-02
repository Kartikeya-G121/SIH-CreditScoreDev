package com.sih.module.consumption.entity;

import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "consumption_entries", indexes = {
        @Index(name = "idx_consumption_user_date", columnList = "user_id, billing_date"),
        @Index(name = "idx_consumption_status", columnList = "verification_status"),
        @Index(name = "idx_consumption_source", columnList = "data_source"),
        @Index(name = "idx_consumption_tampered", columnList = "is_tampered_flag")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entry_id")
    private Long entryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "data_source", nullable = false, length = 50)
    private String dataSource; // 'ELECTRICITY', 'WATER', 'MOBILE'

    @Column(name = "billing_amount", precision = 12, scale = 2)
    private BigDecimal billingAmount;

    @Column(name = "billing_date")
    private LocalDate billingDate;

    @Column(name = "units_consumed", precision = 10, scale = 2)
    private BigDecimal unitsConsumed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "upload_metadata", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> uploadMetadata = Map.of();

    @Column(name = "document_hash", length = 128)
    private String documentHash;

    @Column(name = "is_tampered_flag", nullable = false)
    @Builder.Default
    private Boolean isTamperedFlag = false;

    @Column(name = "tamper_reason", columnDefinition = "TEXT")
    private String tamperReason;

    @Column(name = "is_imputed", nullable = false)
    @Builder.Default
    private Boolean isImputed = false;

    @Column(name = "verification_status", length = 50)
    @Builder.Default
    private String verificationStatus = "PENDING"; // 'PENDING', 'VERIFIED', 'REJECTED'

    @Column(name = "verification_source", length = 50)
    @Builder.Default
    private String verificationSource = "NONE";

    @Column(name = "verification_confidence", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal verificationConfidence = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    @Column(name = "storage_type", length = 20)
    @Builder.Default
    private String storageType = "S3";

    @Column(name = "file_s3_url", columnDefinition = "TEXT")
    private String fileS3Url;

    @Column(name = "file_blob", columnDefinition = "BYTEA")
    private byte[] fileBlob;

    @Column(name = "file_mime_type", length = 100)
    private String fileMimeType;

    @Column(name = "file_size")
    private Long fileSize;

    // OCR Extracted Fields
    @Column(name = "biller_name", length = 200)
    private String billerName;

    @Column(name = "bill_number", length = 100)
    private String billNumber;

    @Column(name = "consumer_number", length = 100)
    private String consumerNumber;

    @Column(name = "biller_category", length = 50)
    private String billerCategory;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "ocr_confidence", precision = 5, scale = 2)
    private BigDecimal ocrConfidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ocr_raw_data", columnDefinition = "jsonb")
    private Map<String, Object> ocrRawData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bbps_response", columnDefinition = "jsonb")
    private Map<String, Object> bbpsResponse;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
