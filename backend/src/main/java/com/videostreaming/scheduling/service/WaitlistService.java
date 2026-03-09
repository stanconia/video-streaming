package com.videostreaming.scheduling.service;

import com.videostreaming.user.model.User;
import com.videostreaming.scheduling.model.WaitlistEntry;
import com.videostreaming.scheduling.dto.WaitlistEntryResponse;
import com.videostreaming.scheduling.repository.ScheduledClassRepository;
import com.videostreaming.user.repository.UserRepository;
import com.videostreaming.scheduling.repository.WaitlistEntryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WaitlistService {

    private static final Logger logger = LoggerFactory.getLogger(WaitlistService.class);

    private final WaitlistEntryRepository waitlistEntryRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final UserRepository userRepository;

    public WaitlistService(WaitlistEntryRepository waitlistEntryRepository,
                           ScheduledClassRepository scheduledClassRepository,
                           UserRepository userRepository) {
        this.waitlistEntryRepository = waitlistEntryRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WaitlistEntryResponse joinWaitlist(String classId, String studentUserId) {
        scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (waitlistEntryRepository.existsByClassIdAndStudentUserId(classId, studentUserId)) {
            throw new RuntimeException("You are already on the waitlist");
        }

        int nextPosition = waitlistEntryRepository.findMaxPositionByClassId(classId) + 1;

        WaitlistEntry entry = WaitlistEntry.builder()
                .classId(classId)
                .studentUserId(studentUserId)
                .position(nextPosition)
                .build();

        entry = waitlistEntryRepository.save(entry);

        // Update waitlist count on the class
        long count = waitlistEntryRepository.countByClassId(classId);
        scheduledClassRepository.findById(classId).ifPresent(sc -> {
            sc.setWaitlistCount((int) count);
            scheduledClassRepository.save(sc);
        });

        logger.info("User {} joined waitlist for class {} at position {}", studentUserId, classId, nextPosition);
        return toResponse(entry);
    }

    @Transactional
    public void leaveWaitlist(String classId, String studentUserId) {
        WaitlistEntry entry = waitlistEntryRepository.findByClassIdAndStudentUserId(classId, studentUserId)
                .orElseThrow(() -> new RuntimeException("You are not on the waitlist"));

        int removedPosition = entry.getPosition();
        waitlistEntryRepository.delete(entry);

        // Reorder remaining positions
        List<WaitlistEntry> remaining = waitlistEntryRepository.findByClassIdOrderByPositionAsc(classId);
        int pos = 1;
        for (WaitlistEntry e : remaining) {
            if (e.getPosition() != pos) {
                e.setPosition(pos);
                waitlistEntryRepository.save(e);
            }
            pos++;
        }

        // Update waitlist count
        long count = waitlistEntryRepository.countByClassId(classId);
        scheduledClassRepository.findById(classId).ifPresent(sc -> {
            sc.setWaitlistCount((int) count);
            scheduledClassRepository.save(sc);
        });

        logger.info("User {} left waitlist for class {}", studentUserId, classId);
    }

    public List<WaitlistEntryResponse> getWaitlist(String classId) {
        return waitlistEntryRepository.findByClassIdOrderByPositionAsc(classId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WaitlistEntry getNextInLine(String classId) {
        List<WaitlistEntry> entries = waitlistEntryRepository.findByClassIdOrderByPositionAsc(classId);
        if (entries.isEmpty()) return null;

        WaitlistEntry first = entries.get(0);
        waitlistEntryRepository.delete(first);

        // Reorder remaining
        int pos = 1;
        for (int i = 1; i < entries.size(); i++) {
            WaitlistEntry e = entries.get(i);
            e.setPosition(pos);
            waitlistEntryRepository.save(e);
            pos++;
        }

        // Update count
        long count = waitlistEntryRepository.countByClassId(classId);
        scheduledClassRepository.findById(classId).ifPresent(sc -> {
            sc.setWaitlistCount((int) count);
            scheduledClassRepository.save(sc);
        });

        logger.info("Promoted user {} from waitlist for class {}", first.getStudentUserId(), classId);
        return first;
    }

    private WaitlistEntryResponse toResponse(WaitlistEntry entry) {
        String displayName = userRepository.findById(entry.getStudentUserId())
                .map(User::getDisplayName).orElse("Unknown");

        return new WaitlistEntryResponse(
                entry.getId(), entry.getClassId(), entry.getStudentUserId(),
                displayName, entry.getPosition(), entry.getCreatedAt());
    }
}
