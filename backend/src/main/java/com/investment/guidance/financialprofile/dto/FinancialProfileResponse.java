package com.investment.guidance.financialprofile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialProfileResponse {
    private UUID id;
    private Integer age;
    private BigDecimal annualIncome;
    private String investmentExperience;
    private String riskTolerance;
    private String investmentGoal;
    private Integer timeHorizonYears;
    private BigDecimal debtToIncomeRatio;
    private String predictedRiskLevel;
    private BigDecimal currentRiskConfidence;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
