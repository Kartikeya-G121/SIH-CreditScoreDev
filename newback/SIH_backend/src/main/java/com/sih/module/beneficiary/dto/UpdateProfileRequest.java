package com.sih.module.beneficiary.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateProfileRequest {
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

    // Additional Socio-Economic Fields
    private String education;
    private Integer familySize;
    private Integer dependencyCount;
    private BigDecimal landOwned;
    private String incomeSource;
    private Boolean isGraduate;
}
