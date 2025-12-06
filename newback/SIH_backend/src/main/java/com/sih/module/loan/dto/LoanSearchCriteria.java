package com.sih.module.loan.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LoanSearchCriteria {
    private String query; // General search (Name, App ID, etc.)
    private String status;
    private String state;
    private String riskBucket;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isNpa;
    
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "createdAt";
    private String sortDir = "desc";
}
