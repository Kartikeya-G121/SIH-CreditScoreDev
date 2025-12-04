package com.sih.module.consumption.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public interface OcrService {
    ParsedBillDetails parseBill(String fileUrl);

    @Data
    @Builder
    class ParsedBillDetails {
        private BigDecimal amount;
        private LocalDate date;
        private String billerName;
        private String billNumber;
        private String consumerNumber;
        private String billerCategory;
        private LocalDate dueDate;
        private BigDecimal unitsConsumed;
        private BigDecimal overallConfidence;
        private Map<String, Object> rawData;

        // Individual field confidences
        private BigDecimal amountConfidence;
        private BigDecimal billNumberConfidence;
        private BigDecimal consumerNumberConfidence;
        private BigDecimal billerConfidence;
        private BigDecimal dateConfidence;
        private BigDecimal dueDateConfidence;
        private BigDecimal unitsConfidence;
    }

    @Data
    class FieldValue<T> {
        private T value;
        private Double confidence;
    }

    @Data
    class BillerInfo {
        @JsonProperty("biller_name")
        private String billerName;
        private String category;
        private Double confidence;
    }
}
