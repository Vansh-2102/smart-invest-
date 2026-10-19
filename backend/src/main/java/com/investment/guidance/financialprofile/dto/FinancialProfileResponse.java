package com.investment.guidance.financialprofile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
    private List<Map<String, Object>> topRiskDrivers;

    public FinancialProfileResponse(
            UUID id,
            Integer age,
            BigDecimal annualIncome,
            String investmentExperience,
            String riskTolerance,
            String investmentGoal,
            Integer timeHorizonYears,
            BigDecimal debtToIncomeRatio,
            String predictedRiskLevel,
            BigDecimal currentRiskConfidence,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.age = age;
        this.annualIncome = annualIncome;
        this.investmentExperience = investmentExperience;
        this.riskTolerance = riskTolerance;
        this.investmentGoal = investmentGoal;
        this.timeHorizonYears = timeHorizonYears;
        this.debtToIncomeRatio = debtToIncomeRatio;
        this.predictedRiskLevel = predictedRiskLevel;
        this.currentRiskConfidence = currentRiskConfidence;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
