package com.videostreaming.auth.repository;

import com.videostreaming.auth.model.ParentalConsent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParentalConsentRepository extends JpaRepository<ParentalConsent, String> {
    Optional<ParentalConsent> findByToken(String token);
    List<ParentalConsent> findByUserIdAndConsentType(String userId, ParentalConsent.ConsentType consentType);
    Optional<ParentalConsent> findByEnrollmentId(String enrollmentId);
    List<ParentalConsent> findByUserIdAndConsentTypeAndStatus(
            String userId, ParentalConsent.ConsentType consentType, ParentalConsent.ConsentStatus status);
}
