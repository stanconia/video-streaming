package com.videostreaming.scheduling.controller;

import com.videostreaming.scheduling.dto.ClassSearchResponse;
import com.videostreaming.scheduling.dto.CreateScheduledClassRequest;
import com.videostreaming.scheduling.dto.ScheduledClassResponse;
import com.videostreaming.scheduling.dto.WaitlistEntryResponse;
import com.videostreaming.payment.service.EscrowPaymentService;
import com.videostreaming.scheduling.service.ScheduledClassService;
import com.videostreaming.scheduling.service.WaitlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classes")
public class ScheduledClassController {

    private final ScheduledClassService scheduledClassService;
    private final WaitlistService waitlistService;
    private final EscrowPaymentService escrowPaymentService;

    public ScheduledClassController(ScheduledClassService scheduledClassService,
                                     WaitlistService waitlistService,
                                     EscrowPaymentService escrowPaymentService) {
        this.scheduledClassService = scheduledClassService;
        this.waitlistService = waitlistService;
        this.escrowPaymentService = escrowPaymentService;
    }

    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody CreateScheduledClassRequest request,
                                          Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(scheduledClassService.createClass(userId, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ScheduledClassResponse>> getUpcomingClasses(
            @RequestParam(required = false) String subject) {
        return ResponseEntity.ok(scheduledClassService.getUpcomingClasses(subject));
    }

    @GetMapping("/my-classes")
    public ResponseEntity<List<ScheduledClassResponse>> getMyClasses(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(scheduledClassService.getMyClasses(userId));
    }

    @GetMapping("/search")
    public ResponseEntity<ClassSearchResponse> searchClasses(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String dir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(scheduledClassService.searchClasses(
                q, subject, minPrice, maxPrice, dateFrom, dateTo, sort, dir, page, size));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<?> getClass(@PathVariable String classId) {
        try {
            return ResponseEntity.ok(scheduledClassService.getClass(classId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{classId}/start")
    public ResponseEntity<?> startClass(@PathVariable String classId, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(scheduledClassService.startClass(classId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{classId}/complete")
    public ResponseEntity<?> completeClass(@PathVariable String classId, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            var response = scheduledClassService.completeClass(classId, userId);
            escrowPaymentService.processClassCompletionPayouts(classId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{classId}")
    public ResponseEntity<?> cancelClass(@PathVariable String classId, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(scheduledClassService.cancelClass(classId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Waitlist endpoints

    @PostMapping("/{classId}/waitlist")
    public ResponseEntity<?> joinWaitlist(@PathVariable String classId, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(waitlistService.joinWaitlist(classId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{classId}/waitlist")
    public ResponseEntity<?> leaveWaitlist(@PathVariable String classId, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            waitlistService.leaveWaitlist(classId, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{classId}/waitlist")
    public ResponseEntity<List<WaitlistEntryResponse>> getWaitlist(@PathVariable String classId) {
        return ResponseEntity.ok(waitlistService.getWaitlist(classId));
    }
}
