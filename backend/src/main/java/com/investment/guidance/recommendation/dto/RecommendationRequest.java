package com.investment.guidance.recommendation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {
    private String riskLevel;
    @NotNull
    private BigDecimal investmentAmount;
}
