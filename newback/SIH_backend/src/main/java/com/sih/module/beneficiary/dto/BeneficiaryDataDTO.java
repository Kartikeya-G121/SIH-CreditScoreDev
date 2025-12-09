package com.sih.module.beneficiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryDataDTO {
    // User fields (REQUIRED)
    private String email;
    private String phone;

    // BeneficiaryProfile fields (all optional)
    private String fullName;
    private String casteCategory;
    private LocalDate dob;
    private String gender;

    // Location
    private String addressLine;
    private String district;
    private String state;
    private String pincode;
    private String regionType; // RURAL/URBAN

    // Financial
    private BigDecimal verifiedAnnualIncome;
    private String education;
    private Integer familySize;
    private Integer dependencyCount;
    private BigDecimal landOwned;
    private String incomeSource;
    private Boolean isGraduate;

    // Row tracking
    private Integer rowNumber; // For error reporting
}
