package com.sih.module.consumption.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class OfflineBatchRequest {
    
    @NotEmpty(message = "Entries list cannot be empty")
    @Valid
    private List<ConsumptionEntryRequest> entries;
}

