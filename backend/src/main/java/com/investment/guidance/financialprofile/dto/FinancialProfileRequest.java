package com.investment.guidance.financialprofile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialProfileRequest {
    @NotNull(message = "Age is required")
    @Min(18) @Max(120)
    private Integer age;

    @NotNull(message = "Annual income is required")
    private BigDecimal annualIncome;

    private String investmentExperience;
    private String riskTolerance;
    private String investmentGoal;
    private Integer timeHorizonYears;
    private BigDecimal debtToIncomeRatio;
}
