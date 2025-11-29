package com.sih.module.consumption.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class PythonOcrService implements OcrService {

    private final RestTemplate restTemplate;

    @Value("${ocr.service.url:http://localhost:5000}")
    private String ocrServiceUrl;

    @Value("${ocr.service.enabled:true}")
    private boolean ocrServiceEnabled;

    @Override
    public ParsedBillDetails parseBill(String fileUrl) {
        if (!ocrServiceEnabled) {
            log.warn("OCR service is disabled, returning empty result");
            return ParsedBillDetails.builder().build();
        }

        log.info("Calling Python OCR service for file: {}", fileUrl);

        try {
            // Prepare request
            String endpoint = ocrServiceUrl + "/api/parse-bill";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("file_url", fileUrl);
            requestBody.put("use_easyocr", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Call Python service
            ResponseEntity<OcrResponse> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    request,
                    OcrResponse.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                OcrResponse ocrResponse = response.getBody();

                if (ocrResponse.isSuccess() && ocrResponse.getData() != null) {
                    return mapToParsedBillDetails(ocrResponse.getData());
                } else {
                    log.error("OCR service returned error: {}", ocrResponse.getError());
                    throw new RuntimeException("OCR parsing failed: " + ocrResponse.getError());
                }
            } else {
                log.error("OCR service returned non-OK status: {}", response.getStatusCode());
                throw new RuntimeException("OCR service unavailable");
            }

        } catch (Exception e) {
            log.error("Error calling Python OCR service", e);
            throw new RuntimeException("Failed to parse bill with OCR: " + e.getMessage(), e);
        }
    }

    private ParsedBillDetails mapToParsedBillDetails(OcrData data) {
        log.info("Mapping OCR response to ParsedBillDetails");

        ParsedBillDetails.ParsedBillDetailsBuilder builder = ParsedBillDetails.builder();

        // Extract amount
        if (data.getAmount() != null && data.getAmount().getValue() != null) {
            builder.amount(BigDecimal.valueOf(data.getAmount().getValue()));
            builder.amountConfidence(BigDecimal.valueOf(data.getAmount().getConfidence()));
        }

        // Extract bill number
        if (data.getBillNumber() != null && data.getBillNumber().getValue() != null) {
            builder.billNumber(data.getBillNumber().getValue());
            builder.billNumberConfidence(BigDecimal.valueOf(data.getBillNumber().getConfidence()));
        }

        // Extract consumer number
        if (data.getConsumerNumber() != null && data.getConsumerNumber().getValue() != null) {
            builder.consumerNumber(data.getConsumerNumber().getValue());
            builder.consumerNumberConfidence(BigDecimal.valueOf(data.getConsumerNumber().getConfidence()));
        }

        // Extract biller info
        if (data.getBillerInfo() != null) {
            builder.billerName(data.getBillerInfo().getBillerName());
            builder.billerCategory(data.getBillerInfo().getCategory());
            builder.billerConfidence(BigDecimal.valueOf(data.getBillerInfo().getConfidence()));
        }

        // Extract billing date
        if (data.getBillingDate() != null && data.getBillingDate().getValue() != null) {
            builder.date(parseDate(data.getBillingDate().getValue()));
            builder.dateConfidence(BigDecimal.valueOf(data.getBillingDate().getConfidence()));
        }

        // Extract due date
        if (data.getDueDate() != null && data.getDueDate().getValue() != null) {
            builder.dueDate(parseDate(data.getDueDate().getValue()));
            builder.dueDateConfidence(BigDecimal.valueOf(data.getDueDate().getConfidence()));
        }

        // Extract units consumed
        if (data.getUnitsConsumed() != null && data.getUnitsConsumed().getValue() != null) {
            Object unitsValue = data.getUnitsConsumed().getValue();
            if (unitsValue instanceof Number) {
                builder.unitsConsumed(BigDecimal.valueOf(((Number) unitsValue).doubleValue()));
                builder.unitsConfidence(BigDecimal.valueOf(data.getUnitsConsumed().getConfidence()));
            }
        }

        // Overall confidence
        if (data.getOverallConfidence() != null) {
            builder.overallConfidence(BigDecimal.valueOf(data.getOverallConfidence()));
        }

        // Store raw data
        Map<String, Object> rawData = new HashMap<>();
        rawData.put("raw_text", data.getRawText());
        builder.rawData(rawData);

        ParsedBillDetails result = builder.build();
        log.info("Mapped OCR data: amount={}, billNumber={}, confidence={}",
                result.getAmount(), result.getBillNumber(), result.getOverallConfidence());

        return result;
    }

    private LocalDate parseDate(String dateStr) {
        try {
            return LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            log.warn("Failed to parse date: {}", dateStr);
            return null;
        }
    }

    // Response DTOs for Python service
    @Data
    private static class OcrResponse {
        private boolean success;
        private OcrData data;
        private String error;
    }

    @Data
    private static class OcrData {
        private FieldValue<Double> amount;

        @JsonProperty("bill_number")
        private FieldValue<String> billNumber;

        @JsonProperty("consumer_number")
        private FieldValue<String> consumerNumber;

        @JsonProperty("biller_info")
        private BillerInfo billerInfo;

        @JsonProperty("billing_date")
        private FieldValue<String> billingDate;

        @JsonProperty("due_date")
        private FieldValue<String> dueDate;

        @JsonProperty("units_consumed")
        private FieldValue<Object> unitsConsumed;

        @JsonProperty("overall_confidence")
        private Double overallConfidence;

        @JsonProperty("raw_text")
        private String rawText;
    }

    @Data
    private static class FieldValue<T> {
        private T value;
        private Double confidence;
    }

    @Data
    private static class BillerInfo {
        @JsonProperty("biller_name")
        private String billerName;
        private String category;
        private Double confidence;
    }
}
