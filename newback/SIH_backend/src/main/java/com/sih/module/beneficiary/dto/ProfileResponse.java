package com.sih.module.beneficiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long profileId;
    private Long userId;
    private String fullName;
    private String casteCategory;
    private LocalDate dob;
    private String gender;
    private String addressLine;
    private String district;
    private String state;
    private String pincode;
    private String regionType;
    private BigDecimal geoLat;
    private BigDecimal geoLong;
    private Integer literacyScore;
    private BigDecimal verifiedAnnualIncome;
    private Boolean isProfileVerified;
    private Long verifiedBy;
    private String casteCertificateUrl;
    private String identityProofType;
    private String identityProofUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Additional Socio-Economic Fields
    private String education;
    private Integer familySize;
    private Integer dependencyCount;
    private BigDecimal landOwned;
    private String incomeSource;
    private Boolean isGraduate;

    // Certificate availability flags
    private Boolean hasCasteCertificate;
    private Boolean hasIdentityProof;
}
