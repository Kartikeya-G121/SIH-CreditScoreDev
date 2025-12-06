package com.sih.module.beneficiary.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDownloadDTO {
    private byte[] data;
    private String fileName;
    private String contentType;
}
