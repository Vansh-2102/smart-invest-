package com.investment.guidance.financialprofile;

import com.investment.guidance.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "financial_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinancialProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;
    private BigDecimal annualIncome;
    private String investmentExperience;
    private String riskTolerance;
    private String investmentGoal;
    private Integer timeHorizonYears;
    private BigDecimal debtToIncomeRatio;

    private String predictedRiskLevel;
    private BigDecimal currentRiskConfidence;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, Object>> topRiskDrivers;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
