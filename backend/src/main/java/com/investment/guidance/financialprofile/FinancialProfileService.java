package com.investment.guidance.financialprofile;

import com.investment.guidance.ai.MLServiceClient;
import com.investment.guidance.exception.ResourceNotFoundException;
import com.investment.guidance.financialprofile.dto.FinancialProfileRequest;
import com.investment.guidance.financialprofile.dto.FinancialProfileResponse;
import com.investment.guidance.user.User;
import com.investment.guidance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class FinancialProfileService {

    private final FinancialProfileRepository repository;
    private final UserRepository userRepository;
    private final MLServiceClient mlServiceClient;

    public FinancialProfileResponse createOrUpdate(UUID userId, FinancialProfileRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        FinancialProfile profile = repository.findByUserId(userId).orElse(new FinancialProfile());
        profile.setUser(user);
        profile.setAge(request.getAge());
        profile.setAnnualIncome(request.getAnnualIncome());
        profile.setInvestmentExperience(request.getInvestmentExperience());
        profile.setRiskTolerance(request.getRiskTolerance());
        profile.setInvestmentGoal(request.getInvestmentGoal());
        profile.setTimeHorizonYears(request.getTimeHorizonYears());
        profile.setDebtToIncomeRatio(request.getDebtToIncomeRatio());

        Map<String, Object> mlProfile = new HashMap<>();
        mlProfile.put("age", request.getAge());
        mlProfile.put("income", request.getAnnualIncome());
        mlProfile.put("investment_experience", request.getInvestmentExperience() != null ? request.getInvestmentExperience() : "BEGINNER");
        mlProfile.put("risk_tolerance", request.getRiskTolerance() != null ? request.getRiskTolerance() : "MODERATE");
        mlProfile.put("investment_goal", request.getInvestmentGoal() != null ? request.getInvestmentGoal() : "WEALTH_GROWTH");
        mlProfile.put("time_horizon", request.getTimeHorizonYears() != null ? request.getTimeHorizonYears() : 10);
        // Convert percentage to ratio (divide by 100)
        BigDecimal debtToIncomeRatio = request.getDebtToIncomeRatio();
        mlProfile.put("debt_to_income", debtToIncomeRatio != null ? debtToIncomeRatio.divide(BigDecimal.valueOf(100)) : BigDecimal.valueOf(0.3));

        Map<String, Object> riskAssessment = mlServiceClient.assessRisk(mlProfile);
        profile.setPredictedRiskLevel((String) riskAssessment.get("riskLevel"));
        profile.setCurrentRiskConfidence(BigDecimal.valueOf((Double) riskAssessment.get("confidence")));

        profile = repository.save(profile);

        return toResponse(profile);
    }

    public FinancialProfileResponse getByUserId(UUID userId) {
        return repository.findByUserId(userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Financial profile not found"));
    }

    private FinancialProfileResponse toResponse(FinancialProfile profile) {
        return new FinancialProfileResponse(
                profile.getId(),
                profile.getAge(),
                profile.getAnnualIncome(),
                profile.getInvestmentExperience(),
                profile.getRiskTolerance(),
                profile.getInvestmentGoal(),
                profile.getTimeHorizonYears(),
                profile.getDebtToIncomeRatio(),
                profile.getPredictedRiskLevel(),
                profile.getCurrentRiskConfidence(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
