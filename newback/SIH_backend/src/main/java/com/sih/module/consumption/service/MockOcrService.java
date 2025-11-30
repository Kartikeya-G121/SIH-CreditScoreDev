package com.sih.module.consumption.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class MockOcrService implements OcrService {

    @Override
    public ParsedBillDetails parseBill(String fileUrl) {
        log.info("Mock OCR parsing bill from URL: {}", fileUrl);

        // Simulate processing delay
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Return dummy data
        return ParsedBillDetails.builder()
                .amount(BigDecimal.valueOf(ThreadLocalRandom.current().nextDouble(100, 5000)))
                .date(LocalDate.now().minusDays(ThreadLocalRandom.current().nextInt(1, 30)))
                .billerName("MOCK_BILLER_LTD")
                .billNumber("BILL-" + ThreadLocalRandom.current().nextInt(10000, 99999))
                .rawData(Map.of("confidence", 0.95, "ocr_engine", "MockTesseract"))
                .build();
    }
}
