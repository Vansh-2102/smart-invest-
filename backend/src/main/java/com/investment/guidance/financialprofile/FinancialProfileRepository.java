package com.investment.guidance.financialprofile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FinancialProfileRepository extends JpaRepository<FinancialProfile, UUID> {
    Optional<FinancialProfile> findByUserId(UUID userId);
}
