package com.sih.module.group.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {
    private Long groupId;
    private String groupName;
    private LocalDate formationDate;
    private String projectDescription;
    private Long createdByUserId;
    private BigDecimal groupScore;
    private Boolean isActive;
    private Integer memberCount;
    private List<MemberResponse> members;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

