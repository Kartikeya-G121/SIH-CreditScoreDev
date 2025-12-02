package com.sih.module.consumption.service;

import com.sih.module.consumption.dto.BbpsVerificationResponse;
import com.sih.module.consumption.service.OcrService.ParsedBillDetails;

public interface BbpsService {
    BbpsVerificationResponse verifyBill(ParsedBillDetails details);
}
