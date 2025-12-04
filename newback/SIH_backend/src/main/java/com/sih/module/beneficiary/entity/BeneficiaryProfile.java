package com.sih.module.beneficiary.entity;

import com.sih.common.entity.BaseEntity;
import com.sih.module.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "beneficiary_profiles", indexes = {
        @Index(name = "idx_benef_user", columnList = "user_id"),
        @Index(name = "idx_benef_geo", columnList = "state, district, pincode"),
        @Index(name = "idx_benef_verified", columnList = "is_profile_verified")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "caste_category", length = 50)
    private String casteCategory; // 'SC', 'ST', 'OBC', 'GEN'

    @Column(name = "caste_certificate_url", columnDefinition = "TEXT")
    private String casteCertificateUrl;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "gender", length = 20)
    private String gender;

    // Location
    @Column(name = "address_line", columnDefinition = "TEXT")
    private String addressLine;

    @Column(name = "district", length = 100)
    private String district;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", length = 20)
    private String pincode;

    @Column(name = "region_type", length = 20)
    private String regionType; // 'RURAL', 'URBAN'

    @Column(name = "geo_lat", precision = 10, scale = 8)
    private BigDecimal geoLat;

    @Column(name = "geo_long", precision = 11, scale = 8)
    private BigDecimal geoLong;

    // Financial Metrics
    @Column(name = "literacy_score")
    @Builder.Default
    private Integer literacyScore = 0;

    @Column(name = "verified_annual_income", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal verifiedAnnualIncome = BigDecimal.ZERO;

    @Column(name = "is_profile_verified", nullable = false)
    @Builder.Default
    private Boolean isProfileVerified = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by")
    private User verifiedBy;

    // Storage
    @Column(name = "certificate_storage_type", length = 20)
    @Builder.Default
    private String certificateStorageType = "S3";

    @Column(name = "certificate_blob", columnDefinition = "BYTEA")
    private byte[] certificateBlob;

    // Identity Proof
    @Column(name = "identity_proof_type", length = 50)
    private String identityProofType; // 'AADHAR', 'PAN'

    @Column(name = "identity_proof_url", columnDefinition = "TEXT")
    private String identityProofUrl;

    @Column(name = "identity_storage_type", length = 20)
    @Builder.Default
    private String identityStorageType = "S3";

    @Column(name = "identity_proof_blob", columnDefinition = "BYTEA")
    private byte[] identityProofBlob;

    // Additional Socio-Economic Fields
    @Column(name = "education", length = 100)
    private String education; // e.g., "Primary", "Secondary", "Higher Secondary", "Graduate", "Post-Graduate"

    @Column(name = "family_size")
    private Integer familySize; // Total number of family members

    @Column(name = "dependency_count")
    private Integer dependencyCount; // Number of dependents

    @Column(name = "land_owned", precision = 10, scale = 2)
    private BigDecimal landOwned; // Land owned in acres

    @Column(name = "income_source", length = 100)
    private String incomeSource; // e.g., "Agriculture", "Business", "Salaried", "Daily Wage"

    @Column(name = "is_graduate")
    @Builder.Default
    private Boolean isGraduate = false; // Whether the beneficiary is a graduate
}
