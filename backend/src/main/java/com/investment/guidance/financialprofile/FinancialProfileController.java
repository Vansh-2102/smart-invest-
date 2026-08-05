package com.investment.guidance.financialprofile;

import com.investment.guidance.financialprofile.dto.FinancialProfileRequest;
import com.investment.guidance.financialprofile.dto.FinancialProfileResponse;
import com.investment.guidance.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/financial-profile")
@RequiredArgsConstructor
@Tag(name = "Financial Profile", description = "User financial profile management")
public class FinancialProfileController {

    private final FinancialProfileService service;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Create or update financial profile and assess risk")
    public ResponseEntity<FinancialProfileResponse> createOrUpdate(@Valid @RequestBody FinancialProfileRequest request, Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.createOrUpdate(userId, request));
    }

    @GetMapping
    @Operation(summary = "Get current user's financial profile")
    public ResponseEntity<FinancialProfileResponse> getProfile(Authentication authentication) {
        UUID userId = userRepository.findByEmail(authentication.getName()).orElseThrow().getId();
        return ResponseEntity.ok(service.getByUserId(userId));
    }
}
