package com.sih.module.consumption.service;

import com.sih.module.consumption.dto.BbpsVerificationResponse;
import com.sih.module.consumption.service.OcrService.ParsedBillDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class MockBbpsService implements BbpsService {

    private static final BigDecimal MAX_REASONABLE_AMOUNT = new BigDecimal("100000");
    private static final BigDecimal MIN_REASONABLE_AMOUNT = new BigDecimal("10");

    private static final List<String> KNOWN_BILLERS = List.of(
            "ELECTRICITY", "WATER", "MOBILE", "GAS", "TELECOM");

    @Override
    public BbpsVerificationResponse verifyBill(ParsedBillDetails details) {
        log.info("Mock BBPS verifying bill: {}", details);

        // Simulate processing delay
        try {
            Thread.sleep(1500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        BbpsVerificationResponse.BbpsVerificationResponseBuilder responseBuilder = BbpsVerificationResponse.builder();

        List<String> tamperReasons = new ArrayList<>();
        boolean isTampered = false;
        int validationScore = 0;
        int totalChecks = 0;

        // Validate amount
        Boolean amountValid = validateAmount(details.getAmount(), tamperReasons);
        responseBuilder.amountValid(amountValid);
        if (amountValid != null) {
            totalChecks++;
            if (amountValid)
                validationScore++;
        }

        // Validate dates
        Boolean dateValid = validateDate(details.getDate(), tamperReasons);
        responseBuilder.dateValid(dateValid);
        if (dateValid != null) {
            totalChecks++;
            if (dateValid)
                validationScore++;
        }

        // Validate bill number
        Boolean billNumberValid = validateBillNumber(details.getBillNumber(), tamperReasons);
        responseBuilder.billNumberValid(billNumberValid);
        if (billNumberValid != null) {
            totalChecks++;
            if (billNumberValid)
                validationScore++;
        }

        // Validate biller
        Boolean billerValid = validateBiller(details.getBillerCategory(), tamperReasons);
        responseBuilder.billerValid(billerValid);
        if (billerValid != null) {
            totalChecks++;
            if (billerValid)
                validationScore++;
        }

        // Check for tampering
        isTampered = !tamperReasons.isEmpty();

        // Calculate confidence based on validation score
        BigDecimal confidence;
        if (totalChecks == 0) {
            confidence = BigDecimal.valueOf(0.5); // Neutral if no data
        } else {
            double score = (double) validationScore / totalChecks;
            confidence = BigDecimal.valueOf(score * 100);
        }

        // Add random variation (90% success rate for valid bills)
        boolean verified = !isTampered && ThreadLocalRandom.current().nextDouble() < 0.9;

        String message = verified ? "Bill verified successfully"
                : isTampered ? "Bill verification failed - potential tampering detected" : "Bill verification failed";

        return responseBuilder
                .verified(verified)
                .tampered(isTampered)
                .tamperReasons(tamperReasons)
                .confidence(confidence)
                .verificationSource("BBPS_MOCK")
                .message(message)
                .build();
    }

    private Boolean validateAmount(BigDecimal amount, List<String> tamperReasons) {
        if (amount == null) {
            return null; // No data to validate
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            tamperReasons.add("Amount is zero or negative");
            return false;
        }

        if (amount.compareTo(MAX_REASONABLE_AMOUNT) > 0) {
            tamperReasons.add("Amount exceeds reasonable limit");
            return false;
        }

        if (amount.compareTo(MIN_REASONABLE_AMOUNT) < 0) {
            tamperReasons.add("Amount is suspiciously low");
            return false;
        }

        return true;
    }

    private Boolean validateDate(LocalDate date, List<String> tamperReasons) {
        if (date == null) {
            return null;
        }

        LocalDate now = LocalDate.now();

        // Date should not be in future
        if (date.isAfter(now)) {
            tamperReasons.add("Billing date is in the future");
            return false;
        }

        // Date should not be too old (more than 2 years)
        if (date.isBefore(now.minusYears(2))) {
            tamperReasons.add("Billing date is too old");
            return false;
        }

        return true;
    }

    private Boolean validateBillNumber(String billNumber, List<String> tamperReasons) {
        if (billNumber == null || billNumber.trim().isEmpty()) {
            return null;
        }

        // Bill number should have minimum length
        if (billNumber.length() < 5) {
            tamperReasons.add("Bill number format is invalid (too short)");
            return false;
        }

        // Bill number should contain alphanumeric characters
        if (!billNumber.matches("^[A-Z0-9\\-/]+$")) {
            tamperReasons.add("Bill number contains invalid characters");
            return false;
        }

        return true;
    }

    private Boolean validateBiller(String billerCategory, List<String> tamperReasons) {
        if (billerCategory == null || billerCategory.trim().isEmpty()) {
            return null;
        }

        // Check if biller is in known list
        if (!KNOWN_BILLERS.contains(billerCategory.toUpperCase())) {
            tamperReasons.add("Unknown biller category: " + billerCategory);
            return false;
        }

        return true;
    }
}
