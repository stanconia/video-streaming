package com.videostreaming.certificate.repository;

import com.videostreaming.certificate.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, String> {
    List<Certificate> findByStudentUserIdOrderByIssuedAtDesc(String studentUserId);
    Optional<Certificate> findByClassIdAndStudentUserId(String classId, String studentUserId);
    boolean existsByClassIdAndStudentUserId(String classId, String studentUserId);
}
