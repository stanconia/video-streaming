package com.videostreaming.user.repository;

import com.videostreaming.user.model.User;
import com.videostreaming.user.model.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(UserRole role);
    Page<User> findByRole(UserRole role, Pageable pageable);
    Page<User> findAllBy(Pageable pageable);
}
