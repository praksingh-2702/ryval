package com.ryval.backend.repository;

import com.ryval.backend.model.GhostSession;
import com.ryval.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GhostSessionRepository extends JpaRepository<GhostSession, Long> {
    List<GhostSession> findByUser(User user);
}