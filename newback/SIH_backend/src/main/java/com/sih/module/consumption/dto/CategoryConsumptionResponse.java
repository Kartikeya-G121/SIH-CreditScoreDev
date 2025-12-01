package com.sih.module.consumption.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CategoryConsumptionResponse {
    private String category; // ELECTRICITY, GAS, MOBILE, etc.
    private int count; // Number of bills in last 5 months
    private int maxAllowed; // Always 5
    private int canUpload; // maxAllowed - count
    private List<ConsumptionEntryResponse> entries;
}
