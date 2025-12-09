package com.sih.module.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationDetailResponse {
    
    // Application Details
    private Long applicationId;
    private Long userId;
    private Long groupId;
    private Integer schemeId;
    private BigDecimal requestedAmount;
    private String purpose;
    private Integer tenureMonths;
    private String status;
    private String rejectionReason;
    private OffsetDateTime stageTimestamp;
    private BigDecimal sanctionedAmount;
    private BigDecimal finalInterestRate;
    private Long sanctionedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    // Beneficiary Details
    private BeneficiaryDetails beneficiaryDetails;
    
    // Loan Scheme Details
    private SchemeDetails schemeDetails;
    
    // Risk & Credit Scoring
    private ScoringDetails scoringDetails;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BeneficiaryDetails {
        private Long profileId;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String addressLine;
        private String district;
        private String state;
        private String pincode;
        private LocalDate dob;
        private String gender;
        private String casteCategory;
        private String regionType;
        private String education;
        private Integer familySize;
        private Integer dependencyCount;
        private BigDecimal landOwned;
        private String incomeSource;
        private BigDecimal verifiedAnnualIncome;
        private Boolean isProfileVerified;
        private String aadharNumber;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchemeDetails {
        private Integer schemeId;
        private String schemeName;
        private String providerName;
        private String description;
        private BigDecimal baseInterestRate;
        private BigDecimal maxLoanAmount;
        private Integer maxTenureMonths;
        private Integer gracePeriodDays;
        private BigDecimal penalInterestRate;
        private Boolean isActive;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoringDetails {
        private BigDecimal riskScore;
        private String riskBucket; // LOW, MEDIUM, HIGH
        private String riskColor; // green, yellow, red
        private String incomeBucket; // Low, Medium, High
        private BigDecimal incomeConfidence;
        private BigDecimal compositeScore; // 0-100
        private String creditScoreComposite;
        private String autoSanctionReason;
        private Map<String, Object> mlExplanations;
        private OffsetDateTime scoreTimestamp;
    }
}
