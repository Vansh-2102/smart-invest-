package com.investment.guidance.recommendation;

import com.investment.guidance.ai.MLServiceClient;
import com.investment.guidance.exception.ResourceNotFoundException;
import com.investment.guidance.financialprofile.FinancialProfile;
import com.investment.guidance.financialprofile.FinancialProfileRepository;
import com.investment.guidance.recommendation.dto.RecommendationRequest;
import com.investment.guidance.user.User;
import com.investment.guidance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@SuppressWarnings({"null", "unchecked"})
public class RecommendationService {

    private final RecommendationRepository repository;
    private final UserRepository userRepository;
    private final FinancialProfileRepository profileRepository;
    private final MLServiceClient mlServiceClient;

    public Recommendation generate(UUID userId, RecommendationRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResourceNotFoundException("User not found"));
        String riskLevel = request.getRiskLevel();
        if (riskLevel == null || riskLevel.isBlank()) {
            FinancialProfile profile = profileRepository.findByUserId(userId).orElseThrow(() ->
                    new ResourceNotFoundException("No financial profile found, please create one first"));
            riskLevel = profile.getPredictedRiskLevel();
        }
        Map<String, Object> mlRecommendations = mlServiceClient.getRecommendations(riskLevel, request.getInvestmentAmount());
        Recommendation recommendation = new Recommendation();
        recommendation.setUser(user);
        recommendation.setRiskLevel(riskLevel);
        recommendation.setTotalInvestmentAmount(request.getInvestmentAmount());
        recommendation.setAssetAllocations((Map<String, Object>) mlRecommendations.get("asset_class_allocations"));
        recommendation.setAssetRecommendations((List<Map<String, Object>>) mlRecommendations.get("recommendations"));
        
        if (mlRecommendations.containsKey("gross_projected_profit") && mlRecommendations.get("gross_projected_profit") != null) {
            recommendation.setGrossProjectedProfit(new BigDecimal(mlRecommendations.get("gross_projected_profit").toString()));
        }
        if (mlRecommendations.containsKey("estimated_tax_liability") && mlRecommendations.get("estimated_tax_liability") != null) {
            recommendation.setEstimatedTaxLiability(new BigDecimal(mlRecommendations.get("estimated_tax_liability").toString()));
        }
        if (mlRecommendations.containsKey("net_projected_profit") && mlRecommendations.get("net_projected_profit") != null) {
            recommendation.setNetProjectedProfit(new BigDecimal(mlRecommendations.get("net_projected_profit").toString()));
        }
        if (mlRecommendations.containsKey("effective_tax_rate_pct") && mlRecommendations.get("effective_tax_rate_pct") != null) {
            recommendation.setEffectiveTaxRatePct(new BigDecimal(mlRecommendations.get("effective_tax_rate_pct").toString()));
        }
        if (mlRecommendations.containsKey("dicgc_insurance_status") && mlRecommendations.get("dicgc_insurance_status") instanceof Map) {
            recommendation.setDicgcInsuranceStatus((Map<String, Object>) mlRecommendations.get("dicgc_insurance_status"));
        }
        if (mlRecommendations.containsKey("tax_breakdown") && mlRecommendations.get("tax_breakdown") instanceof Map) {
            recommendation.setTaxBreakdown((Map<String, Object>) mlRecommendations.get("tax_breakdown"));
        }
        if (mlRecommendations.containsKey("volatility_drift") && mlRecommendations.get("volatility_drift") instanceof Map) {
            recommendation.setVolatilityDrift((Map<String, Object>) mlRecommendations.get("volatility_drift"));
        }

        return repository.save(recommendation);

    }

    public List<Recommendation> getByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Recommendation getById(UUID id, UUID userId) {
        Recommendation recommendation = repository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Recommendation not found"));
        if (!recommendation.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Recommendation not found");
        }
        return recommendation;
    }
}
