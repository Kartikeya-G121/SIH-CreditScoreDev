package com.sih.module.application.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Boolean approved;
    private String comments;
}

