package com.investment.guidance.recommendation;

import com.investment.guidance.recommendation.dto.RecommendationRequest;
import com.investment.guidance.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Investment recommendation endpoints")
public class RecommendationController {

    private final RecommendationService service;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Generate investment recommendations")
    public ResponseEntity<Recommendation> generate(@Valid @RequestBody RecommendationRequest request, Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.generate(userId, request));
    }

    @GetMapping
    @Operation(summary = "Get user's recommendation history")
    public ResponseEntity<List<Recommendation>> getHistory(Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.getByUserId(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get recommendation by ID")
    public ResponseEntity<Recommendation> getById(@PathVariable UUID id, Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.getById(id, userId));
    }
}
