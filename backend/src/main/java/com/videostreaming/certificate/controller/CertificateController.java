package com.videostreaming.certificate.controller;

import com.videostreaming.certificate.dto.CertificateResponse;
import com.videostreaming.certificate.service.CertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> getMyCertificates(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(certificateService.getMyCertificates(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCertificate(@PathVariable String id) {
        try {
            CertificateResponse response = certificateService.getCertificate(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
