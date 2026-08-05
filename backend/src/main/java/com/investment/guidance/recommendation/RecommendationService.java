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
