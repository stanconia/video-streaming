package com.videostreaming.scheduling.repository;

import com.videostreaming.scheduling.model.WaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, String> {
    List<WaitlistEntry> findByClassIdOrderByPositionAsc(String classId);
    Optional<WaitlistEntry> findByClassIdAndStudentUserId(String classId, String studentUserId);
    boolean existsByClassIdAndStudentUserId(String classId, String studentUserId);
    long countByClassId(String classId);

    @Query("SELECT COALESCE(MAX(w.position), 0) FROM WaitlistEntry w WHERE w.classId = :classId")
    int findMaxPositionByClassId(@Param("classId") String classId);
}
